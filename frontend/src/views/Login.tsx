import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Consumimos el servicio y lo tratamos de forma dinámica (as any)
      const data = (await authService.login(email, password)) as any;
      
      // 1. EXTRAER EL USUARIO (Soporta si viene anidado en .user o directamente plano en la raíz)
      const rawUser = data.user || data;

      // 2. NORMALIZAR EL ROL (Soporta: Administrador, administrador, admin, ADMIN, etc.)
      let rawRole = rawUser.role || rawUser.rol || 'Cliente';
      let normalizedRole: 'Administrador' | 'Operador' | 'Cliente' = 'Cliente';

      if (typeof rawRole === 'string') {
        const cleanRole = rawRole.trim().toLowerCase();
        if (cleanRole === 'administrador' || cleanRole === 'admin') {
          normalizedRole = 'Administrador';
        } else if (cleanRole === 'operador' || cleanRole === 'op') {
          normalizedRole = 'Operador';
        }
      }

      // 3. CONSTRUIR EL PERFIL DE USUARIO NORMALIZADO
      const normalizedUser = {
        id: rawUser.id || rawUser.userId || rawUser.sub || '1',
        email: rawUser.email || rawUser.username || email, // Si no viene, usamos el email del input
        role: normalizedRole,
      };

      // Guardamos la sesión limpia en el estado global
      login(data.token, normalizedUser);
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Encabezado con estética limpia */}
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800">
            CloudShop Enterprise
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">
            Inicia sesión en tu cuenta
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Introduce tus credenciales para acceder a la plataforma.
          </p>
        </div>

        {/* Tarjeta del Formulario */}
        <div className="bg-white p-8 border border-zinc-200/80 shadow-sm rounded-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-100">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all duration-200 text-sm"
                  placeholder="nombre@empresa.com"
                />
              </div>

              <div>
                <label htmlFor="contrasena" className="block text-sm font-medium text-zinc-700">
                  Contraseña
                </label>
                <input
                  id="contrasena"
                  name="contrasena"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all duration-200 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="relative flex w-full justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};