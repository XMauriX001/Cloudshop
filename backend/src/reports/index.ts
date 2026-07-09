import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Responses } from '../shared/responses';
import { validarAcceso } from '../shared/authMiddleware';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(client);

const PEDIDOS_TABLE = process.env.PEDIDOS_TABLE_NAME!;
const PRODUCTOS_TABLE = process.env.PRODUCTOS_TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const auth = validarAcceso(event, ['Administrador']);
    if (!auth.autorizado) return Responses._403(auth.error);

    try {
        const pedidosData = await dynamoDb.send(new ScanCommand({ TableName: PEDIDOS_TABLE }));
        const pedidos = pedidosData.Items || [];

        const productosData = await dynamoDb.send(new ScanCommand({ 
            TableName: PRODUCTOS_TABLE,
            FilterExpression: 'inventario_disponible = :cero',
            ExpressionAttributeValues: { ':cero': 0 }
        }));
        const productosAgotados = productosData.Items || [];

        
        let totalVentas = 0;
        const pedidosPorEstado: Record<string, number> = {};
        const clientesCompras: Record<string, number> = {};

        pedidos.forEach(pedido => {
            totalVentas += pedido.total || 0;
            
            pedidosPorEstado[pedido.estado] = (pedidosPorEstado[pedido.estado] || 0) + 1;
            
            clientesCompras[pedido.usuario_id] = (clientesCompras[pedido.usuario_id] || 0) + 1;
        });

   
        const clientesTop = Object.entries(clientesCompras)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, cantidad]) => ({ usuario_id: id, compras: cantidad }));

        return Responses._200({
            total_ventas: totalVentas,
            ventas_por_tienda: "Pendiente de indexación cruzada", 
            pedidos_por_estado: pedidosPorEstado,
            total_productos_agotados: productosAgotados.length,
            detalle_productos_agotados: productosAgotados.map(p => ({ id: p.producto_id, nombre: p.nombre })),
            clientes_con_mas_compras: clientesTop
        });

    } catch (error) {
        console.error('Error generando reportes:', error);
        return Responses._500('Error interno generando el dashboard ejecutivo');
    }
};