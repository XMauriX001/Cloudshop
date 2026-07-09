import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { Responses } from '../shared/responses';
import { validarAcceso } from '../shared/authMiddleware';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(client);
const PRODUCTOS_TABLE = process.env.PRODUCTOS_TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { httpMethod, path } = event;

    try {
        if (path === '/productos') {
            if (httpMethod === 'POST') return await crearProducto(event);
            if (httpMethod === 'GET') return await obtenerProductos();
            if (httpMethod === 'DELETE') return await eliminarProducto(event);
        }
        return Responses._400('Ruta no encontrada en Catalog Service');
    } catch (error) {
        console.error(error);
        return Responses._500('Error en Catalog Service');
    }
};

const crearProducto = async (event: APIGatewayProxyEvent) => {
    const auth = validarAcceso(event, ['Administrador', 'Operador']);
    if (!auth.autorizado) return Responses._403(auth.error);

    const body = JSON.parse(event.body || '{}');
    if (Object.keys(body).length === 0) return Responses._400('El payload no puede ser un objeto vacío.');

    const nuevoProducto = {
        producto_id: body.codigo || randomUUID(),
        nombre: body.nombre,
        descripcion: body.descripcion,
        categoria: body.categoria,
        precio: body.precio,
        inventario_disponible: body.inventario_disponible,
        tienda_id: body.tienda_id // Tienda propietaria
    };

    await dynamoDb.send(new PutCommand({ TableName: PRODUCTOS_TABLE, Item: nuevoProducto }));
    return Responses._201({ mensaje: 'Producto creado', producto: nuevoProducto });
};

const obtenerProductos = async () => {
    const { Items } = await dynamoDb.send(new ScanCommand({ TableName: PRODUCTOS_TABLE }));
    return Responses._200({ productos: Items });
};

const eliminarProducto = async (event: APIGatewayProxyEvent) => {

    const auth = validarAcceso(event, ['Administrador']);
    if (!auth.autorizado) return Responses._403(auth.error);

    const body = JSON.parse(event.body || '{}');
    if (!body.producto_id) return Responses._400('ID del producto requerido');

    await dynamoDb.send(new DeleteCommand({
        TableName: PRODUCTOS_TABLE,
        Key: { producto_id: body.producto_id }
    }));
    return Responses._200({ mensaje: 'Producto eliminado' });
};