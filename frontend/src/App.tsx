import { useState, useEffect } from 'react';
import { useAuth, type UserRole } from './context/AuthContext';
import { Login } from './views/Login';
import { Layout } from './components/Layout';
import { Tiendas } from './views/Tiendas';
import { Productos } from './views/Productos';
import { Dashboard } from './views/Dashboard';
import { Usuarios } from './views/Usuarios';
import { Catalogo } from './views/Catalogo';
import { CarritoView } from './views/CarritoView';
import { Inventario } from './views/Inventario';
import { PedidosOperador } from './views/PedidosOperador';
import { MisPedidos } from './views/MisPedidos';

function App() {
  const { isAuthenticated, user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('');

  // Identificamos el rol para definir qué pantalla abrir primero por defecto
  const userRole = (user?.role || (user as any)?.rol || 'Cliente') as UserRole;

  // Cada vez que un usuario se loguea, lo mandamos a su pantalla de inicio lógica
  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === 'Administrador') {
        setActiveTab('dashboard');
      } else if (userRole === 'Operador') {
        setActiveTab('inventario');
      } else {
        setActiveTab('catalogo'); // El cliente entra directo al catálogo
      }
    }
  }, [isAuthenticated, userRole]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Renderizador dinámico de vistas basado en la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      // VISTAS DEL CLIENTE
      case 'catalogo':
        return <Catalogo />;

      case 'carrito':
        return <CarritoView />;

      case 'mis-pedidos':
        return (
          <MisPedidos />
        );

      // VISTAS DEL OPERADOR
      case 'inventario':
        return (
          <Inventario />
        );
      case 'pedidos-operador':
        return (
          <PedidosOperador />
        );

      // VISTAS DEL ADMINISTRADOR
      case 'dashboard':
        return (
          <Dashboard />
        );
      case 'crud-usuarios':
        return (
          <Usuarios />
        );
      case 'crud-productos':
        return (
         <Productos />
        );
      case 'crud-tiendas':
        return <Tiendas />;

      default:
        return (
          <div className="text-center py-12">
            <p className="text-zinc-500">Cargando sección...</p>
          </div>
        );
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;