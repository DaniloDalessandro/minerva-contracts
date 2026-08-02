"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/context/AuthContext"

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthContext()
  const hasRedirected = useRef(false)

  useEffect(() => {

    if (!isLoading && !hasRedirected.current) {
      hasRedirected.current = true

      if (isAuthenticated) {
        router.replace("/dashboard")
      } else {
        router.replace("/login")
      }
    }
  }, [isAuthenticated, isLoading])


  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
}
