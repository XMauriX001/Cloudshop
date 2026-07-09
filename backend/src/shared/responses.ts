import { APIGatewayProxyResult } from 'aws-lambda';

const buildResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
});

export const Responses = {
    _200: (data: any) => buildResponse(200, data),
    _201: (data: any) => buildResponse(201, data),
    _400: (message: string) => buildResponse(400, { error: message }),
    _403: (message: string = 'Forbidden - Acceso sin permisos') => buildResponse(403, { error: message }), // Caso de prueba 1
    _500: (message: string = 'Error interno del servidor') => buildResponse(500, { error: message }),
};