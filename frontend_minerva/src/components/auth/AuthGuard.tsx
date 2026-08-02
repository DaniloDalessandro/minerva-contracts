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

    if (isLoading) return;


    if (!isAuthenticated && !accessToken) {
      router.replace('/login');
      return;
    }


    setIsReady(true);
  }, [isAuthenticated, isLoading, accessToken, router]);


  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
