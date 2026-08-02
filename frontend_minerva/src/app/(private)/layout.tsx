"use client"

import { AppSidebar } from "@/components/layout"
import { GabyFloatingChat } from "@/components/layout/GabyFloatingChat"
import { NotificationBell } from "@/components/layout/NotificationBell"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { NavigationProgressBar } from "@/components/ui/navigation-progress-bar"
import { DataRefreshProvider } from "@/context"
import { usePathname } from "next/navigation"
import { AuthGuard } from "@/components/auth"
import React from "react"

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  colaboradores: "Colaboradores",
  auxilios: "Auxílios",
  contratos: "Contratos",
  "linhas-orcamentarias": "Linhas Orçamentárias",
  orcamento: "Orçamentos",
  setor: "Setores",
  centro: "Centros",
  alice: "Alice",
  historico: "Histórico",
  ajuda: "Ajuda",
  convites: "Convites",
}

const capitalize = (s: string) => {
  if (typeof s !== "string" || s.length === 0) return ""
  const decoded = decodeURIComponent(s)
  return ROUTE_LABELS[decoded] ?? (decoded.charAt(0).toUpperCase() + decoded.slice(1).replace(/-/g, " "))
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const pathSegments = pathname.split("/").filter((segment) => segment)

  return (
    <AuthGuard>
      <DataRefreshProvider>
        <SidebarProvider>
          <NavigationProgressBar />
          <AppSidebar />
          <SidebarInset className="flex flex-col min-h-0">

            <header className="flex h-14 shrink-0 items-center gap-2 px-4 border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-40 transition-all">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors" />
              <Separator
                orientation="vertical"
                className="mr-1 data-[orientation=vertical]:h-4 opacity-50"
              />
              <Breadcrumb className="flex-1">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="/dashboard"
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      Home
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {pathSegments.map((segment, index) => {
                    const href = `/${pathSegments.slice(0, index + 1).join("/")}`
                    const isLast = index === pathSegments.length - 1

                    return (
                      <React.Fragment key={href}>
                        <BreadcrumbSeparator className="text-muted-foreground/50" />
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage className="text-sm font-medium text-foreground">
                              {capitalize(segment)}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink
                              href={href}
                              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                            >
                              {capitalize(segment)}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    )
                  })}
                </BreadcrumbList>
              </Breadcrumb>


              <div className="flex items-center gap-1 ml-auto shrink-0">
                <NotificationBell />
              </div>
            </header>


            <main className="flex-1 overflow-hidden p-5 animate-fade-in">
              {children}
            </main>
          </SidebarInset>
          <GabyFloatingChat />
        </SidebarProvider>
      </DataRefreshProvider>
    </AuthGuard>
  )
}
