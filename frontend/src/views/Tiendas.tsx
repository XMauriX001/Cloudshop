import React, { useState, useEffect } from 'react';
import { tiendaService, type Tienda } from '../services/tiendaService';

export const Tiendas: React.FC = () => {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal de Crear/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTienda, setEditingTienda] = useState<Tienda | null>(null);
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');

  // Cargar tiendas al montar el componente
  const cargarTiendas = async () => {
    setLoading(true);
    try {
      const data = await tiendaService.obtenerTodas();
      setTiendas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err.message || 'Error al cargar las tiendas. Mostrando datos de prueba.');
      // Datos mock de respaldo por si la API aún no tiene registros
      setTiendas([
        { id: '1', nombre: 'Tech Store', ubicacion: 'Centro Comercial Norte, Local 45', estado: 'ACTIVA' },
        { id: '2', nombre: 'Moda Express', ubicacion: 'Avenida Principal #123', estado: 'ACTIVA' },
        { id: '3', nombre: 'Bazar Central', ubicacion: 'Callejón de las Flores #8', estado: 'INACTIVA' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTiendas();
  }, []);

  const abrirCrearModal = () => {
    setEditingTienda(null);
    setNombre('');
    setUbicacion('');
    setIsModalOpen(true);
  };

  const abrirEditarModal = (tienda: Tienda) => {
    setEditingTienda(tienda);
    setNombre(tienda.nombre);
    setUbicacion(tienda.ubicacion);
    setIsModalOpen(true);
  };

  const guardarTienda = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTienda) {
        // Actualizar tienda existente
        await tiendaService.actualizar(editingTienda.id, { nombre, ubicacion });
      } else {
        // Crear nueva tienda
        await tiendaService.crear({ nombre, ubicacion, estado: 'ACTIVA' });
      }
      setIsModalOpen(false);
      cargarTiendas();
    } catch (err: any) {
      alert(err.message || 'Error al guardar la tienda. Aplicando localmente para prueba visual.');
      // Simulación local para que no te estanques si la API falla
      if (editingTienda) {
        setTiendas(tiendas.map(t => t.id === editingTienda.id ? { ...t, nombre, ubicacion } : t));
      } else {
        const nueva: Tienda = {
          id: Date.now().toString(),
          nombre,
          ubicacion,
          estado: 'ACTIVA'
        };
        setTiendas([...tiendas, nueva]);
      }
      setIsModalOpen(false);
    }
  };

  const alternarEstadoTienda = async (tienda: Tienda) => {
    const nuevoEstado = tienda.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
    try {
      if (nuevoEstado === 'INACTIVA') {
        await tiendaService.desactivar(tienda.id); // DELETE para desactivar
      } else {
        await tiendaService.actualizar(tienda.id, { estado: 'ACTIVA' });
      }
      cargarTiendas();
    } catch (err) {
      // Simulación local
      setTiendas(tiendas.map(t => t.id === tienda.id ? { ...t, estado: nuevoEstado } : t));
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado Responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Control de Tiendas</h2>
          <p className="text-sm text-zinc-500 mt-1">Añade, edita o desactiva los comercios suscritos a la plataforma.</p>
        </div>
        <button
          onClick={abrirCrearModal}
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-all duration-200"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Tienda
        </button>
      </div>

      {loading ? (
        // Skeleton Loader Premium para simular carga
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse bg-white border border-zinc-200 p-6 rounded-2xl space-y-4">
              <div className="h-4 bg-zinc-200 rounded w-1/3"></div>
              <div className="h-3 bg-zinc-200 rounded w-3/4"></div>
              <div className="h-3 bg-zinc-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        // Grid de tiendas responsiva (Mapeo de UI)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiendas.map((tienda) => (
            <div
              key={tienda.id}
              className={`bg-white border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between ${
                tienda.estado === 'INACTIVA' ? 'border-zinc-200/60 opacity-75' : 'border-zinc-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-800">
                    Ubicación
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tienda.estado === 'ACTIVA'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                    }`}
                  >
                    {tienda.estado === 'ACTIVA' ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900">{tienda.nombre}</h3>
                <p className="text-sm text-zinc-500 line-clamp-2">{tienda.ubicacion}</p>
              </div>

              {/* Botones de acción inferiores */}
              <div className="flex items-center justify-between border-t border-zinc-100 pt-4 mt-6">
                <button
                  onClick={() => abrirEditarModal(tienda)}
                  className="text-xs font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Editar tienda
                </button>
                <button
                  onClick={() => alternarEstadoTienda(tienda)}
                  className={`text-xs font-bold transition-colors ${
                    tienda.estado === 'ACTIVA'
                      ? 'text-red-600 hover:text-red-800'
                      : 'text-emerald-600 hover:text-emerald-800'
                  }`}
                >
                  {tienda.estado === 'ACTIVA' ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL RESPONSIVO (CREAR / EDITAR) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-zinc-200 shadow-xl rounded-2xl max-w-md w-full overflow-hidden p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">
                {editingTienda ? 'Editar Tienda' : 'Crear Nueva Tienda'}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Por favor, llena los campos correspondientes del comercio.
              </p>
            </div>

            <form onSubmit={guardarTienda} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Nombre de la tienda
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all text-sm"
                  placeholder="Ej. Tienda de Ropa"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Ubicación
                </label>
                <input
                  type="text"
                  required
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all text-sm"
                  placeholder="Ej. Centro Comercial Norte, Local 45"
                />
              </div>

              {/* Botones del Modal */}
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
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};