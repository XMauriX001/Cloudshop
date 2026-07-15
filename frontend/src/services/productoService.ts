import { apiFetch } from './api';

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  inventario: number;
  tiendaId: string; // ID de la tienda propietaria
  tiendaNombre?: string; // Para mostrar el nombre en la interfaz
}

export const productoService = {
  // GET /productos
  obtenerTodos: async (): Promise<Producto[]> => {
    return apiFetch('/productos', { method: 'GET' });
  },

  // POST /productos
  crear: async (producto: Omit<Producto, 'id'>): Promise<Producto> => {
    return apiFetch('/productos', {
      method: 'POST',
      body: JSON.stringify(producto),
    });
  },

  // PUT /productos/{id}
  actualizar: async (id: string, producto: Partial<Producto>): Promise<Producto> => {
    return apiFetch(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(producto),
    });
  },

  // DELETE /productos/{id}
  eliminar: async (id: string): Promise<void> => {
    return apiFetch(`/productos/${id}`, {
      method: 'DELETE',
    });
  }
};