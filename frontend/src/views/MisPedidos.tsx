import React, { useState, useEffect } from 'react';
import { pedidoService, type Pedido } from '../services/pedidoService';

export const MisPedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarMisPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      // El backend ya devuelve solo los pedidos del usuario logueado (rol Cliente)
      const data = await pedidoService.obtenerTodos();
      setPedidos(data);
    } catch (err: any) {
      console.error('Error cargando pedidos:', err);
      setError(err.message || 'Error al conectar con la base de datos.');
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMisPedidos();
  }, []);

  const manejarCancelacion = async (pedidoId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar este pedido?')) return;
    try {
      await pedidoService.cancelar(pedidoId);
      cargarMisPedidos();
    } catch (err: any) {
      console.error('Error cancelando pedido:', err);
      alert(err.message || 'No se pudo cancelar el pedido.');
    }
  };

  const obtenerEstadoBadge = (estado: Pedido['estado']) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Confirmado':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'En preparación':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Enviado':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Entregado':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Cancelado':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Mis Pedidos</h2>
        <p className="text-sm text-zinc-500 mt-1">Historial detallado de tus compras y seguimiento del estado logístico.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(n => <div key={n} className="h-36 bg-white border border-zinc-200 rounded-2xl" />)}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 rounded-2xl bg-white max-w-md mx-auto space-y-3">
          <h3 className="text-base font-bold text-zinc-900">No tienes compras registradas</h3>
          <p className="text-xs text-zinc-500">¿Qué tal si visitas el catálogo y realizas tu primer pedido?</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:shadow-md">

              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono font-bold text-sm text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg">{pedido.id}</span>
                  <span className="text-xs text-zinc-400 font-medium">{pedido.fecha}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${obtenerEstadoBadge(pedido.estado)}`}>
                    {pedido.estado}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Artículos en la orden</p>
                  <div className="text-sm text-zinc-700 space-y-1">
                    {pedido.productos.map((prod, idx) => (
                      <div key={idx} className="flex justify-between max-w-md">
                        <span>• {prod.productoNombre} <span className="font-bold text-zinc-900">x{prod.cantidad}</span></span>
                        <span className="font-semibold text-zinc-600">${(Number(prod.precio || 0) * Number(prod.cantidad || 0)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
                <div className="lg:text-right">
                  <p className="text-xs text-zinc-400 font-semibold">Total Facturado</p>
                  <p className="text-2xl font-extrabold text-zinc-900">${Number(pedido.total || 0).toFixed(2)}</p>
                </div>

                {pedido.estado === 'Pendiente' || pedido.estado === 'Confirmado' ? (
                  <button
                    onClick={() => manejarCancelacion(pedido.id)}
                    className="rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 px-4 py-2 text-xs font-bold transition-all"
                  >
                    Cancelar Pedido
                  </button>
                ) : pedido.estado !== 'Cancelado' ? (
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50 border border-zinc-100 px-2 py-1 rounded-md">
                    No Cancelable
                  </p>
                ) : null}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};