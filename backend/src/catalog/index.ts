import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { Responses } from '../shared/responses';
import { validarAcceso } from '../shared/authMiddleware';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(client);
const PRODUCTOS_TABLE = process.env.PRODUCTOS_TABLE_NAME!;
const TIENDAS_TABLE = process.env.TIENDAS_TABLE_NAME; // opcional, para validar tienda_id

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { httpMethod, path, resource, pathParameters } = event;

    try {
        if (path === '/productos' || resource === '/productos') {
            if (httpMethod === 'POST') return await crearProducto(event);
            if (httpMethod === 'GET') return await obtenerProductos();
        }
        else if (resource === '/productos/{id}' && pathParameters?.id) {
            const productoId = pathParameters.id;
            if (httpMethod === 'GET') return await obtenerProductoPorId(productoId);
            if (httpMethod === 'PUT') return await actualizarProducto(event, productoId);
            if (httpMethod === 'DELETE') return await eliminarProducto(event, productoId);
        }
        return Responses._400('Ruta no encontrada en Catalog Service');
    } catch (error) {
        console.error(error);
        return Responses._500('Error en Catalog Service');
    }
};

const validarCamposProducto = (body: any, esCreacion: boolean): string | null => {
    if (esCreacion && !body.codigo) return 'El campo "codigo" es obligatorio.';
    if (!body.nombre) return 'El campo "nombre" es obligatorio.';
    if (!body.descripcion) return 'El campo "descripcion" es obligatorio.';
    if (!body.categoria) return 'El campo "categoria" es obligatorio.';
    if (body.precio === undefined || typeof body.precio !== 'number' || body.precio <= 0) return 'El campo "precio" debe ser un número mayor a 0.';
    if (body.inventario_disponible === undefined || typeof body.inventario_disponible !== 'number' || body.inventario_disponible < 0) return 'El campo "inventario_disponible" debe ser un número mayor o igual a 0.';
    if (!body.tienda_id) return 'El campo "tienda_id" (tienda propietaria) es obligatorio.';
    return null;
};

const validarTiendaExiste = async (tienda_id: string): Promise<boolean> => {
    if (!TIENDAS_TABLE) return true;
    const { Item } = await dynamoDb.send(new GetCommand({ TableName: TIENDAS_TABLE, Key: { tienda_id } }));
    return !!Item && Item.estado === 'ACTIVA';
};

const crearProducto = async (event: APIGatewayProxyEvent) => {
    const auth = validarAcceso(event, ['Administrador', 'Operador']);
    if (!auth.autorizado) return Responses._403(auth.error);

    const body = JSON.parse(event.body || '{}');
    if (Object.keys(body).length === 0) return Responses._400('El payload no puede ser un objeto vacío.');

    const errorValidacion = validarCamposProducto(body, true);
    if (errorValidacion) return Responses._400(errorValidacion);

    const tiendaValida = await validarTiendaExiste(body.tienda_id);
    if (!tiendaValida) return Responses._400('La tienda propietaria indicada no existe o está inactiva.');

    const nuevoProducto = {
        producto_id: body.codigo,
        codigo: body.codigo,
        nombre: body.nombre,
        descripcion: body.descripcion,
        categoria: body.categoria,
        precio: body.precio,
        inventario_disponible: body.inventario_disponible,
        tienda_id: body.tienda_id
    };

    try {
        await dynamoDb.send(new PutCommand({
            TableName: PRODUCTOS_TABLE,
            Item: nuevoProducto,
            ConditionExpression: 'attribute_not_exists(producto_id)'
        }));
        return Responses._201({ mensaje: 'Producto creado', producto: nuevoProducto });
    } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') return Responses._400('Ya existe un producto con ese código.');
        throw error;
    }
};

const obtenerProductos = async () => {
    const { Items } = await dynamoDb.send(new ScanCommand({ TableName: PRODUCTOS_TABLE }));
    return Responses._200({ productos: Items || [] });
};

const obtenerProductoPorId = async (productoId: string) => {
    const { Item } = await dynamoDb.send(new GetCommand({ TableName: PRODUCTOS_TABLE, Key: { producto_id: productoId } }));
    if (!Item) return Responses._404('Producto no encontrado.');
    return Responses._200({ producto: Item });
};

const actualizarProducto = async (event: APIGatewayProxyEvent, productoId: string) => {
    const auth = validarAcceso(event, ['Administrador', 'Operador']);
    if (!auth.autorizado) return Responses._403(auth.error);

    const body = JSON.parse(event.body || '{}');
    if (Object.keys(body).length === 0) return Responses._400('El payload no puede ser un objeto vacío.');

    if (body.tienda_id) {
        const tiendaValida = await validarTiendaExiste(body.tienda_id);
        if (!tiendaValida) return Responses._400('La tienda propietaria indicada no existe o está inactiva.');
    }

    const campos: Record<string, any> = { nombre: body.nombre, descripcion: body.descripcion, categoria: body.categoria, precio: body.precio, inventario_disponible: body.inventario_disponible, tienda_id: body.tienda_id };
    const updateFields: string[] = [];
    const values: Record<string, any> = {};

    for (const [key, value] of Object.entries(campos)) {
        if (value !== undefined) {
            updateFields.push(`${key} = :${key}`);
            values[`:${key}`] = value;
        }
    }

    if (updateFields.length === 0) return Responses._400('No se proporcionó ningún campo válido para actualizar.');

    if (values[':precio'] !== undefined && (typeof values[':precio'] !== 'number' || values[':precio'] <= 0)) {
        return Responses._400('El campo "precio" debe ser un número mayor a 0.');
    }
    if (values[':inventario_disponible'] !== undefined && (typeof values[':inventario_disponible'] !== 'number' || values[':inventario_disponible'] < 0)) {
        return Responses._400('El campo "inventario_disponible" debe ser un número mayor o igual a 0.');
    }

    try {
        await dynamoDb.send(new UpdateCommand({
            TableName: PRODUCTOS_TABLE,
            Key: { producto_id: productoId },
            UpdateExpression: 'SET ' + updateFields.join(', '),
            ExpressionAttributeValues: values,
            ConditionExpression: 'attribute_exists(producto_id)'
        }));
        return Responses._200({ mensaje: 'Producto actualizado correctamente.' });
    } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') return Responses._404('Producto no encontrado.');
        throw error;
    }
};

const eliminarProducto = async (event: APIGatewayProxyEvent, productoId: string) => {
    const auth = validarAcceso(event, ['Administrador']);
    if (!auth.autorizado) return Responses._403(auth.error);

    try {
        await dynamoDb.send(new DeleteCommand({
            TableName: PRODUCTOS_TABLE,
            Key: { producto_id: productoId },
            ConditionExpression: 'attribute_exists(producto_id)'
        }));
        return Responses._200({ mensaje: 'Producto eliminado' });
    } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') return Responses._404('Producto no encontrado.');
        throw error;
    }
};