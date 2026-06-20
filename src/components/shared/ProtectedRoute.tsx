import React, { useEffect } from 'react';
import { useCommunicationStore } from '../../store/useCommunicationStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onRedirect: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, onRedirect }) => {
  const isAuthenticated = useCommunicationStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      onRedirect();
    }
  }, [isAuthenticated, onRedirect]);

  if (!isAuthenticated) {
    return null; // Evita renderizar o conteúdo protegido antes do redirecionamento
  }

  return <>{children}</>;
};
