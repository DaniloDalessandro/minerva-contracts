"use client"

import { useState } from "react"
import {
  BadgeCheck,
  ChevronsUpDown,
  Laptop,
  LogOut,
  Moon,
  Sun,
} from "lucide-react"

import { UserProfileForm } from "@/components/auth/UserProfileForm"
import { useAuthContext } from "@/context/AuthContext"
import { type ThemeMode, useTheme } from "@/context/ThemeContext"
import { cn } from "@/lib/utils"

import { AvatarDisplay } from "@/components/ui/AvatarPicker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { logout } = useAuthContext()
  const { mode, setTheme } = useTheme()

  const THEME_OPTS: Array<{ value: ThemeMode; icon: typeof Sun; label: string }> = [
    { value: "light", icon: Sun, label: "Claro" },
    { value: "dark", icon: Moon, label: "Escuro" },
    { value: "system", icon: Laptop, label: "Auto" },
  ]

  const handleLogout = () => {
    logout()
    window.location.href = "/login"
  }

  const getInitials = (name: string) => {
    const words = name.trim().split(" ")
    if (words.length === 1) return words[0][0].toUpperCase()
    return words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
  }

  const capitalizeFirst = (name: string) => {
    if (!name) return name
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="rounded-xl bg-accent/60 hover:bg-accent data-[state=open]:bg-accent transition-all duration-200 group"
              >
                <AvatarDisplay avatarId={user.avatar} size={32} className="rounded-lg ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all shrink-0" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-foreground">
                    {capitalizeFirst(user.name)}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-3.5 text-muted-foreground/60" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-xl shadow-lg border border-border/60"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={6}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-3 py-3">
                  <AvatarDisplay avatarId={user.avatar} size={40} className="rounded-xl ring-2 ring-primary/20 shrink-0" />
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="font-semibold text-sm text-foreground">
                      {capitalizeFirst(user.name)}
                    </span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="opacity-50" />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => setTimeout(() => setIsProfileOpen(true), 100)}
                  className="cursor-pointer rounded-lg gap-2.5 py-2 px-3"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Minha Conta</p>
                    <p className="text-xs text-muted-foreground">Perfil e configurações</p>
                  </div>
                </DropdownMenuItem>

                <div className="px-3 py-1.5">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Tema</p>
                  <div className="flex items-center gap-1">
                    {THEME_OPTS.map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-all duration-200",
                          mode === value
                            ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/20"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                        title={label}
                      >
                        <Icon className="h-3 w-3 shrink-0" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="opacity-50" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer rounded-lg gap-2.5 py-2 px-3 text-destructive focus:text-destructive focus:bg-destructive/8"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10">
                  <LogOut className="h-3.5 w-3.5 text-destructive" />
                </div>
                <span className="text-sm font-medium">Sair</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="opacity-30" />

              <div className="px-3 py-2 text-center">
                <span className="text-[11px] text-muted-foreground/40 select-none tracking-wide">
                  Minerva v0.1.0
                </span>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <UserProfileForm
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  )
}
