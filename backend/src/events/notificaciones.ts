import { EventBridgeEvent } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(dbClient);

const REMITENTE = process.env.SES_SENDER_EMAIL || 'no-reply@tudominio.com';
const USERS_TABLE = process.env.USERS_TABLE_NAME!;

const MENSAJES: Record<string, (pedido: any) => { asunto: string; cuerpo: string }> = {
    'Pedido Creado': (pedido) => ({
        asunto: `Confirmación de tu pedido ${pedido.pedido_id}`,
        cuerpo: `Tu pedido ha sido creado exitosamente con un total de $${pedido.total}. Estado actual: ${pedido.estado}`
    }),
    'Pedido Cancelado': (pedido) => ({
        asunto: `Tu pedido ${pedido.pedido_id} fue cancelado`,
        cuerpo: `Tu pedido con total de $${pedido.total} ha sido cancelado. Si no reconoces esta acción, contáctanos.`
    })
};

export const handler = async (event: EventBridgeEvent<'Pedido Creado' | 'Pedido Cancelado', any>) => {
    const pedido = event.detail;
    const tipoEvento = event['detail-type'];

    try {
        const { Item: usuario } = await dynamoDb.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { usuario_id: pedido.usuario_id }
        }));

        if (!usuario?.correo) {
            console.warn(`No se encontró correo para el usuario ${pedido.usuario_id}, no se envía notificación.`);
            return;
        }

        const mensaje = (MENSAJES[tipoEvento] || MENSAJES['Pedido Creado'])(pedido);

        await sesClient.send(new SendEmailCommand({
            Source: REMITENTE,
            Destination: { ToAddresses: [usuario.correo] },
            Message: {
                Subject: { Data: mensaje.asunto },
                Body: { Text: { Data: mensaje.cuerpo } }
            }
        }));

        console.log(`Correo enviado exitosamente para el pedido: ${pedido.pedido_id}`);
    } catch (error) {
        console.error('Error enviando correo por SES:', error);
    }
};