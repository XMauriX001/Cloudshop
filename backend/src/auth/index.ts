import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { validateRegisterPayload, RegisterBody } from './validation';
import { Responses } from '../shared/responses';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE_NAME!;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secreto-desarrollo';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { httpMethod, path, resource } = event;

    try {
        
        if (httpMethod === 'POST' && (path === '/usuarios' || resource === '/usuarios')) {
            return await registrarUsuario(event);
        } 
        else if (httpMethod === 'POST' && path === '/usuarios/login') {
            return await loginUsuario(event);
        } 
        else if (httpMethod === 'GET' && (path === '/usuarios' || resource === '/usuarios')) {
            return await consultarUsuarios();
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

const consultarUsuarios = async (): Promise<APIGatewayProxyResult> => {
    const { Items } = await dynamoDb.send(new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: 'estado = :estado',
        ExpressionAttributeValues: { ':estado': 'ACTIVO' },
        ProjectionExpression: 'usuario_id, nombre, correo, rol, fecha_registro'
    }));

    return Responses._200({ usuarios: Items || [] });
};