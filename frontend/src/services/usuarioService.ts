import { apiFetch } from './api';
import type { UserRole } from '../context/AuthContext';

export interface Usuario {
  id: string;
  email: string;
  role: UserRole;
  estado: 'Activo' | 'Inactivo';
}

export const usuarioService = {
  // GET /usuarios
  obtenerTodos: async (): Promise<Usuario[]> => {
    return apiFetch('/usuarios', { method: 'GET' });
  },

  // POST /usuarios (Crear usuario de forma interna)
  crear: async (usuario: Omit<Usuario, 'id' | 'estado'> & { contrasena: string }): Promise<Usuario> => {
    return apiFetch('/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        email: usuario.email,
        contrasena: usuario.contrasena,
        role: usuario.role
      }),
    });
  },

  // PUT /usuarios/{id} (Actualizar rol o datos)
  actualizar: async (id: string, usuario: Partial<Usuario>): Promise<Usuario> => {
    return apiFetch(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(usuario),
    });
  },

  // DELETE /usuarios/{id} (Desactivar usuario)
  desactivar: async (id: string): Promise<void> => {
    return apiFetch(`/usuarios/${id}`, {
      method: 'DELETE',
    });
  }
};