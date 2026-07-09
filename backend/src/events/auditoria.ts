import { EventBridgeEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(client);
const AUDITORIA_TABLE = process.env.AUDITORIA_TABLE_NAME!;

export const handler = async (event: EventBridgeEvent<'Pedido Creado', any>) => {
    const pedido = event.detail;

    const registroAuditoria = {
        auditoria_id: randomUUID(),
        usuario: pedido.usuario_id,       
        accion: 'CREACION_DE_PEDIDO',     
        fecha: new Date().toISOString().split('T')[0], 
        resultado: 'EXITOSO'             
    };

    try {
        await dynamoDb.send(new PutCommand({
            TableName: AUDITORIA_TABLE,
            Item: registroAuditoria
        }));
        console.log(`Auditoría registrada para pedido: ${pedido.pedido_id}`);
    } catch (error) {
        console.error('Error guardando auditoría:', error);
    }
};