import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { Responses } from '../shared/responses';
import { validarAcceso } from '../shared/authMiddleware';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(client);
const CARRITOS_TABLE = process.env.CARRITOS_TABLE_NAME!;
const PRODUCTOS_TABLE = process.env.PRODUCTOS_TABLE_NAME!;

interface ItemCarrito {
    producto_id: string;
    nombre: string;
    precio_unitario: number;
    cantidad: number;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { httpMethod, path, resource, pathParameters } = event;

    try {
        const auth = validarAcceso(event, ['Cliente']);
        if (!auth.autorizado) return Responses._403(auth.error);
        const usuarioId = auth.usuario!.usuario_id;

        if (path === '/carrito' || resource === '/carrito') {
            if (httpMethod === 'GET') return await consultarCarrito(usuarioId);
            if (httpMethod === 'POST') return await agregarProducto(event, usuarioId);
            if (httpMethod === 'PUT') return await modificarCantidad(event, usuarioId);
            if (httpMethod === 'DELETE') return await vaciarCarrito(usuarioId);
        }
        else if (resource === '/carrito/{producto_id}' && pathParameters?.producto_id) {
            if (httpMethod === 'DELETE') return await eliminarProducto(usuarioId, pathParameters.producto_id);
        }

        return Responses._400('Ruta no soportada en Cart Service');
    } catch (error) {
        console.error('Error en Cart Service:', error);
        return Responses._500('Error interno procesando el carrito');
    }
};

const obtenerCarrito = async (usuarioId: string): Promise<ItemCarrito[]> => {
    const { Item } = await dynamoDb.send(new GetCommand({ TableName: CARRITOS_TABLE, Key: { usuario_id: usuarioId } }));
    return Item?.productos || [];
};

const guardarCarrito = async (usuarioId: string, productos: ItemCarrito[]) => {
    await dynamoDb.send(new PutCommand({
        TableName: CARRITOS_TABLE,
        Item: { usuario_id: usuarioId, productos, fecha_actualizacion: new Date().toISOString() }
    }));
};

const calcularTotal = (productos: ItemCarrito[]) => productos.reduce((acc, p) => acc + p.precio_unitario * p.cantidad, 0);

const consultarCarrito = async (usuarioId: string) => {
    const productos = await obtenerCarrito(usuarioId);
    return Responses._200({ productos, total: calcularTotal(productos) });
};

const agregarProducto = async (event: APIGatewayProxyEvent, usuarioId: string) => {
    const body = JSON.parse(event.body || '{}');
    const { producto_id, cantidad } = body;

    if (!producto_id) return Responses._400('El campo "producto_id" es obligatorio.');
    if (!cantidad || typeof cantidad !== 'number' || cantidad <= 0) return Responses._400('El campo "cantidad" debe ser un número mayor a 0.');

    const { Item: producto } = await dynamoDb.send(new GetCommand({ TableName: PRODUCTOS_TABLE, Key: { producto_id } }));
    if (!producto) return Responses._404('El producto no existe.');
    if (producto.inventario_disponible < cantidad) return Responses._400(`Inventario insuficiente. Disponible: ${producto.inventario_disponible}`);

    const carrito = await obtenerCarrito(usuarioId);
    const existente = carrito.find(p => p.producto_id === producto_id);

    if (existente) {
        const nuevaCantidad = existente.cantidad + cantidad;
        if (producto.inventario_disponible < nuevaCantidad) return Responses._400(`Inventario insuficiente. Disponible: ${producto.inventario_disponible}`);
        existente.cantidad = nuevaCantidad;
    } else {
        carrito.push({ producto_id, nombre: producto.nombre, precio_unitario: producto.precio, cantidad });
    }

    await guardarCarrito(usuarioId, carrito);
    return Responses._200({ mensaje: 'Producto agregado al carrito', productos: carrito, total: calcularTotal(carrito) });
};

const modificarCantidad = async (event: APIGatewayProxyEvent, usuarioId: string) => {
    const body = JSON.parse(event.body || '{}');
    const { producto_id, cantidad } = body;

    if (!producto_id) return Responses._400('El campo "producto_id" es obligatorio.');
    if (cantidad === undefined || typeof cantidad !== 'number') return Responses._400('El campo "cantidad" es obligatorio y debe ser numérico.');

    const carrito = await obtenerCarrito(usuarioId);
    const item = carrito.find(p => p.producto_id === producto_id);
    if (!item) return Responses._404('El producto no está en el carrito.');

    if (cantidad <= 0) {
        // Cantidad 0 o negativa = remover el producto del carrito
        const carritoActualizado = carrito.filter(p => p.producto_id !== producto_id);
        await guardarCarrito(usuarioId, carritoActualizado);
        return Responses._200({ mensaje: 'Cantidad en 0: producto removido del carrito', productos: carritoActualizado, total: calcularTotal(carritoActualizado) });
    }

    const { Item: producto } = await dynamoDb.send(new GetCommand({ TableName: PRODUCTOS_TABLE, Key: { producto_id } }));
    if (producto && producto.inventario_disponible < cantidad) return Responses._400(`Inventario insuficiente. Disponible: ${producto.inventario_disponible}`);

    item.cantidad = cantidad;
    await guardarCarrito(usuarioId, carrito);
    return Responses._200({ mensaje: 'Cantidad actualizada', productos: carrito, total: calcularTotal(carrito) });
};

const eliminarProducto = async (usuarioId: string, productoId: string) => {
    const carrito = await obtenerCarrito(usuarioId);
    const carritoActualizado = carrito.filter(p => p.producto_id !== productoId);

    if (carrito.length === carritoActualizado.length) return Responses._404('El producto no está en el carrito.');

    await guardarCarrito(usuarioId, carritoActualizado);
    return Responses._200({ mensaje: 'Producto eliminado del carrito', productos: carritoActualizado, total: calcularTotal(carritoActualizado) });
};

const vaciarCarrito = async (usuarioId: string) => {
    await dynamoDb.send(new DeleteCommand({ TableName: CARRITOS_TABLE, Key: { usuario_id: usuarioId } }));
    return Responses._200({ mensaje: 'Carrito vaciado correctamente', productos: [], total: 0 });
};