import { EventBridgeEvent } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const REMITENTE = process.env.SES_SENDER_EMAIL || 'no-reply@tudominio.com';

export const handler = async (event: EventBridgeEvent<'Pedido Creado', any>) => {
    const pedido = event.detail;

    const correoDestino = "cliente_verificado_en_ses@ejemplo.com"; 

    const params = {
        Source: REMITENTE,
        Destination: { ToAddresses: [correoDestino] },
        Message: {
            Subject: { Data: `Confirmación de tu pedido ${pedido.pedido_id}` },
            Body: {
                Text: { Data: `Tu pedido ha sido creado exitosamente con un total de $${pedido.total}. Estado actual: ${pedido.estado}` }
            }
        }
    };

    try {
        await sesClient.send(new SendEmailCommand(params));
        console.log(`Correo enviado exitosamente para el pedido: ${pedido.pedido_id}`);
    } catch (error) {
        console.error('Error enviando correo por SES:', error);
    }
};