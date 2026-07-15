import { apiFetch } from './api';

export interface ReporteDatos {
  totalVentas: number;
  ventasPorTienda: { tiendaNombre: string; total: number; transacciones: number }[];
  productosMasVendidos: { productoNombre: string; cantidad: number; ingresos: number }[];
  productosAgotados: { productoNombre: string; codigo: string; tiendaNombre: string }[];
  clientesMasActivos: { clienteEmail: string; comprasCount: number; totalGastado: number }[];
  pedidosPorEstado: { estado: string; cantidad: number }[];
}

export const reporteService = {
  // GET /reportes
  obtenerReporte: async (): Promise<ReporteDatos> => {
    return apiFetch('/reportes', { method: 'GET' });
  }
};