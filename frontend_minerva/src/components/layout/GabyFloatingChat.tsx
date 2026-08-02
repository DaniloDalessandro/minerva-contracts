"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type React from "react"
import {
  AlertTriangle,
  ChevronDown,
  Clock3,
  Loader2,
  MessageSquarePlus,
  Send,
  Trash2,
  X,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AliceService } from "@/services"
import { toast } from "@/hooks/use-toast"
import { useAuthContext } from "@/context/AuthContext"
import { AvatarDisplay } from "@/components/ui/AvatarPicker"

const GABY_AVATAR_URL = "https://api.dicebear.com/9.x/adventurer/svg?seed=Alice&hair=long01,long02,long03,long04,long05,long06,long07,long08,long09,long10,long11,long12,long13,long14,long15,long16,long17,long18,long19,long20&skinColor=f2d3b1,fdbcb4,ecad80&hairColor=6c4f3d,4a4a4a,c4a265,8b4513"

function GabyAvatar({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-xl overflow-hidden shrink-0", className)}
      style={{ width: size, height: size, background: "oklch(0.52 0.265 285)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={GABY_AVATAR_URL} alt="Alice" width={size} height={size} style={{ width: size, height: size }} draggable={false} />
    </span>
  )
}


interface Message {
  id: string
  type: "user" | "assistant" | "error"
  content: string
  timestamp: Date
  needsClarification?: boolean
}

interface CachedChat {
  sessionId: string
  messages: Array<Omit<Message, "timestamp"> & { timestamp: string }>
  updatedAt: string
}

interface ConversationSession {
  id: number
  session_id: string
  created_at: string
  message_count: number
}

interface FabPos {
  side: "left" | "right"
  y: number
}


const CHAT_KEY = "gaby_chat_v1"
const FAB_KEY  = "gaby_fab_pos"

const readJson = <T,>(key: string): T | null => {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") } catch { return null }
}
const writeJson = (key: string, val: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}


function GabyIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >

      <circle cx="12" cy="14" r="7.5" stroke="currentColor" strokeWidth="1.8" />

      <circle cx="9.5" cy="12.5" r="1.1" fill="currentColor" />
      <circle cx="14.5" cy="12.5" r="1.1" fill="currentColor" />

      <path
        d="M9.5 16 Q12 18.2 14.5 16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />

      <path
        d="M12 1.5 L12.7 4 L15.2 4.7 L12.7 5.4 L12 7.9 L11.3 5.4 L8.8 4.7 L11.3 4Z"
        fill="currentColor"
      />
    </svg>
  )
}


export function GabyFloatingChat() {
  const { user } = useAuthContext()
  const [isOpen,     setIsOpen]     = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages,   setMessages]   = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading,  setIsLoading]  = useState(false)
  const [sessionId,  setSessionId]  = useState("")
  const [awaitingClarification, setAwaitingClarification] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [sessions,   setSessions]   = useState<ConversationSession[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingSession, setLoadingSession] = useState<number | null>(null)


  const [fabPos,    setFabPos]    = useState<FabPos>({ side: "right", y: -1 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; originY: number } | null>(null)
  const hasDragged = useRef(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)


  useEffect(() => {

    const saved = readJson<FabPos>(FAB_KEY)
    setFabPos(saved ?? { side: "right", y: window.innerHeight - 80 })


    const cached = readJson<CachedChat>(CHAT_KEY)
    if (cached?.messages?.length) {
      setMessages(cached.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })))
      setSessionId(cached.sessionId ?? "")
    } else {
      setMessages([mkWelcome()])
    }
  }, [])


  useEffect(() => {
    if (messages.length > 1 || messages[0]?.id !== "welcome") {
      writeJson(CHAT_KEY, {
        sessionId,
        messages: messages.map((m) => ({ ...m, timestamp: m.timestamp.toISOString() })),
        updatedAt: new Date().toISOString(),
      })
    }
  }, [messages, sessionId])


  useEffect(() => {
    if (isOpen && !isMinimized)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80)
  }, [messages, isLoading, isOpen, isMinimized])


  useEffect(() => {
    if (isOpen && !isMinimized)
      setTimeout(() => inputRef.current?.focus(), 220)
  }, [isOpen, isMinimized])

  function mkWelcome(): Message {
    return {
      id: "welcome",
      type: "assistant",
      content: "Oi! Sou a Alice, sua assistente do Minerva. Posso ajudar com contratos, orçamentos, colaboradores e muito mais!",
      timestamp: new Date(),
    }
  }


  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, originY: fabPos.y }
    hasDragged.current = false
  }

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (!hasDragged.current && Math.abs(dx) < 6 && Math.abs(dy) < 6) return
    hasDragged.current = true
    setIsDragging(true)

    const newY = Math.max(16, Math.min(window.innerHeight - 72, dragRef.current.originY + dy))
    const side: "left" | "right" = e.clientX < window.innerWidth / 2 ? "left" : "right"
    setFabPos({ side, y: newY })
  }

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return
    const wasDrag = hasDragged.current
    dragRef.current = null

    if (wasDrag) {

      const side: "left" | "right" = e.clientX < window.innerWidth / 2 ? "left" : "right"
      const newY = Math.max(16, Math.min(window.innerHeight - 72, fabPos.y))
      const pos = { side, y: newY }
      setFabPos(pos)
      writeJson(FAB_KEY, pos)
      setTimeout(() => setIsDragging(false), 50)
    } else {
      setIsDragging(false)

      if (isOpen && isMinimized) {
        setIsMinimized(false)
      } else {
        setIsOpen((v) => !v)
        setIsMinimized(false)
      }
    }
  }


  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? inputValue).trim()
    if (!msg || isLoading) return

    setMessages((p) => [...p, { id: Date.now().toString(), type: "user", content: msg, timestamp: new Date() }])
    setInputValue("")
    setIsLoading(true)
    setAwaitingClarification(false)

    try {
      const res = await AliceService.sendMessage({
        message: msg,
        session_id: sessionId || undefined,
        create_new_session: !sessionId,
      })

      if (res.success) {
        if (!sessionId && res.session_id) setSessionId(res.session_id)
        setMessages((p) => [
          ...p,
          {
            id: `${Date.now()}_a`,
            type: "assistant",
            content: res.response,
            timestamp: new Date(),
            needsClarification: res.needs_clarification,
          },
        ])
        setAwaitingClarification(!!res.needs_clarification)
      } else {
        setMessages((p) => [...p, { id: `${Date.now()}_e`, type: "error", content: res.response || "Erro desconhecido", timestamp: new Date() }])
      }
    } catch {
      setMessages((p) => [...p, { id: `${Date.now()}_e`, type: "error", content: "Erro de conexão. Tente novamente.", timestamp: new Date() }])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [inputValue, isLoading, sessionId])

  const startNew = useCallback(() => {
    try { localStorage.removeItem(CHAT_KEY) } catch {}
    setSessionId("")
    setAwaitingClarification(false)
    setShowHistory(false)
    setMessages([{ id: "welcome_new", type: "assistant", content: "Nova conversa iniciada! Como posso ajudar?", timestamp: new Date() }])
  }, [])

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const data = await AliceService.getSessions()
      setSessions(data.results || [])
    } catch {
      toast({ title: "Erro ao carregar histórico", variant: "destructive" })
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  const loadSession = useCallback(async (s: ConversationSession) => {
    setLoadingSession(s.id)
    try {
      const detail = await AliceService.getSessionDetail(s.id)
      const loaded: Message[] = detail.messages?.map((m: any, i: number) => ({
        id: `${s.id}_${i}`,
        type: m.role === "user" ? "user" : "assistant",
        content: m.content,
        timestamp: new Date(m.timestamp || detail.created_at),
      })) || []
      setMessages(loaded)
      setSessionId(s.session_id)
      setShowHistory(false)
      toast({ title: "Conversa carregada", description: `${loaded.length} mensagens` })
    } catch {
      toast({ title: "Erro ao carregar conversa", variant: "destructive" })
    } finally {
      setLoadingSession(null)
    }
  }, [])

  const deleteSession = useCallback(async (e: React.MouseEvent, s: ConversationSession) => {
    e.stopPropagation()
    try {
      await AliceService.clearSession(s.id)
      setSessions((p) => p.filter((x) => x.id !== s.id))
      toast({ title: "Conversa excluída" })
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" })
    }
  }, [])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const fmt = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  const status = isLoading
    ? awaitingClarification ? "Aguardando contexto" : "Pensando..."
    : awaitingClarification ? "Aguardando resposta" : "Online"


  const panelStyle: React.CSSProperties =
    fabPos.side === "right"
      ? { right: "20px" }
      : { left: "20px" }


  const fabStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 50,
    top:  fabPos.y > 0 ? `${fabPos.y}px` : undefined,
    bottom: fabPos.y <= 0 ? "20px" : undefined,
    right: fabPos.side === "right" ? "20px" : undefined,
    left:  fabPos.side === "left"  ? "20px" : undefined,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "none",
  }

  const panelBottomOffset = fabPos.y > 0
    ? window.innerHeight - fabPos.y + 12
    : 76

  return (
    <>

      {isOpen && !isMinimized && (
        <div
          className="fixed z-50 flex flex-col w-[380px] max-h-[580px] rounded-2xl border border-border/70 bg-card shadow-2xl overflow-hidden animate-fade-in-scale"
          style={{ ...panelStyle, bottom: `${panelBottomOffset}px`, maxWidth: "calc(100vw - 2.5rem)" }}
        >

          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-card/95 backdrop-blur-md shrink-0">
            <div className="relative shrink-0">
              <GabyAvatar size={36} />
              <span className={cn("absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card", isLoading ? "bg-amber-400" : "bg-emerald-500")} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold leading-tight">Alice</p>
                <Badge variant="secondary" className="h-4 rounded px-1.5 text-[10px] font-semibold">IA</Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", isLoading ? "animate-pulse bg-amber-400" : "bg-emerald-500")} />
                {status}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={startNew} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="Nova conversa">
                <MessageSquarePlus className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setIsMinimized(true)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="Minimizar">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setIsOpen(false)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="Fechar">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>


          {showHistory && (
            <div className="shrink-0 border-b border-border/60 bg-background/95 max-h-52 overflow-y-auto">
              <div className="px-3 py-2.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Conversas salvas</p>
                {loadingHistory ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                ) : sessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">Nenhuma conversa encontrada</p>
                ) : (
                  <div className="space-y-1">
                    {sessions.map((s) => (
                      <button key={s.id} onClick={() => loadSession(s)} disabled={loadingSession === s.id} className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2 group">
                        {loadingSession === s.id
                          ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                          : <div className="h-6 w-6 rounded-md bg-primary/8 flex items-center justify-center shrink-0"><GabyIcon size={14} className="text-primary" /></div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">Conversa #{s.id}</p>
                          <p className="text-[10px] text-muted-foreground">{s.message_count} msg · {new Date(s.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <button onClick={(e) => deleteSession(e, s)} className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}


          <ScrollArea className="flex-1 min-h-0 bg-background/50">
            <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
            <div className="relative px-3 py-3 space-y-3">
              {messages.map((msg) => {
                const isUser  = msg.type === "user"
                const isError = msg.type === "error"
                return (
                  <div key={msg.id} className={cn("flex gap-2 animate-fade-in", isUser ? "justify-end" : "justify-start")}>
                    {!isUser && (
                      isError
                        ? <div className="mt-0.5 h-7 w-7 shrink-0 rounded-xl flex items-center justify-center shadow-sm bg-destructive text-destructive-foreground">
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </div>
                        : <GabyAvatar size={28} className="mt-0.5 shadow-sm" />
                    )}
                    <div className={cn("flex flex-col gap-0.5 max-w-[82%]", isUser ? "items-end" : "items-start")}>
                      <div className={cn(
                        "rounded-2xl px-3 py-2 text-sm leading-5",
                        isUser  && "rounded-br-md bg-primary text-primary-foreground shadow-sm",
                        !isUser && !isError && "rounded-bl-md border border-border/60 bg-card/95 text-foreground",
                        isError && "rounded-bl-md border border-destructive/30 bg-destructive/8 text-foreground",
                        msg.needsClarification && "border-amber-300/70 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
                      )}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock3 className="h-2.5 w-2.5" />{fmt(msg.timestamp)}
                      </span>
                    </div>
                    {isUser && (
                      <AvatarDisplay avatarId={user?.avatar || "av_1"} size={28} className="mt-0.5 rounded-xl shadow-sm" />
                    )}
                  </div>
                )
              })}

              {isLoading && (
                <div className="flex gap-2 animate-fade-in">
                  <GabyAvatar size={28} className="mt-0.5 shadow-sm" />
                  <div className="rounded-2xl rounded-bl-md border border-border/60 bg-card/95 px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.1s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>


          <div className="shrink-0 border-t border-border/60 bg-card/95 px-3 py-2.5">
            {awaitingClarification && (
              <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/8 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                Alice precisa de mais informação para continuar.
              </div>
            )}
            <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-2 py-1.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200">
              <Textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKey}
                disabled={isLoading}
                placeholder={awaitingClarification ? "Responda a Alice aqui..." : "Pergunte sobre contratos, orçamentos..."}
                rows={1}
                className="max-h-24 min-h-8 flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !inputValue.trim()}
                className={cn(
                  "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-all duration-200",
                  inputValue.trim() && !isLoading
                    ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-95"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground/70">Enter envia · Shift+Enter quebra linha</p>
          </div>
        </div>
      )}


      {isOpen && isMinimized && (
        <div
          className="fixed z-50 animate-fade-in"
          style={{ ...panelStyle, bottom: `${panelBottomOffset}px` }}
        >
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2.5 rounded-2xl border border-border/70 bg-card px-4 py-2.5 shadow-xl hover:shadow-2xl transition-all"
          >
            <GabyAvatar size={24} className="rounded-lg" />
            <span className="text-sm font-semibold">Alice</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </button>
        </div>
      )}


      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={fabStyle}
        className={cn(
          "h-14 w-14 rounded-2xl overflow-hidden flex items-center justify-center select-none relative",
          "bg-gradient-to-br from-primary to-[oklch(0.42_0.265_285)]",
          "shadow-2xl transition-shadow duration-200",
          "hover:shadow-[0_8px_32px_oklch(0.52_0.265_285_/_0.45)]",
          isDragging ? "scale-105 shadow-[0_12px_40px_oklch(0.52_0.265_285_/_0.5)]" : "active:scale-95",
          isOpen && !isMinimized && !isDragging && "opacity-80"
        )}
        aria-label="Abrir Alice — assistente IA"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={GABY_AVATAR_URL} alt="Alice" width={56} height={56} className="w-full h-full" draggable={false} />

        <span className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white/80" />
      </button>
    </>
  )
}
