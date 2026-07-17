import { apiFetch } from './api';
import type { UserRole } from '../context/AuthContext';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const authService = {
  // Cambiamos el parámetro 'contrasena' por 'password'
  login: async (correo: string, password: string): Promise<LoginResponse> => {
    return apiFetch('/usuarios/login', {
      method: 'POST',
      // Enviamos 'password' en el JSON que viaja al backend
      body: JSON.stringify({ correo, password }),
    });
  },
};