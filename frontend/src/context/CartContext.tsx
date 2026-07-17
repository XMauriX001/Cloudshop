import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Producto } from '../services/productoService';

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (producto: Producto) => void;
  removeFromCart: (productoId: string) => void;
  updateQuantity: (productoId: string, cantidad: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Cargar el carrito guardado del cliente al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cloudshop_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error al cargar carrito");
      }
    }
  }, []);

  // Guardar en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('cloudshop_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (producto: Producto) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.producto.id === producto.id);
      if (existing) {
        // Validamos que no exceda el inventario disponible
        if (existing.cantidad >= producto.inventario) {
          alert('¡Límite de inventario alcanzado!');
          return prev;
        }
        return prev.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const removeFromCart = (productoId: string) => {
    setCartItems((prev) => prev.filter((item) => item.producto.id !== productoId));
  };

  const updateQuantity = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(productoId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.producto.id === productoId) {
          // Validamos stock máximo
          if (cantidad > item.producto.inventario) {
            alert(`Solo hay ${item.producto.inventario} unidades disponibles.`);
            return item;
          }
          return { ...item, cantidad };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Soporte por si tu amigo mandó el precio como "precio" en lugar de "price"
  const safeCartTotal = cartItems.reduce((acc, item) => {
    const precio = item.producto.precio || (item.producto as any).price || 0;
    return acc + precio * item.cantidad;
  }, 0);

  const cartCount = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal: safeCartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context;
};