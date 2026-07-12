import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { validateRegisterPayload, RegisterBody } from './validation';
import { Responses } from '../shared/responses';
import { validarAcceso } from '../shared/authMiddleware';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE_NAME!;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secreto-desarrollo';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { httpMethod, path, resource, pathParameters } = event;

    try {
        if (httpMethod === 'POST' && (path === '/usuarios' || resource === '/usuarios')) {
            return await registrarUsuario(event);
        }
        else if (httpMethod === 'POST' && path === '/usuarios/login') {
            return await loginUsuario(event);
        }
        else if (httpMethod === 'GET' && (path === '/usuarios' || resource === '/usuarios')) {
            return await consultarUsuarios(event);
        }
        else if (resource === '/usuarios/{id}' && pathParameters?.id) {
            const usuarioId = pathParameters.id;
            if (httpMethod === 'GET') return await consultarUsuarioPorId(event, usuarioId);
            if (httpMethod === 'PUT') return await actualizarUsuario(event, usuarioId);
            if (httpMethod === 'DELETE') return await desactivarUsuario(event, usuarioId);
        }

        return Responses._400('Ruta o método no soportado en Auth Service');

    } catch (error: any) {
        console.error('Error en Auth Service:', error);
        return Responses._500('Error interno al procesar la solicitud.');
    }
};

const registrarUsuario = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (!event.body) return Responses._400('Cuerpo vacío.');
    const body: RegisterBody = JSON.parse(event.body);

    const validation = validateRegisterPayload(body);
    if (!validation.isValid) return Responses._400(validation.error as string);

    // El auto-registro público solo puede crear clientes. Crear un Administrador
    // u Operador requiere estar autenticado como Administrador (evita escalación de privilegios).
    if (body.rol !== 'Cliente') {
        const auth = validarAcceso(event, ['Administrador']);
        if (!auth.autorizado) return Responses._403('Solo un Administrador puede crear usuarios con rol Administrador u Operador.');
    }

    const passwordHash = await bcrypt.hash(body.password!, 10);
    const nuevoUsuario = {
        usuario_id: randomUUID(),
        correo: body.correo,
        nombre: body.nombre,
        password_hash: passwordHash,
        rol: body.rol,
        estado: 'ACTIVO',
        fecha_registro: new Date().toISOString()
    };

    try {
        await dynamoDb.send(new PutCommand({
            TableName: USERS_TABLE,
            Item: nuevoUsuario,
            ConditionExpression: 'attribute_not_exists(correo)'
        }));
        return Responses._201({ mensaje: 'Usuario registrado', id: nuevoUsuario.usuario_id });
    } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') return Responses._400('Correo ya registrado.');
        throw error;
    }
};

const loginUsuario = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (!event.body) return Responses._400('Credenciales requeridas.');
    const { correo, password } = JSON.parse(event.body);

    if (!correo || !password) return Responses._400('Correo y password son obligatorios.');

    const { Items } = await dynamoDb.send(new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: 'CorreoIndex',
        KeyConditionExpression: 'correo = :correo',
        ExpressionAttributeValues: { ':correo': correo }
    }));

    const usuario = Items?.[0];

    if (!usuario) return Responses._400('Credenciales inválidas.');
    if (usuario.estado !== 'ACTIVO') return Responses._403('Usuario inactivo o suspendido.');

    const isValidPassword = await bcrypt.compare(password, usuario.password_hash);
    if (!isValidPassword) return Responses._400('Credenciales inválidas.');

    const token = jwt.sign(
        {
            usuario_id: usuario.usuario_id,
            correo: usuario.correo,
            rol: usuario.rol
        },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    return Responses._200({
        mensaje: 'Login exitoso',
        token,
        rol: usuario.rol
    });
};

const consultarUsuarios = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const auth = validarAcceso(event, ['Administrador', 'Operador']);
    if (!auth.autorizado) return Responses._403(auth.error);

    const { Items } = await dynamoDb.send(new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: 'estado = :estado',
        ExpressionAttributeValues: { ':estado': 'ACTIVO' },
        ProjectionExpression: 'usuario_id, nombre, correo, rol, fecha_registro'
    }));

    return Responses._200({ usuarios: Items || [] });
};

const consultarUsuarioPorId = async (event: APIGatewayProxyEvent, usuarioId: string): Promise<APIGatewayProxyResult> => {
    const auth = validarAcceso(event, ['Administrador', 'Operador', 'Cliente']);
    if (!auth.autorizado) return Responses._403(auth.error);

    if (auth.usuario!.rol === 'Cliente' && auth.usuario!.usuario_id !== usuarioId) {
        return Responses._403('No tienes permiso para consultar este usuario.');
    }

    const { Item } = await dynamoDb.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { usuario_id: usuarioId }
    }));

    if (!Item) return Responses._404('Usuario no encontrado.');

    const { password_hash, ...usuarioSinPassword } = Item;
    return Responses._200({ usuario: usuarioSinPassword });
};

const actualizarUsuario = async (event: APIGatewayProxyEvent, usuarioId: string): Promise<APIGatewayProxyResult> => {
    const auth = validarAcceso(event, ['Administrador', 'Operador', 'Cliente']);
    if (!auth.autorizado) return Responses._403(auth.error);

    const esPropio = auth.usuario!.usuario_id === usuarioId;
    const esAdmin = auth.usuario!.rol === 'Administrador';

    if (!esPropio && !esAdmin) return Responses._403('No tienes permiso para actualizar este usuario.');

    if (!event.body) return Responses._400('Cuerpo vacío.');
    const body = JSON.parse(event.body);

    const updateFields: string[] = [];
    const values: Record<string, any> = {};

    if (body.nombre) {
        updateFields.push('nombre = :nombre');
        values[':nombre'] = body.nombre;
    }

    if (body.password) {
        values[':password_hash'] = await bcrypt.hash(body.password, 10);
        updateFields.push('password_hash = :password_hash');
    }

    if (body.rol) {
        if (!esAdmin) return Responses._403('Solo un Administrador puede cambiar el rol de un usuario.');
        const rolesPermitidos = ['Administrador', 'Operador', 'Cliente'];
        if (!rolesPermitidos.includes(body.rol)) return Responses._400(`Rol inválido. Roles permitidos: ${rolesPermitidos.join(', ')}`);
        updateFields.push('rol = :rol');
        values[':rol'] = body.rol;
    }

    if (body.estado) {
        if (!esAdmin) return Responses._403('Solo un Administrador puede cambiar el estado de un usuario.');
        const estadosPermitidos = ['ACTIVO', 'INACTIVO'];
        if (!estadosPermitidos.includes(body.estado)) return Responses._400(`Estado inválido. Estados permitidos: ${estadosPermitidos.join(', ')}`);
        updateFields.push('estado = :estado');
        values[':estado'] = body.estado;
    }

    if (updateFields.length === 0) return Responses._400('No se proporcionó ningún campo válido para actualizar (nombre, password, rol, estado).');

    try {
        await dynamoDb.send(new UpdateCommand({
            TableName: USERS_TABLE,
            Key: { usuario_id: usuarioId },
            UpdateExpression: 'SET ' + updateFields.join(', '),
            ExpressionAttributeValues: values,
            ConditionExpression: 'attribute_exists(usuario_id)'
        }));
        return Responses._200({ mensaje: 'Usuario actualizado correctamente.' });
    } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') return Responses._404('Usuario no encontrado.');
        throw error;
    }
};

const desactivarUsuario = async (event: APIGatewayProxyEvent, usuarioId: string): Promise<APIGatewayProxyResult> => {
    const auth = validarAcceso(event, ['Administrador']);
    if (!auth.autorizado) return Responses._403(auth.error);

    try {
        await dynamoDb.send(new UpdateCommand({
            TableName: USERS_TABLE,
            Key: { usuario_id: usuarioId },
            UpdateExpression: 'SET estado = :inactivo',
            ExpressionAttributeValues: { ':inactivo': 'INACTIVO' },
            ConditionExpression: 'attribute_exists(usuario_id)'
        }));
        return Responses._200({ mensaje: 'Usuario desactivado correctamente.' });
    } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') return Responses._404('Usuario no encontrado.');
        throw error;
    }
};