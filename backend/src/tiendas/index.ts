import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { Responses } from '../shared/responses';
import { validarAcceso } from '../shared/authMiddleware';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(client);
const TIENDAS_TABLE = process.env.TIENDAS_TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { httpMethod, path, resource, pathParameters } = event;

    try {
        if (path === '/tiendas' || resource === '/tiendas') {
            if (httpMethod === 'GET') return await consultarTiendas();
            if (httpMethod === 'POST') return await crearTienda(event);
        }
        else if (resource === '/tiendas/{id}' && pathParameters?.id) {
            const tiendaId = pathParameters.id;
            if (httpMethod === 'GET') return await consultarTiendaPorId(tiendaId);
            if (httpMethod === 'PUT') return await actualizarTienda(event, tiendaId);
            if (httpMethod === 'DELETE') return await desactivarTienda(event, tiendaId);
        }
        return Responses._400('Ruta no soportada en Store Service');
    } catch (error) {
        console.error('Error en Tiendas Service:', error);
        return Responses._500('Error interno procesando la tienda');
    }
};

const consultarTiendas = async () => {
    const { Items } = await dynamoDb.send(new ScanCommand({
        TableName: TIENDAS_TABLE,
        FilterExpression: 'estado = :estado',
        ExpressionAttributeValues: { ':estado': 'ACTIVA' }
    }));
    return Responses._200({ tiendas: Items || [] });
};

const consultarTiendaPorId = async (tiendaId: string) => {
    const { Item } = await dynamoDb.send(new GetCommand({ TableName: TIENDAS_TABLE, Key: { tienda_id: tiendaId } }));
    if (!Item) return Responses._404('Tienda no encontrada.');
    return Responses._200({ tienda: Item });
};

const crearTienda = async (event: APIGatewayProxyEvent) => {
    const auth = validarAcceso(event, ['Administrador']);
    if (!auth.autorizado) return Responses._403(auth.error);

    const data = JSON.parse(event.body || '{}');
    if (!data.nombre) return Responses._400('El campo "nombre" es obligatorio.');

    const nuevaTienda = {
        tienda_id: `TIENDA-${randomUUID()}`,
        nombre: data.nombre,
        ubicacion: data.ubicacion || 'No especificada',
        estado: 'ACTIVA'
    };
    await dynamoDb.send(new PutCommand({ TableName: TIENDAS_TABLE, Item: nuevaTienda }));
    return Responses._201({ mensaje: 'Tienda creada', tienda: nuevaTienda });
};

const actualizarTienda = async (event: APIGatewayProxyEvent, tiendaId: string) => {
    const auth = validarAcceso(event, ['Administrador']);
    if (!auth.autorizado) return Responses._403(auth.error);

    const data = JSON.parse(event.body || '{}');
    const updateFields: string[] = [];
    const values: Record<string, any> = {};

    if (data.nombre) { updateFields.push('nombre = :nombre'); values[':nombre'] = data.nombre; }
    if (data.ubicacion) { updateFields.push('ubicacion = :ubicacion'); values[':ubicacion'] = data.ubicacion; }

    if (updateFields.length === 0) return Responses._400('No se proporcionó ningún campo válido para actualizar (nombre, ubicacion).');

    try {
        await dynamoDb.send(new UpdateCommand({
            TableName: TIENDAS_TABLE,
            Key: { tienda_id: tiendaId },
            UpdateExpression: 'SET ' + updateFields.join(', '),
            ExpressionAttributeValues: values,
            ConditionExpression: 'attribute_exists(tienda_id)'
        }));
        return Responses._200({ mensaje: 'Tienda actualizada exitosamente' });
    } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') return Responses._404('Tienda no encontrada.');
        throw error;
    }
};

const desactivarTienda = async (event: APIGatewayProxyEvent, tiendaId: string) => {
    const auth = validarAcceso(event, ['Administrador']);
    if (!auth.autorizado) return Responses._403(auth.error);

    try {
        await dynamoDb.send(new UpdateCommand({
            TableName: TIENDAS_TABLE,
            Key: { tienda_id: tiendaId },
            UpdateExpression: 'SET estado = :inactiva',
            ExpressionAttributeValues: { ':inactiva': 'INACTIVA' },
            ConditionExpression: 'attribute_exists(tienda_id)'
        }));
        return Responses._200({ mensaje: 'Tienda desactivada correctamente' });
    } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') return Responses._404('Tienda no encontrada.');
        throw error;
    }
};