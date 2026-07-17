import React, { useState, useEffect } from 'react';
import { pedidoService, type Pedido } from '../services/pedidoService';

export const PedidosOperador: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
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
    cargarPedidos();
  }, []);

  const cambiarEstado = async (pedidoId: string, nuevoEstado: Pedido['estado']) => {
    try {
      await pedidoService.actualizarEstado(pedidoId, nuevoEstado);
      cargarPedidos();
    } catch (err: any) {
      console.error('Error cambiando estado:', err);
      alert(err.message || 'No se pudo actualizar el estado.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Bandeja de Pedidos</h2>
        <p className="text-sm text-zinc-500 mt-1">Controla los estados logísticos y despacha las compras.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(n => <div key={n} className="h-32 bg-white border border-zinc-200 rounded-2xl" />)}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 rounded-2xl bg-white">
          <p className="text-sm text-zinc-500">No hay pedidos registrados.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono font-bold text-sm text-zinc-900">{pedido.id}</span>
                  <span className="text-xs text-zinc-400">| {pedido.fecha}</span>
                  <span className="text-xs text-zinc-500 font-semibold font-mono">{pedido.usuarioId}</span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Productos</p>
                  <div className="text-sm text-zinc-700 space-y-1">
                    {pedido.productos.map((prod, idx) => (
                      <div key={idx}>
                        • {prod.productoNombre} <span className="font-semibold text-zinc-900">x{prod.cantidad}</span> (${Number(prod.precio || 0).toFixed(2)})
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 self-stretch justify-between md:justify-center">
                <div className="text-right">
                  <p className="text-xs text-zinc-400 font-semibold">Total del Pedido</p>
                  <p className="text-lg font-extrabold text-zinc-900">${Number(pedido.total || 0).toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado:</label>
                  <select
                    value={pedido.estado}
                    onChange={(e) => cambiarEstado(pedido.id, e.target.value as Pedido['estado'])}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="En preparación">En preparación</option>
                    <option value="Enviado">Enviado</option>
                    <option value="Entregado">Entregado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};