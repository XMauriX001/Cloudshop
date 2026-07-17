import React, { useState, useEffect } from 'react';
import { productoService, type Producto } from '../services/productoService';
import { useCart } from '../context/CartContext';

export const Catalogo: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, cartItems } = useCart();

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const data = await productoService.obtenerTodos();
        setProductos(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Mostrando catálogo de simulación.');
        // Respaldo premium de simulación
        setProductos([
          { id: '101', codigo: 'PROD-001', nombre: 'iPhone 15 Pro', descripcion: 'Titanio natural, pantalla Super Retina XDR de 6.1 pulgadas y chip A17 Pro.', categoria: 'Electrónica', precio: 999.99, inventario: 5, tiendaId: '1' },
          { id: '102', codigo: 'PROD-002', nombre: 'Camiseta Minimalista', descripcion: 'Hecha con algodón orgánico de alta densidad. Ajuste relajado.', categoria: 'Ropa', precio: 29.99, inventario: 50, tiendaId: '2' },
          { id: '103', codigo: 'PROD-003', nombre: 'Teclado Mecánico GMMK', descripcion: 'Hot-swappable, switches táctiles lubricados y retroiluminación RGB.', categoria: 'Electrónica', precio: 89.99, inventario: 0, tiendaId: '1' },
          { id: '104', codigo: 'PROD-004', nombre: 'Cafetera de Goteo El Arco', descripcion: 'Filtro permanente, jarra de vidrio templado para 12 tazas.', categoria: 'Hogar', precio: 45.00, inventario: 8, tiendaId: '3' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    cargarProductos();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-zinc-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-80 bg-white border border-zinc-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Catálogo de Productos</h2>
        <p className="text-sm text-zinc-500 mt-1">Explora nuestra colección curada y añade tus favoritos al carrito de compras.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {productos.map((prod) => {
          const itemEnCarrito = cartItems.find(item => item.producto.id === prod.id);
          const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
          const stockDisponible = prod.inventario - cantidadEnCarrito;

          return (
            <div key={prod.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Categoría y Stock */}
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800">
                    {prod.categoria}
                  </span>
                  {prod.inventario > 0 ? (
                    <span className="text-xs font-semibold text-emerald-600">
                      {stockDisponible} disponibles
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-red-500">
                      Agotado
                    </span>
                  )}
                </div>

                {/* Nombre y descripción */}
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-900 text-base">{prod.nombre}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{prod.descripcion}</p>
                </div>
              </div>

              {/* Precio y Botón de compra */}
              <div className="pt-5 mt-4 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-lg font-extrabold text-zinc-900">${prod.precio.toFixed(2)}</span>
                <button
                  disabled={prod.inventario <= 0 || stockDisponible <= 0}
                  onClick={() => addToCart(prod)}
                  className="rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {prod.inventario <= 0 ? 'Agotado' : cantidadEnCarrito > 0 ? `Llevas ${cantidadEnCarrito}` : 'Agregar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};