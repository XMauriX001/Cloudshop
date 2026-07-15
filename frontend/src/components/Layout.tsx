import React, { useState } from 'react';
import { useAuth, type UserRole } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Intentamos leer el rol sin importar si el backend lo mandó como "role" o "rol"
  const userRole = (user?.role || (user as any)?.rol || 'Cliente') as UserRole;
  const userEmail = user?.email || (user as any)?.username || 'usuario@cloudshop.com';

  // Definimos qué pestañas ve cada quien según los requerimientos del PDF
  const menuItems = [
    // Secciones para el Cliente
    { id: 'catalogo', label: 'Catálogo', roles: ['Cliente'] },
    { id: 'carrito', label: 'Carrito de Compras', roles: ['Cliente'] },
    { id: 'mis-pedidos', label: 'Mis Pedidos', roles: ['Cliente'] },

    // Secciones para el Operador
    { id: 'inventario', label: 'Inventario', roles: ['Operador'] },
    { id: 'pedidos-operador', label: 'Gestión de Pedidos', roles: ['Operador'] },

    // Secciones para el Administrador
    { id: 'dashboard', label: 'Dashboard', roles: ['Administrador'] },
    { id: 'crud-usuarios', label: 'Usuarios', roles: ['Administrador'] },
    { id: 'crud-productos', label: 'Productos', roles: ['Administrador'] },
    { id: 'crud-tiendas', label: 'Tiendas', roles: ['Administrador'] },
  ];

  // Filtramos el menú para que el usuario solo vea lo que su rol le permite (Mínimo Privilegio)
  const allowedMenuItems = menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans text-zinc-900">
      
      {/* 1. SIDEBAR (Solo visible en computadoras / md:block) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-zinc-200 bg-white">
        <div className="flex h-16 items-center px-6 border-b border-zinc-100">
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
            CloudShop
          </span>
        </div>
        
        {/* Enlaces de Navegación del Sidebar */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {allowedMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Perfil de Usuario en el pie del Sidebar */}
        <div className="border-t border-zinc-100 p-4 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-semibold">
              {userEmail[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-950 truncate">{userEmail}</p>
              <p className="text-[10px] font-medium text-zinc-500 font-mono tracking-wider uppercase">{userRole}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-all text-center"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenedor del contenido para compensar el Sidebar fijo */}
      <div className="flex-1 md:pl-64 flex flex-col">
        
        {/* 2. HEADER MÓVIL (Solo visible en pantallas pequeñas) */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 bg-white md:hidden">
          <span className="text-lg font-bold tracking-tight text-zinc-900">CloudShop</span>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 focus:outline-none"
          >
            <span className="sr-only">Abrir menú</span>
            {/* Icono de hamburguesa */}
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </header>

        {/* MENÚ MÓVIL DESPLEGABLE */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-200 bg-white px-4 py-3 space-y-1">
            {allowedMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl ${
                  activeTab === item.id
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="border-t border-zinc-100 pt-3 mt-2">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-950 truncate">{userEmail}</p>
                  <p className="text-[10px] font-medium text-zinc-500 font-mono tracking-wider uppercase">{userRole}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-all text-center"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* 3. ÁREA DE CONTENIDO */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};