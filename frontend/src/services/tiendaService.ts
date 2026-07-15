import { apiFetch } from './api';

export interface Tienda {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  estado: 'Activa' | 'Inactiva';
  fechaCreacion?: string;
}

export const tiendaService = {
  // GET /tiendas
  obtenerTodas: async (): Promise<Tienda[]> => {
    return apiFetch('/tiendas', { method: 'GET' });
  },

  // POST /tiendas
  crear: async (tienda: Omit<Tienda, 'id'>): Promise<Tienda> => {
    return apiFetch('/tiendas', {
      method: 'POST',
      body: JSON.stringify(tienda),
    });
  },

  // PUT /tiendas/{id}
  actualizar: async (id: string, tienda: Partial<Tienda>): Promise<Tienda> => {
    return apiFetch(`/tiendas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tienda),
    });
  },

  // DELETE /tiendas/{id} (Desactivar)
  desactivar: async (id: string): Promise<void> => {
    return apiFetch(`/tiendas/${id}`, {
      method: 'DELETE',
    });
  }
};