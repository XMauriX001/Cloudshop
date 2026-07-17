import { apiFetch } from './api';

export interface ReporteDatos {
  totalVentas: number;
  ventasPorTienda: { tiendaNombre: string; total: number }[];
  productosMasVendidos: { productoNombre: string; cantidad: number }[];
  productosAgotados: { productoNombre: string; codigo: string }[];
  clientesConMasCompras: { usuarioId: string; compras: number }[];
  pedidosPorEstado: { estado: string; cantidad: number }[];
}

export const reporteService = {
  obtenerReporte: async (): Promise<ReporteDatos> => {
    const data = await apiFetch('/reportes', { method: 'GET' });

    return {
      totalVentas: data.total_ventas || 0,

      ventasPorTienda: (data.ventas_por_tienda || []).map((v: any) => ({
        tiendaNombre: v.nombre_tienda || v.tienda_id,
        total: v.total_ventas || 0
      })),

      productosMasVendidos: (data.productos_mas_vendidos || []).map((p: any) => ({
        productoNombre: p.nombre || p.producto_id,
        cantidad: p.cantidad_vendida || 0
      })),

      productosAgotados: (data.detalle_productos_agotados || []).map((p: any) => ({
        productoNombre: p.nombre || p.id,
        codigo: p.id
      })),

      clientesConMasCompras: (data.clientes_con_mas_compras || []).map((c: any) => ({
        usuarioId: c.usuario_id,
        compras: c.compras || 0
      })),

      pedidosPorEstado: Object.entries(data.pedidos_por_estado || {}).map(([estado, cantidad]) => ({
        estado,
        cantidad: cantidad as number
      }))
    };
  }
};