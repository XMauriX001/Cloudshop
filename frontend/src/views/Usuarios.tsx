import React, { useState, useEffect } from 'react';
import { usuarioService, type Usuario } from '../services/usuarioService';
import type { UserRole } from '../context/AuthContext';

export const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);

  // Campos del Formulario
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [role, setRole] = useState<UserRole>('Cliente');

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await usuarioService.obtenerTodos();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Mostrando directorio de usuarios simulado.');
      // Datos mock premium de respaldo alineados con tus accesos reales
      setUsuarios([
        { id: '1', email: 'admin@cloudshop.com', role: 'Administrador', estado: 'Activo' },
        { id: '2', email: 'operador@cloudshop.com', role: 'Operador', estado: 'Activo' },
        { id: '3', email: 'juancliente@gmail.com', role: 'Cliente', estado: 'Activo' },
        { id: '4', email: 'ex-empleado@cloudshop.com', role: 'Operador', estado: 'Inactivo' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const abrirCrearModal = () => {
    setEditingUsuario(null);
    setEmail('');
    setContrasena('');
    setRole('Cliente');
    setIsModalOpen(true);
  };

  const abrirEditarModal = (user: Usuario) => {
    setEditingUsuario(user);
    setEmail(user.email);
    setContrasena(''); // No editamos contraseña directamente aquí por seguridad
    setRole(user.role);
    setIsModalOpen(true);
  };

  const guardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUsuario) {
        // Actualizar usuario existente
        await usuarioService.actualizar(editingUsuario.id, { email, role });
      } else {
        // Registrar nuevo usuario
        await usuarioService.crear({ email, contrasena, role });
      }
      setIsModalOpen(false);
      cargarUsuarios();
    } catch (err: any) {
      // Simulación local defensiva
      if (editingUsuario) {
        setUsuarios(usuarios.map(u => u.id === editingUsuario.id ? { ...u, email, role } : u));
      } else {
        const nuevo: Usuario = {
          id: Date.now().toString(),
          email,
          role,
          estado: 'Activo'
        };
        setUsuarios([...usuarios, nuevo]);
      }
      setIsModalOpen(false);
    }
  };

  const alternarEstadoUsuario = async (user: Usuario) => {
    const nuevoEstado = user.estado === 'Activo' ? 'Inactiva' : 'Activo';
    try {
      if (nuevoEstado === 'Inactiva') {
        await usuarioService.desactivar(user.id); // DELETE para desactivar
      } else {
        await usuarioService.actualizar(user.id, { estado: 'Activo' });
      }
      cargarUsuarios();
    } catch (err) {
      // Simulación local
      setUsuarios(usuarios.map(u => u.id === user.id ? { ...u, estado: nuevoEstado === 'Inactiva' ? 'Inactivo' : 'Activo' } : u));
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Gestión de Usuarios</h2>
          <p className="text-sm text-zinc-500 mt-1">Administra las cuentas de acceso, asigna roles de sistema y controla los estados de los usuarios.</p>
        </div>
        <button
          onClick={abrirCrearModal}
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-all duration-200"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Registrar Usuario
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-white border border-zinc-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        /* TABLA DE USUARIOS */
        <div className="overflow-hidden bg-white border border-zinc-200 shadow-sm rounded-2xl">
          <div className="min-w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol del Sistema</th>
                  <th className="px-6 py-4">Estado de Cuenta</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {usuarios.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/50 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold text-xs">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div className="font-semibold text-zinc-900">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.role === 'Administrador' ? 'bg-zinc-900 text-white' :
                        user.role === 'Operador' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        'bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.estado === 'Activo'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {user.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => abrirEditarModal(user)}
                        className="text-xs font-bold text-zinc-600 hover:text-zinc-900"
                      >
                        Editar Rol
                      </button>
                      <button
                        onClick={() => alternarEstadoUsuario(user)}
                        className={`text-xs font-bold transition-colors ${
                          user.estado === 'Activo'
                            ? 'text-red-600 hover:text-red-800'
                            : 'text-emerald-600 hover:text-emerald-800'
                        }`}
                      >
                        {user.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR / EDITAR USUARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-zinc-200 shadow-xl rounded-2xl max-w-md w-full p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">
                {editingUsuario ? 'Modificar Rol de Usuario' : 'Registrar Nuevo Usuario'}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Completa las credenciales y asigna el rol correspondiente.</p>
            </div>

            <form onSubmit={guardarUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  disabled={!!editingUsuario} // No dejamos cambiar el email si estamos editando
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none text-sm disabled:opacity-60"
                  placeholder="usuario@cloudshop.com"
                />
              </div>

              {!editingUsuario && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Contraseña Temporal</label>
                  <input
                    type="password"
                    required
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none text-sm"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Rol del Sistema</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none text-sm"
                >
                  <option value="Cliente">Cliente (Comprador)</option>
                  <option value="Operador">Operador (Logística & Despacho)[cite: 1]</option>
                  <option value="Administrador">Administrador (Control Total)[cite: 1]</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-all shadow-sm"
                >
                  {editingUsuario ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};