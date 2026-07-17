const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://q5povgck6h.execute-api.us-east-1.amazonaws.com/dev';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  // Recuperamos el token del localStorage (lo guardaremos ahí al hacer login)
  const token = localStorage.getItem('cloudshop_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  } as Record<string, string>;

  // Si tenemos un token, lo inyectamos en las cabeceras de autorización
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Si la API responde con un error de permisos (Caso 1 de la rúbrica)
  if (response.status === 403) {
    console.error('Acceso Prohibido: No tienes los permisos necesarios.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error en la petición: ${response.status}`);
  }

  return response.json();
};