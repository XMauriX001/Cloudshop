import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Responses } from '../shared/responses';
import { validarAcceso } from '../shared/authMiddleware';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(client);

const PEDIDOS_TABLE = process.env.PEDIDOS_TABLE_NAME!;
const PRODUCTOS_TABLE = process.env.PRODUCTOS_TABLE_NAME!;
const TIENDAS_TABLE = process.env.TIENDAS_TABLE_NAME;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const auth = validarAcceso(event, ['Administrador']);
    if (!auth.autorizado) return Responses._403(auth.error);

    try {
        const pedidosData = await dynamoDb.send(new ScanCommand({ TableName: PEDIDOS_TABLE }));
        const pedidos = pedidosData.Items || [];

        const productosData = await dynamoDb.send(new ScanCommand({ TableName: PRODUCTOS_TABLE }));
        const productos = productosData.Items || [];
        const productosMap = new Map(productos.map(p => [p.producto_id, p]));

        let tiendasMap = new Map<string, any>();
        if (TIENDAS_TABLE) {
            const tiendasData = await dynamoDb.send(new ScanCommand({ TableName: TIENDAS_TABLE }));
            tiendasMap = new Map((tiendasData.Items || []).map(t => [t.tienda_id, t]));
        }

        const productosAgotados = productos.filter(p => p.inventario_disponible === 0);

        const pedidosValidos = pedidos.filter(p => p.estado !== 'Cancelado');

        let totalVentas = 0;
        const pedidosPorEstado: Record<string, number> = {};
        const clientesCompras: Record<string, number> = {};
        const ventasPorTienda: Record<string, { tienda_id: string; nombre_tienda: string; total_ventas: number }> = {};
        const productosVendidos: Record<string, { producto_id: string; nombre: string; cantidad_vendida: number }> = {};

        pedidos.forEach(pedido => {
            pedidosPorEstado[pedido.estado] = (pedidosPorEstado[pedido.estado] || 0) + 1;
        });

        pedidosValidos.forEach(pedido => {
            totalVentas += pedido.total || 0;
            clientesCompras[pedido.usuario_id] = (clientesCompras[pedido.usuario_id] || 0) + 1;

            const items = pedido.productos || [];
            items.forEach((item: any) => {
                const producto = productosMap.get(item.producto_id);
                const subtotal = (item.precio_unitario ?? producto?.precio ?? 0) * (item.cantidad || 0);

                if (producto?.tienda_id) {
                    const tiendaId = producto.tienda_id;
                    if (!ventasPorTienda[tiendaId]) {
                        ventasPorTienda[tiendaId] = {
                            tienda_id: tiendaId,
                            nombre_tienda: tiendasMap.get(tiendaId)?.nombre || tiendaId,
                            total_ventas: 0
                        };
                    }
                    ventasPorTienda[tiendaId].total_ventas += subtotal;
                }

                // Productos más vendidos
                if (!productosVendidos[item.producto_id]) {
                    productosVendidos[item.producto_id] = {
                        producto_id: item.producto_id,
                        nombre: producto?.nombre || item.producto_id,
                        cantidad_vendida: 0
                    };
                }
                productosVendidos[item.producto_id].cantidad_vendida += item.cantidad || 0;
            });
        });

        const clientesTop = Object.entries(clientesCompras)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, cantidad]) => ({ usuario_id: id, compras: cantidad }));

        const productosMasVendidos = Object.values(productosVendidos)
            .sort((a, b) => b.cantidad_vendida - a.cantidad_vendida)
            .slice(0, 5);

        return Responses._200({
            total_ventas: totalVentas,
            ventas_por_tienda: Object.values(ventasPorTienda),
            productos_mas_vendidos: productosMasVendidos,
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