import { apiFetch } from './api';

export interface Pedido {
  id: string;
  clienteEmail: string;
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

export const pedidoService = {
  // GET /pedidos
  obtenerTodos: async (): Promise<Pedido[]> => {
    return apiFetch('/pedidos', { method: 'GET' });
  },

  // PUT /pedidos/{id} (Para actualizar el estado del pedido)
  actualizarEstado: async (id: string, estado: Pedido['estado']): Promise<Pedido> => {
    return apiFetch(`/pedidos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    });
  },

  // DELETE /pedidos/{id} (Módulo 5: Cancelar pedido)
  cancelar: async (id: string): Promise<void> => {
    return apiFetch(`/pedidos/${id}`, {
      method: 'DELETE',
    });
  }
};