import { apiFetch } from './api';

export interface Tienda {
  id: string;
  nombre: string;
  ubicacion: string;
  estado: 'ACTIVA' | 'INACTIVA';
}

export const tiendaService = {
  obtenerTodas: async (): Promise<any[]> => {
    const data = await apiFetch('/tiendas', { method: 'GET' });
    return data.tiendas || [];
  },

  crear: async (tienda: any): Promise<any> => {
    return apiFetch('/tiendas', {
      method: 'POST',
      body: JSON.stringify(tienda),
    });
  },

  actualizar: async (id: string, tienda: Partial<Tienda>): Promise<any> => {
    return apiFetch(`/tiendas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tienda),
    });
  },

  desactivar: async (id: string): Promise<void> => {
    return apiFetch(`/tiendas/${id}`, {
      method: 'DELETE',
    });
  }
};