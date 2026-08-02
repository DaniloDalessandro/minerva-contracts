"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  onFormAction,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      action?: string
    }[]
  }[]
  onFormAction?: (formType: string) => void
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider px-3 mb-1">
        Navegação
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActiveParent = pathname.startsWith(item.url) && item.url !== "/"

          return item.items ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActiveParent}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className="group/btn rounded-lg transition-all duration-200 hover:bg-accent data-[state=open]:bg-accent/60"
                    data-active={isActiveParent}
                  >
                    {item.icon && (
                      <item.icon
                        className="shrink-0 text-muted-foreground group-data-[active=true]/btn:text-primary transition-colors"
                        style={{ width: "1rem", height: "1rem" }}
                      />
                    )}
                    <span className="font-medium">{item.title}</span>
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isActiveSub = !subItem.action && pathname === subItem.url

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className="rounded-md transition-all duration-150"
                            data-active={isActiveSub}
                          >
                            {subItem.action ? (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  onFormAction?.(subItem.action as string)
                                }}
                                className="w-full text-left text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <span>{subItem.title}</span>
                              </button>
                            ) : (
                              <a
                                href={subItem.url}
                                {...(subItem.url !== "/dashboard"
                                  ? { target: "_blank", rel: "noopener noreferrer" }
                                  : {})}
                                className={isActiveSub
                                  ? "text-primary font-medium"
                                  : "text-muted-foreground hover:text-foreground transition-colors"
                                }
                              >
                                <span>{subItem.title}</span>
                              </a>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className="rounded-lg transition-all duration-200 hover:bg-accent"
                data-active={pathname === item.url}
              >
                <a
                  href={item.url}
                  {...(item.url !== "/dashboard"
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="flex items-center gap-2"
                >
                  {item.icon && (
                    <item.icon
                      className="shrink-0 text-muted-foreground"
                      style={{ width: "1rem", height: "1rem" }}
                    />
                  )}
                  <span className="font-medium">{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
