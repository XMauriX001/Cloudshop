import { apiFetch } from './api';

export interface Pedido {
  id: string;
  usuarioId: string;
  productos: {
    productoId: string;
    productoNombre: string;
    cantidad: number;
    precio: number;
  }[];
  total: number;
  estado: 'Pendiente' | 'Confirmado' | 'En preparación' | 'Enviado' | 'Entregado' | 'Cancelado';
  fecha: string;
}

const mapearPedido = (p: any): Pedido => ({
  id: p.pedido_id,
  usuarioId: p.usuario_id,
  productos: (p.productos || []).map((prod: any) => ({
    productoId: prod.producto_id,
    productoNombre: prod.nombre || prod.producto_id,
    cantidad: Number(prod.cantidad) || 0,
    precio: Number(prod.precio_unitario) || Number(prod.precio) || 0
  })),
  total: Number(p.total) || 0,
  estado: p.estado,
  fecha: p.fecha
});

export const pedidoService = {
  // GET /pedidos — el backend ya filtra por usuario si el rol es Cliente
  obtenerTodos: async (): Promise<Pedido[]> => {
    const data = await apiFetch('/pedidos', { method: 'GET' });
    const lista = data.pedidos || [];
    return lista.map(mapearPedido);
  },

  actualizarEstado: async (id: string, estado: Pedido['estado']): Promise<any> => {
    return apiFetch(`/pedidos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    });
  },

  cancelar: async (id: string): Promise<void> => {
    return apiFetch(`/pedidos/${id}`, {
      method: 'DELETE',
    });
  }
};