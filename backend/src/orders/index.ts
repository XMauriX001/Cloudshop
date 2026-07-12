import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { randomUUID } from 'crypto';
import { Responses } from '../shared/responses';
import { validarAcceso } from '../shared/authMiddleware';

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(dbClient);
const eventBridge = new EventBridgeClient({ region: process.env.AWS_REGION || 'us-east-1' });

const PEDIDOS_TABLE = process.env.PEDIDOS_TABLE_NAME!;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'default';

export const ESTADOS_PEDIDO = ['Pendiente', 'Confirmado', 'En preparación', 'Enviado', 'Entregado', 'Cancelado'];
const ESTADOS_TERMINALES = ['Entregado', 'Cancelado'];
const ESTADOS_CANCELABLES_POR_CLIENTE = ['Pendiente', 'Confirmado'];

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { httpMethod, path, resource, pathParameters } = event;

    try {
        if (path === '/pedidos' || resource === '/pedidos') {
            if (httpMethod === 'POST') return await crearPedido(event);
            if (httpMethod === 'GET') return await consultarPedidos(event);
        }
        else if (resource === '/pedidos/{id}' && pathParameters?.id) {
            const pedidoId = pathParameters.id;
            if (httpMethod === 'GET') return await consultarPedidoPorId(event, pedidoId);
            if (httpMethod === 'PUT') return await actualizarEstado(event, pedidoId);
            if (httpMethod === 'DELETE') return await cancelarPedido(event, pedidoId);
        }
        return Responses._400('Ruta no soportada en Order Service');
    } catch (error) {
        console.error('Error en Order Service:', error);
        return Responses._500('Error en Order Service');
    }
};

const emitirEvento = async (detailType: string, detail: any) => {
    await eventBridge.send(new PutEventsCommand({
        Entries: [{ Source: 'cloudshop.orders', DetailType: detailType, Detail: JSON.stringify(detail), EventBusName: EVENT_BUS_NAME }]
    }));
};

const crearPedido = async (event: APIGatewayProxyEvent) => {
    const auth = validarAcceso(event, ['Cliente']);
    if (!auth.autorizado) return Responses._403(auth.error);

    const body = JSON.parse(event.body || '{}');

    if (!body.productos || Object.keys(body.productos).length === 0 || body.productos.length === 0) {
        return Responses._400('El carrito de compras está vacío o es un objeto inválido. Debes agregar productos.');
    }

    const nuevoPedido = {
        pedido_id: randomUUID(),
        usuario_id: auth.usuario!.usuario_id,
        productos: body.productos,
        total: body.total,
        estado: 'Pendiente',
        fecha: new Date().toISOString()
    };

    await dynamoDb.send(new PutCommand({ TableName: PEDIDOS_TABLE, Item: nuevoPedido }));
    await emitirEvento('Pedido Creado', nuevoPedido);

    return Responses._201({ mensaje: 'Pedido creado exitosamente y evento emitido', pedido: nuevoPedido });
};

const consultarPedidos = async (event: APIGatewayProxyEvent) => {
    const auth = validarAcceso(event, ['Administrador', 'Operador', 'Cliente']);
    if (!auth.autorizado) return Responses._403(auth.error);

    if (auth.usuario!.rol === 'Cliente') {
        const { Items } = await dynamoDb.send(new ScanCommand({
            TableName: PEDIDOS_TABLE,
            FilterExpression: 'usuario_id = :uid',
            ExpressionAttributeValues: { ':uid': auth.usuario!.usuario_id }
        }));
        return Responses._200({ pedidos: Items || [] });
    }

    const { Items } = await dynamoDb.send(new ScanCommand({ TableName: PEDIDOS_TABLE }));
    return Responses._200({ pedidos: Items || [] });
};

const consultarPedidoPorId = async (event: APIGatewayProxyEvent, pedidoId: string) => {
    const auth = validarAcceso(event, ['Administrador', 'Operador', 'Cliente']);
    if (!auth.autorizado) return Responses._403(auth.error);

    const { Item } = await dynamoDb.send(new GetCommand({ TableName: PEDIDOS_TABLE, Key: { pedido_id: pedidoId } }));
    if (!Item) return Responses._404('Pedido no encontrado.');

    if (auth.usuario!.rol === 'Cliente' && Item.usuario_id !== auth.usuario!.usuario_id) {
        return Responses._403('No tienes permiso para consultar este pedido.');
    }

    return Responses._200({ pedido: Item });
};

const actualizarEstado = async (event: APIGatewayProxyEvent, pedidoId: string) => {
    const auth = validarAcceso(event, ['Administrador', 'Operador']);
    if (!auth.autorizado) return Responses._403(auth.error);

    const body = JSON.parse(event.body || '{}');
    if (!body.estado || !ESTADOS_PEDIDO.includes(body.estado)) {
        return Responses._400(`Estado inválido. Estados permitidos: ${ESTADOS_PEDIDO.join(', ')}`);
    }

    const { Item: pedido } = await dynamoDb.send(new GetCommand({ TableName: PEDIDOS_TABLE, Key: { pedido_id: pedidoId } }));
    if (!pedido) return Responses._404('Pedido no encontrado.');

    if (ESTADOS_TERMINALES.includes(pedido.estado)) {
        return Responses._400(`El pedido ya está en estado terminal "${pedido.estado}" y no puede cambiar de estado.`);
    }

    await dynamoDb.send(new UpdateCommand({
        TableName: PEDIDOS_TABLE,
        Key: { pedido_id: pedidoId },
        UpdateExpression: 'SET estado = :estado',
        ExpressionAttributeValues: { ':estado': body.estado }
    }));

    if (body.estado === 'Cancelado') {
        await emitirEvento('Pedido Cancelado', { ...pedido, estado: 'Cancelado' });
    }

    return Responses._200({ mensaje: `Estado del pedido actualizado a "${body.estado}"` });
};

const cancelarPedido = async (event: APIGatewayProxyEvent, pedidoId: string) => {
    const auth = validarAcceso(event, ['Administrador', 'Operador', 'Cliente']);
    if (!auth.autorizado) return Responses._403(auth.error);

    const { Item: pedido } = await dynamoDb.send(new GetCommand({ TableName: PEDIDOS_TABLE, Key: { pedido_id: pedidoId } }));
    if (!pedido) return Responses._404('Pedido no encontrado.');

    if (auth.usuario!.rol === 'Cliente') {
        if (pedido.usuario_id !== auth.usuario!.usuario_id) return Responses._403('No tienes permiso para cancelar este pedido.');
        if (!ESTADOS_CANCELABLES_POR_CLIENTE.includes(pedido.estado)) {
            return Responses._400(`No puedes cancelar un pedido en estado "${pedido.estado}". Solo se permite cuando está Pendiente o Confirmado.`);
        }
    } else {
        if (ESTADOS_TERMINALES.includes(pedido.estado)) {
            return Responses._400(`El pedido ya está en estado terminal "${pedido.estado}" y no puede cancelarse.`);
        }
    }

    await dynamoDb.send(new UpdateCommand({
        TableName: PEDIDOS_TABLE,
        Key: { pedido_id: pedidoId },
        UpdateExpression: 'SET estado = :cancelado',
        ExpressionAttributeValues: { ':cancelado': 'Cancelado' }
    }));

    await emitirEvento('Pedido Cancelado', { ...pedido, estado: 'Cancelado' });

    return Responses._200({ mensaje: 'Pedido cancelado correctamente' });
};