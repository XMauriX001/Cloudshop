import React, { createContext, useState, useEffect, useContext } from 'react';

// Definimos los roles permitidos según el PDF del proyecto
export type UserRole = 'Administrador' | 'Operador' | 'Cliente';

interface User {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Al cargar la app, verificamos si ya había una sesión activa en el navegador
  useEffect(() => {
    const savedToken = localStorage.getItem('cloudshop_token');
    const savedUser = localStorage.getItem('cloudshop_user');

    // Validamos que existan y que no se hayan guardado como la palabra "undefined"
    if (savedToken && savedUser && savedUser !== 'undefined') {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error al leer la sesión corrupta, limpiando...", error);
        localStorage.removeItem('cloudshop_token');
        localStorage.removeItem('cloudshop_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('cloudshop_token', newToken);
    localStorage.setItem('cloudshop_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cloudshop_token');
    localStorage.removeItem('cloudshop_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para consumir la sesión fácilmente en cualquier componente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};