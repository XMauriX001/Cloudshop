import { EventBridgeEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(client);
const PRODUCTOS_TABLE = process.env.PRODUCTOS_TABLE_NAME!;

export const handler = async (event: EventBridgeEvent<'Pedido Creado', any>) => {
    const pedido = event.detail;
    const productos = pedido.productos;

    for (const item of productos) {
        try {
            await dynamoDb.send(new UpdateCommand({
                TableName: PRODUCTOS_TABLE,
                Key: { producto_id: item.producto_id },
                UpdateExpression: 'SET inventario_disponible = inventario_disponible - :cantidad',
                ConditionExpression: 'inventario_disponible >= :cantidad',
                ExpressionAttributeValues: {
                    ':cantidad': item.cantidad
                }
            }));
            console.log(`Inventario actualizado para producto: ${item.producto_id}`);
        } catch (error) {
            console.error(`Error actualizando inventario de ${item.producto_id}. Posible falta de stock.`, error);
        }
    }
};