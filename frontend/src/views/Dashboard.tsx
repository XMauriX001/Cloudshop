import React, { useState, useEffect } from 'react';
import { reporteService, type ReporteDatos } from '../services/reporteService';

export const Dashboard: React.FC = () => {
  const [datos, setDatos] = useState<ReporteDatos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reporteService.obtenerReporte();
      setDatos(data);
    } catch (err: any) {
      console.error('Error cargando reporte:', err);
      setError(err.message || 'Error al conectar con la base de datos.');
      setDatos(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-zinc-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white border border-zinc-200 rounded-2xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-white border border-zinc-200 rounded-2xl"></div>
          <div className="h-64 bg-white border border-zinc-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard Ejecutivo</h2>
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      </div>
    );
  }

  const ventasPorTienda = datos?.ventasPorTienda || [];
  const productosMasVendidos = datos?.productosMasVendidos || [];
  const productosAgotados = datos?.productosAgotados || [];
  const clientesConMasCompras = datos?.clientesConMasCompras || [];
  const pedidosPorEstado = datos?.pedidosPorEstado || [];

  const totalPedidos = pedidosPorEstado.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);
  const totalAgotados = productosAgotados.length;
  const totalClientes = clientesConMasCompras.length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard Ejecutivo</h2>
        <p className="text-sm text-zinc-500 mt-1">Monitorea los indicadores clave y la inteligencia de ventas de la organización.</p>
      </div>

      {/* 1. INDICADORES CLAVE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total de Ventas</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">
            ${(datos?.totalVentas || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pedidos Procesados</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{totalPedidos}</p>
          <p className="text-xs text-zinc-500 mt-2">Transacciones acumuladas</p>
        </div>

        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Productos Agotados</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{totalAgotados}</p>
          <div className="mt-2 flex items-center text-xs text-amber-600 font-semibold">
            {totalAgotados > 0 ? 'Requiere reabastecimiento' : 'Inventario al día'}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Clientes Clave</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{totalClientes}</p>
          <p className="text-xs text-zinc-500 mt-2">Clientes con más compras</p>
        </div>
      </div>

      {/* 2. VENTAS POR TIENDA & PRODUCTOS MÁS VENDIDOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Ventas por Tienda</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Ingresos divididos según su origen comercial.</p>
          </div>
          <div className="space-y-4 pt-2">
            {ventasPorTienda.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No hay datos de tiendas disponibles.</p>
            ) : (
              ventasPorTienda.map((vt, index) => {
                const maxVenta = Math.max(...ventasPorTienda.map(t => t.total || 1), 1);
                const porcentaje = ((vt.total || 0) / maxVenta) * 100;
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-700">{vt.tiendaNombre}</span>
                      <span className="text-zinc-900">${(vt.total || 0).toFixed(2)}</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-900 rounded-full transition-all duration-500" style={{ width: `${porcentaje}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Productos Más Vendidos</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Los artículos preferidos de los consumidores.</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {productosMasVendidos.length === 0 ? (
              <p className="text-xs text-zinc-400 italic pt-2">No hay datos de productos disponibles.</p>
            ) : (
              productosMasVendidos.map((prod, index) => (
                <div key={index} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-800">
                      {index + 1}
                    </span>
                    <p className="text-xs font-bold text-zinc-900">{prod.productoNombre}</p>
                  </div>
                  <p className="text-xs font-semibold text-zinc-900">{prod.cantidad} unidades</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 3. PEDIDOS POR ESTADO & CLIENTES CON MÁS COMPRAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Pedidos por Estado</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Distribución logística de las compras.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            {pedidosPorEstado.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No hay pedidos registrados.</p>
            ) : (
              pedidosPorEstado.map((est, index) => {
                let colorClasses = 'bg-zinc-50 border-zinc-200 text-zinc-800';
                if (est.estado === 'Pendiente') colorClasses = 'bg-amber-50/50 border-amber-100 text-amber-800';
                if (est.estado === 'Confirmado') colorClasses = 'bg-blue-50/50 border-blue-100 text-blue-800';
                if (est.estado === 'Enviado') colorClasses = 'bg-indigo-50/50 border-indigo-100 text-indigo-800';
                if (est.estado === 'Entregado') colorClasses = 'bg-emerald-50/50 border-emerald-100 text-emerald-800';
                if (est.estado === 'Cancelado') colorClasses = 'bg-red-50/50 border-red-100 text-red-800';

                return (
                  <div key={index} className={`border p-4 rounded-xl flex flex-col justify-between ${colorClasses}`}>
                    <span className="text-xs font-semibold tracking-wide uppercase">{est.estado}</span>
                    <span className="text-xl font-bold mt-2">{est.cantidad || 0}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Clientes con Más Compras</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Ranking por cantidad de pedidos realizados.</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {clientesConMasCompras.length === 0 ? (
              <p className="text-xs text-zinc-400 italic pt-2">No hay registro de clientes.</p>
            ) : (
              clientesConMasCompras.map((cli, index) => (
                <div key={index} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <p className="text-xs font-bold text-zinc-900 font-mono">{cli.usuarioId}</p>
                  </div>
                  <p className="text-xs font-semibold text-zinc-900">{cli.compras} compras</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};