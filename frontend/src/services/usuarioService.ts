import { apiFetch } from './api';
import type { UserRole } from '../context/AuthContext';

export interface Usuario {
  id: string;
  email: string;
  role: UserRole;
  estado: 'Activo' | 'Inactivo';
}

// Convierte el formato del backend (español) al formato que usa el frontend
const mapearUsuario = (u: any): Usuario => ({
  id: u.usuario_id,
  email: u.correo,
  role: u.rol,
  estado: u.estado === 'INACTIVO' ? 'Inactivo' : 'Activo'
});

export const usuarioService = {
  obtenerTodos: async (): Promise<Usuario[]> => {
    const data = await apiFetch('/usuarios', { method: 'GET' });
    const lista = data.usuarios || [];
    return lista.map(mapearUsuario);
  },

  crear: async (usuario: { email: string; contrasena: string; role: UserRole }): Promise<any> => {
    return apiFetch('/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        correo: usuario.email,
        password: usuario.contrasena,
        nombre: usuario.email.split('@')[0], 
        rol: usuario.role
      }),
    });
  },

  actualizar: async (id: string, cambios: Partial<{ email: string; role: UserRole; estado: 'Activo' | 'Inactivo' }>): Promise<any> => {
    const body: Record<string, any> = {};
    if (cambios.role) body.rol = cambios.role;
    if (cambios.estado) body.estado = cambios.estado === 'Activo' ? 'ACTIVO' : 'INACTIVO';
    // Nota: tu backend no permite cambiar "correo" en actualizarUsuario, solo nombre/password/rol/estado

    return apiFetch(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  desactivar: async (id: string): Promise<void> => {
    return apiFetch(`/usuarios/${id}`, {
      method: 'DELETE',
    });
  }
};