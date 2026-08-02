"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { isAuthenticated, accessToken } = useAuthContext();
  const router = useRouter();

  useEffect(() => {

    console.error('Erro da aplicação:', error);


    if (!isAuthenticated || !accessToken) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, isAuthenticated, accessToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-bg">
      <div className="text-center space-y-6 max-w-md px-4 animate-fade-in">
        <div className="space-y-3">
          <div className="text-6xl font-black text-destructive/80 tracking-tight">Oops!</div>
          <h2 className="text-xl font-semibold text-foreground">Algo deu errado</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ocorreu um erro inesperado na aplicação.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-left bg-muted/60 p-3 rounded-xl border border-border/60 font-mono">
              <strong className="text-foreground">Erro:</strong> <span className="text-muted-foreground">{error.message}</span>
              {error.digest && <><br /><strong className="text-foreground">ID:</strong> <span className="text-muted-foreground">{error.digest}</span></>}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {isAuthenticated && accessToken ? (
            <>
              <Button onClick={reset} className="w-full">
                Tentar novamente
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Voltar ao Dashboard
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Você será redirecionado para a página de login...
              </p>
              <Button onClick={() => router.push('/login')} className="w-full">
                Ir para Login
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}