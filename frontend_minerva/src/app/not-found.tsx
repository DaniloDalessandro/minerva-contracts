"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  const { isAuthenticated, accessToken } = useAuthContext();
  const router = useRouter();

  useEffect(() => {

    if (!isAuthenticated || !accessToken) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, accessToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-bg">
      <div className="text-center space-y-6 max-w-md px-4 animate-fade-in">
        <div className="space-y-3">
          <div className="text-8xl font-black gradient-text tracking-tight">404</div>
          <h2 className="text-xl font-semibold text-foreground">Página não encontrada</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        <div className="space-y-3">
          {isAuthenticated && accessToken ? (
            <>
              <Button asChild className="w-full">
                <Link href="/dashboard">
                  Voltar ao Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="javascript:history.back()">
                  Voltar à página anterior
                </Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Você será redirecionado para a página de login em alguns segundos...
              </p>
              <Button asChild className="w-full">
                <Link href="/login">
                  Ir para Login
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}