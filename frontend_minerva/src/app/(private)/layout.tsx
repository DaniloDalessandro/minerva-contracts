"use client"

import { AppSidebar } from "@/components/layout"
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
import { ThemeToggle } from "@/components/common/ThemeToggle"
import React from "react"

const capitalize = (s: string) => {
  if (typeof s !== "string" || s.length === 0) {
    return ""
  }
  const decodedString = decodeURIComponent(s)
  return (
    decodedString.charAt(0).toUpperCase() +
    decodedString.slice(1).replace(/-/g, " ")
  )
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
          <SidebarInset className="flex flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  {pathSegments.map((segment, index) => {
                    const href = `/${pathSegments.slice(0, index + 1).join("/")}`
                    const isLast = index === pathSegments.length - 1

                    return (
                      <React.Fragment key={href}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{capitalize(segment)}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink href={href}>
                              {capitalize(segment)}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    )
                  })}
                </BreadcrumbList>
              </Breadcrumb>
              <div className="ml-auto">
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 p-4">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </DataRefreshProvider>
    </AuthGuard>
  )
}
