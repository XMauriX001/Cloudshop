import * as jwt from 'jsonwebtoken';
import { APIGatewayProxyEvent } from 'aws-lambda';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secreto-desarrollo';

export interface AuthResult {
    autorizado: boolean;
    error?: string;
    usuario?: {
        usuario_id: string;
        correo: string;
        rol: string;
    };
}

export const validarAcceso = (event: APIGatewayProxyEvent, rolesPermitidos: string[]): AuthResult => {
   
    const authHeader = event.headers.Authorization || event.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { autorizado: false, error: 'Token de autenticación no proporcionado o formato inválido.' };
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodificado = jwt.verify(token, JWT_SECRET) as any;

        if (!rolesPermitidos.includes(decodificado.rol)) {
            return { autorizado: false, error: 'Forbidden - Acceso sin permisos' };
        }

        return { autorizado: true, usuario: decodificado };
    } catch (error) {
        return { autorizado: false, error: 'Token inválido o ha expirado.' };
    }
};