import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { randomUUID } from 'crypto';
import { Responses } from '../shared/responses';
import { validarAcceso } from '../shared/authMiddleware';

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(dbClient);
const eventBridge = new EventBridgeClient({ region: process.env.AWS_REGION || 'us-east-1' });

const PEDIDOS_TABLE = process.env.PEDIDOS_TABLE_NAME!;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'default';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod === 'POST' && event.path === '/pedidos') {
        return await crearPedido(event);
    }
    return Responses._400('Ruta no soportada en Order Service');
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

    const eventParams = {
        Entries: [{
            Source: 'cloudshop.orders',
            DetailType: 'Pedido Creado',
            Detail: JSON.stringify(nuevoPedido),
            EventBusName: EVENT_BUS_NAME
        }]
    };

    await eventBridge.send(new PutEventsCommand(eventParams));

    return Responses._201({ 
        mensaje: 'Pedido creado exitosamente y evento emitido', 
        pedido: nuevoPedido 
    });
};