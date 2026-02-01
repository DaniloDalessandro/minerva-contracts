"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, accessToken } = useAuthContext();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Aguarda o AuthContext terminar de carregar
    if (isLoading) return;

    // Se não está autenticado, redireciona para login
    if (!isAuthenticated && !accessToken) {
      router.replace('/login');
      return;
    }

    // Autenticado - pode mostrar conteúdo
    setIsReady(true);
  }, [isAuthenticated, isLoading, accessToken, router]);

  // Mostra loading enquanto verifica autenticação
  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
