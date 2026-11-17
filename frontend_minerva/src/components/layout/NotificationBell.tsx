"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Bell, Clock, CheckCheck, X, Loader2, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type ContractNotification,
} from "@/lib/api/notifications"

const POLL_INTERVAL_MS = 5 * 60 * 1000

function formatDays(days: number | null): string {
  if (days === null) return "Data indefinida"
  if (days === 0) return "Vence hoje"
  if (days < 0) return `Vencido há ${Math.abs(days)} dia(s)`
  return `Vence em ${days} dia(s)`
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<ContractNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [readingId, setReadingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setFetching(true)
    try {
      const data = await fetchNotifications()
      setNotifications(data.results)
      setUnreadCount(data.unread_count)
      setLoadError(false)
    } catch {
      setLoadError(true)
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [load])

  const handleMarkRead = async (id: number) => {
    if (readingId !== null || loading) return
    setReadingId(id)
    try {
      await markNotificationRead(id)
      await load()
    } catch {
      toast({ title: "Não foi possível marcar a notificação como lida", variant: "destructive" })
    } finally {
      setReadingId(null)
    }
  }

  const handleMarkAllRead = async () => {
    if (loading || readingId !== null) return
    setLoading(true)
    try {
      await markAllNotificationsRead()
      await load()
    } catch {
      toast({ title: "Não foi possível marcar as notificações como lidas", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen)
      if (nextOpen) void load()
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label={`Notificações${unreadCount > 0 ? ` — ${unreadCount} não lidas` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0 rounded-xl shadow-xl border border-border/60"
      >

        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Notificações</span>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">({unreadCount} não lidas)</span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={loading || fetching || readingId !== null}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loadError ? (
            <div role="alert" className="flex flex-col items-center gap-2 px-4 py-6 text-center text-muted-foreground">
              <AlertCircle className="h-6 w-6" />
              <p className="text-sm">Não foi possível carregar as notificações.</p>
              <Button variant="outline" size="sm" onClick={() => void load()} disabled={fetching}>Tentar novamente</Button>
            </div>
          ) : fetching && notifications.length === 0 ? (
            <div role="status" className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando notificações...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-0 transition-colors ${
                  n.is_read
                    ? "bg-background"
                    : "bg-amber-50/60 dark:bg-amber-500/8"
                }`}
              >
                <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                  n.is_read
                    ? "bg-muted/50"
                    : "bg-amber-500/15"
                }`}>
                  <Clock className={`h-3.5 w-3.5 ${
                    n.is_read
                      ? "text-muted-foreground"
                      : "text-amber-600 dark:text-amber-400"
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {n.contract_protocol}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {n.contract_description}
                  </p>
                  <p className={`text-xs font-medium mt-0.5 ${
                    (n.days_until_expiration ?? 999) <= 7
                      ? "text-destructive"
                      : "text-amber-600 dark:text-amber-400"
                  }`}>
                    {formatDays(n.days_until_expiration)}
                  </p>
                </div>

                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground rounded-md"
                    onClick={() => handleMarkRead(n.id)}
                    aria-label="Marcar como lida"
                    disabled={loading || fetching || readingId !== null}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
