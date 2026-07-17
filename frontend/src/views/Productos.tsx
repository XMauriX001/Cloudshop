import React, { useState, useEffect } from 'react';
import { productoService, type Producto } from '../services/productoService';
import { tiendaService, type Tienda } from '../services/tiendaService';

export const Productos: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precio, setPrecio] = useState<number>(0);
  const [inventario, setInventario] = useState<number>(0);
  const [tiendaId, setTiendaId] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productosData, tiendasData] = await Promise.all([
        productoService.obtenerTodos(),
        tiendaService.obtenerTodas().catch(() => []) 
      ]);

      const listaTiendas = Array.isArray(tiendasData) ? tiendasData : [];
      setTiendas(listaTiendas);
      
      const listaProductos = Array.isArray(productosData) ? productosData : [];
      
      const productosMapeados = listaProductos.map((prod: Producto) => {
        const tienda = listaTiendas.find((t: any) => t.tienda_id === prod.tiendaId);
        return {
          ...prod,
          tiendaNombre: tienda ? tienda.nombre : 'Tienda Desconocida'
        };
      });

      setProductos(productosMapeados);
    } catch (err: any) {
      console.error("Error cargando:", err);
      setError('Error al conectar con la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirCrearModal = () => {
    setEditingProducto(null);
    setCodigo(''); setNombre(''); setDescripcion(''); setCategoria('');
    setPrecio(0); setInventario(0);
    setTiendaId(tiendas[0]?.id || '');
    setIsModalOpen(true);
  };

  const abrirEditarModal = (prod: Producto) => {
    setEditingProducto(prod);
    setCodigo(prod.codigo); setNombre(prod.nombre); setDescripcion(prod.descripcion);
    setCategoria(prod.categoria); setPrecio(prod.precio); setInventario(prod.inventario);
    setTiendaId(prod.tiendaId);
    setIsModalOpen(true);
  };

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      codigo, nombre, descripcion, categoria, precio, 
      inventario_disponible: inventario, 
      tienda_id: tiendaId 
    };

    try {
      if (editingProducto) {
        await productoService.actualizar(editingProducto.id, payload as any);
      } else {
        await productoService.crear(payload as any);
      }
      setIsModalOpen(false);
      cargarDatos(); 
    } catch (err: any) {
      console.error("Error al guardar:", err);
      alert('Error guardando el producto. Revisa la consola.');
    }
  };

  const eliminarProducto = async (id: string) => {
    if (!confirm('¿Eliminar producto?')) return;
    try {
      await productoService.eliminar(id);
      cargarDatos();
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert('Error al intentar eliminar.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabecera de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Gestión del Catálogo</h2>
          <p className="text-sm text-zinc-500 mt-1">Crea, edita o elimina productos del inventario de tus tiendas de forma global.</p>
        </div>
        <button
          onClick={abrirCrearModal}
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-all duration-200"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Producto
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-white border border-zinc-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        /* TABLA PREMIUM RESPONSIVA */
        <div className="overflow-hidden bg-white border border-zinc-200 shadow-sm rounded-2xl">
          <div className="min-w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Tienda</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4">Inventario</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {productos.map((prod) => (
                  <tr key={prod.id} className="hover:bg-zinc-50/50 transition-all">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900">{prod.nombre}</div>
                      <div className="text-xs text-zinc-400 line-clamp-1">{prod.descripcion}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-500">{prod.codigo}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800">
                        {prod.tiendaNombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900">${Number(prod.precio).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {prod.inventario > 0 ? (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                          {prod.inventario} disponibles
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-lg">
                          Agotado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => abrirEditarModal(prod)}
                        className="text-xs font-bold text-zinc-600 hover:text-zinc-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarProducto(prod.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR / EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-zinc-200 shadow-xl rounded-2xl max-w-lg w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">
                {editingProducto ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Completa los campos del catálogo.</p>
            </div>

            <form onSubmit={guardarProducto} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-zinc-900 focus:bg-white focus:outline-none"
                    placeholder="Ej. Sudadera Oversized"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Código</label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-zinc-900 focus:bg-white focus:outline-none font-mono"
                    placeholder="Ej. TS-0921"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Categoría</label>
                  <input
                    type="text"
                    required
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-zinc-900 focus:bg-white focus:outline-none"
                    placeholder="Ej. Indumentaria"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Tienda Propietaria</label>
                  <select
                    value={tiendaId}
                    onChange={(e) => setTiendaId(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-zinc-900 focus:bg-white focus:outline-none"
                  >
                    {tiendas.length > 0 ? (
                      tiendas.map((t: any) => (
                        <option key={t.tienda_id} value={t.tienda_id}>
                          {t.nombre}
                        </option>
                      ))
                    ) : (
                      <option value="">Sin tiendas disponibles</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Precio ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={precio}
                    onChange={(e) => setPrecio(parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-zinc-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={inventario}
                    onChange={(e) => setInventario(parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-zinc-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-zinc-900 focus:bg-white focus:outline-none resize-none"
                  placeholder="Describe los detalles principales del producto..."
                />
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
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};