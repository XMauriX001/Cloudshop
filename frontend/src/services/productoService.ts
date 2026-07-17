import { apiFetch } from './api';

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  inventario: number;
  tiendaId: string;
  tiendaNombre?: string;
}

export const productoService = {
  obtenerTodos: async (): Promise<Producto[]> => {
    const data = await apiFetch('/productos', { method: 'GET' });
    const lista = data.productos || [];
    return lista.map((prod: any) => ({
      id: prod.producto_id,
      codigo: prod.codigo,
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      categoria: prod.categoria,
      precio: Number(prod.precio) || 0,
      inventario: Number(prod.inventario_disponible) || 0,
      tiendaId: prod.tienda_id,
    }));
  },

  crear: async (producto: any): Promise<any> => {
    const backendPayload = {
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      categoria: producto.categoria,
      precio: Number(producto.precio) || 0,
      inventario_disponible: Number(producto.inventario !== undefined ? producto.inventario : producto.inventario_disponible) || 0,
      tienda_id: producto.tiendaId || producto.tienda_id
    };
    return apiFetch('/productos', {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    });
  },

  actualizar: async (id: string, producto: Partial<Producto> & any): Promise<any> => {
    const backendPayload: Record<string, any> = {};
    if (producto.nombre !== undefined) backendPayload.nombre = producto.nombre;
    if (producto.descripcion !== undefined) backendPayload.descripcion = producto.descripcion;
    if (producto.categoria !== undefined) backendPayload.categoria = producto.categoria;
    if (producto.precio !== undefined) backendPayload.precio = Number(producto.precio);
    if (producto.inventario !== undefined) backendPayload.inventario_disponible = Number(producto.inventario);
    if (producto.inventario_disponible !== undefined) backendPayload.inventario_disponible = Number(producto.inventario_disponible);
    if (producto.tiendaId !== undefined) backendPayload.tienda_id = producto.tiendaId;
    if (producto.tienda_id !== undefined) backendPayload.tienda_id = producto.tienda_id;

    return apiFetch(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendPayload),
    });
  },

  eliminar: async (id: string): Promise<void> => {
    return apiFetch(`/productos/${id}`, {
      method: 'DELETE',
    });
  }
};