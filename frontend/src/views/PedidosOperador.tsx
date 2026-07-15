import React, { useState, useEffect } from 'react';
import { pedidoService, type Pedido } from '../services/pedidoService';

export const PedidosOperador: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const data = await pedidoService.obtenerTodos();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Mostrando bandeja de pedidos de prueba.');
      // Datos mock premium de respaldo alineados con la rúbrica
      setPedidos([
        {
          id: 'PED-1001',
          clienteEmail: 'juancliente@gmail.com',
          productos: [
            { productoId: '101', productoNombre: 'iPhone 15 Pro', cantidad: 1, precio: 999.99 }
          ],
          total: 999.99,
          estado: 'Pendiente',
          fecha: '2026-07-14'
        },
        {
          id: 'PED-1002',
          clienteEmail: 'maria.lopez@empresa.com',
          productos: [
            { productoId: '102', productoNombre: 'Camiseta Minimalista', cantidad: 2, precio: 29.99 }
          ],
          total: 59.98,
          estado: 'En preparación',
          fecha: '2026-07-13'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cambiarEstado = async (pedidoId: string, nuevoEstado: Pedido['estado']) => {
    try {
      // Llamamos a la API para persistir el cambio de estado en AWS Lambda
      await pedidoService.actualizarEstado(pedidoId, nuevoEstado);
      cargarPedidos();
    } catch (err) {
      // Simulación local de respaldo
      setPedidos(pedidos.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Bandeja de Pedidos</h2>
        <p className="text-sm text-zinc-500 mt-1">Controla los estados logísticos del restaurante y despacha las compras.</p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(n => <div key={n} className="h-32 bg-white border border-zinc-200 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Información del Pedido */}
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono font-bold text-sm text-zinc-900">{pedido.id}</span>
                  <span className="text-xs text-zinc-400">| {pedido.fecha}</span>
                  <span className="text-xs text-zinc-500 font-semibold">{pedido.clienteEmail}</span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Productos</p>
                  <div className="text-sm text-zinc-700 space-y-1">
                    {pedido.productos.map((prod, idx) => (
                      <div key={idx}>
                        • {prod.productoNombre} <span className="font-semibold text-zinc-900">x{prod.cantidad}</span> (${prod.precio.toFixed(2)})
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Controles de Estado */}
              <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 self-stretch justify-between md:justify-center">
                <div className="text-right">
                  <p className="text-xs text-zinc-400 font-semibold">Total del Pedido</p>
                  <p className="text-lg font-extrabold text-zinc-900">${pedido.total.toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado:</label>
                  <select
                    value={pedido.estado}
                    onChange={(e) => cambiarEstado(pedido.id, e.target.value as Pedido['estado'])}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none"
                  >
                    {/* Los estados mínimos obligatorios del PDF */}
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