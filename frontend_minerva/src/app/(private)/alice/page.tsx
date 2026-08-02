"use client"

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react"
import type React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Check,
  Clipboard,
  Clock3,
  History,
  Loader2,
  MessageSquarePlus,
  Send,
  ThumbsDown,
  ThumbsUp,
  X,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/hooks/use-toast"
import { submitFeedbackAPI } from "@/lib/api/alice"
import { cn } from "@/lib/utils"
import { AliceService } from "@/services"
import { useAuthContext } from "@/context/AuthContext"
import { AvatarDisplay } from "@/components/ui/AvatarPicker"

const ALICE_AVATAR_URL = "https://api.dicebear.com/9.x/adventurer/svg?seed=Gaby&hair=long01,long02,long03,long04,long05,long06,long07,long08,long09,long10,long11,long12,long13,long14,long15,long16,long17,long18,long19,long20&skinColor=f2d3b1,fdbcb4,ecad80&hairColor=6c4f3d,4a4a4a,c4a265,8b4513"

interface Message {
  id: string
  type: "user" | "assistant" | "error"
  content: string
  timestamp: Date
  queryLogId?: number
  userQuestion?: string
  feedback?: "POSITIVE" | "NEGATIVE"
  needsClarification?: boolean
  metadata?: {
    sql_query?: string
    execution_time_ms?: number
    result_count?: number
    error_details?: string
  }
}

type FeedbackRating = "POSITIVE" | "NEGATIVE"

const QUICK_PROMPTS = [
  "Quais contratos vencem nos proximos 30 dias?",
  "Resumo dos orcamentos ativos",
  "Liste os auxilios ativos",
]

export default function AlicePage() {
  return (
    <Suspense fallback={<AliceLoadingFallback />}>
      <AlicePageContent />
    </Suspense>
  )
}

function AliceLoadingFallback() {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-premium">
      <div className="flex h-16 items-center justify-between border-b border-border/70 px-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="flex h-[calc(100%-4rem)] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Carregando Alice</p>
            <p className="text-xs text-muted-foreground">Preparando sua conversa</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AlicePageContent() {
  const { user } = useAuthContext()
  const searchParams = useSearchParams()
  const sessionParam = searchParams.get("session")

  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [sessionId, setSessionId] = useState("")
  const [awaitingClarification, setAwaitingClarification] = useState(false)

  const [correctionTarget, setCorrectionTarget] = useState<Message | null>(null)
  const [correctionText, setCorrectionText] = useState("")
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const assistantStatus = useMemo(() => {
    if (isLoading) return awaitingClarification ? "Aguardando contexto" : "Pensando"
    if (awaitingClarification) return "Aguardando resposta"
    return "Online"
  }, [awaitingClarification, isLoading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const initializeWelcome = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        type: "assistant",
        content:
          "Ola! Eu sou a Alice, sua assistente virtual do Sistema Minerva.\n\nPosso ajudar voce a consultar contratos, orcamentos, colaboradores, auxilios e informacoes do sistema.\n\nMe diga o que voce precisa analisar hoje.",
        timestamp: new Date(),
      },
    ])
    setIsPageLoading(false)
  }, [])

  useEffect(() => {
    const loadSession = async () => {
      if (sessionParam) {
        try {
          setIsPageLoading(true)
          const sessions = await AliceService.getSessions()
          const session = sessions.results.find((item) => item.session_id === sessionParam)

          if (session) {
            const sessionDetail = await AliceService.getSessionDetail(session.id)
            const loadedMessages: Message[] =
              sessionDetail.messages?.map((msg: any, index: number) => ({
                id: `${session.id}_${index}`,
                type: msg.role === "user" ? "user" : "assistant",
                content: msg.content,
                timestamp: new Date(msg.timestamp || sessionDetail.created_at),
                metadata: msg.metadata,
              })) || []

            setMessages(loadedMessages)
            setSessionId(sessionParam)
            toast({ title: "Conversa carregada", description: `${loadedMessages.length} mensagens restauradas` })
          } else {
            throw new Error("Sessao nao encontrada")
          }
        } catch {
          initializeWelcome()
        } finally {
          setIsPageLoading(false)
        }
      } else {
        initializeWelcome()
      }
    }

    loadSession()
  }, [initializeWelcome, sessionParam])

  const sendMessage = async (overrideMessage?: string) => {
    const nextMessage = (overrideMessage ?? inputMessage).trim()
    if (!nextMessage) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: nextMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setAwaitingClarification(false)

    try {
      const response = await AliceService.sendMessage({
        message: nextMessage,
        session_id: sessionId || undefined,
        create_new_session: !sessionId,
      })

      if (response.success) {
        if (!sessionId && response.session_id) {
          setSessionId(response.session_id)
        }

        const assistantMessage: Message = {
          id: `${Date.now()}_assistant`,
          type: "assistant",
          content: response.response,
          timestamp: new Date(),
          queryLogId: response.metadata?.query_log_id,
          userQuestion: nextMessage,
          needsClarification: response.needs_clarification,
          metadata: {
            sql_query: response.sql_query,
            execution_time_ms: response.execution_time_ms,
            result_count: response.result_count,
          },
        }

        setAwaitingClarification(!!response.needs_clarification)
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}_error`,
            type: "error",
            content: response.response || response.error || "Erro desconhecido",
            timestamp: new Date(),
            metadata: { error_details: response.error },
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}_error`,
          type: "error",
          content: "Erro de conexao com o servidor. Tente novamente.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const startNewSession = () => {
    setSessionId("")
    setCorrectionTarget(null)
    setAwaitingClarification(false)
    setMessages([
      {
        id: "welcome_new",
        type: "assistant",
        content: "Nova conversa iniciada.\n\nComo posso ajudar voce agora?",
        timestamp: new Date(),
      },
    ])
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleFeedback = async (message: Message, rating: FeedbackRating) => {
    if (!sessionId || message.feedback) return

    if (rating === "NEGATIVE") {
      setCorrectionTarget(message)
      setCorrectionText("")
      return
    }

    setSubmittingFeedback(message.id)
    try {
      await submitFeedbackAPI({
        session_id: sessionId,
        query_log_id: message.queryLogId,
        rating: "POSITIVE",
        user_question: message.userQuestion || "",
      })
      setMessages((prev) => prev.map((item) => (item.id === message.id ? { ...item, feedback: "POSITIVE" } : item)))
      toast({ title: "Obrigado pelo feedback!" })
    } catch {
      toast({ title: "Erro ao enviar feedback", variant: "destructive" })
    } finally {
      setSubmittingFeedback(null)
    }
  }

  const submitNegativeFeedback = async () => {
    if (!correctionTarget || !sessionId) return

    setSubmittingFeedback(correctionTarget.id)
    try {
      await submitFeedbackAPI({
        session_id: sessionId,
        query_log_id: correctionTarget.queryLogId,
        rating: "NEGATIVE",
        correction: correctionText,
        user_question: correctionTarget.userQuestion || "",
      })
      setMessages((prev) =>
        prev.map((item) => (item.id === correctionTarget.id ? { ...item, feedback: "NEGATIVE" } : item))
      )
      toast({ title: "Feedback registrado", description: "Alice usara essa correcao para melhorar." })
    } catch {
      toast({ title: "Erro ao enviar feedback", variant: "destructive" })
    } finally {
      setSubmittingFeedback(null)
      setCorrectionTarget(null)
      setCorrectionText("")
    }
  }

  const copyMessage = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopiedMessageId(message.id)
      setTimeout(() => setCopiedMessageId(null), 1400)
    } catch {
      toast({ title: "Nao foi possivel copiar", variant: "destructive" })
    }
  }

  const formatTime = (date: Date) => date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

  if (isPageLoading) return <AliceLoadingFallback />

  return (
    <TooltipProvider delayDuration={120}>
      <div className="h-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-premium">
        <div className="flex h-full flex-col">
          <AliceHeader
            isLoading={isLoading}
            status={assistantStatus}
            sessionId={sessionId}
            onNewSession={startNewSession}
          />

          <div className="relative flex-1 overflow-hidden bg-background">
            <div className="pointer-events-none absolute inset-0 grid-bg opacity-70" />
            <ScrollArea className="relative h-full">
              <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-5 sm:px-6 lg:px-8">
                <div className="flex-1 space-y-5">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      userAvatar={user?.avatar || "av_1"}
                      copied={copiedMessageId === message.id}
                      submittingFeedback={submittingFeedback === message.id}
                      formatTime={formatTime}
                      onCopy={copyMessage}
                      onFeedback={handleFeedback}
                    />
                  ))}

                  {isLoading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </ScrollArea>
          </div>

          {correctionTarget && (
            <FeedbackPanel
              value={correctionText}
              loading={submittingFeedback === correctionTarget.id}
              onChange={setCorrectionText}
              onCancel={() => setCorrectionTarget(null)}
              onSubmit={submitNegativeFeedback}
            />
          )}

          <Composer
            value={inputMessage}
            isLoading={isLoading}
            awaitingClarification={awaitingClarification}
            inputRef={inputRef}
            onChange={setInputMessage}
            onKeyDown={handleKeyDown}
            onSend={() => sendMessage()}
            onPromptClick={(prompt) => sendMessage(prompt)}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}

function AliceHeader({
  isLoading,
  status,
  sessionId,
  onNewSession,
}: {
  isLoading: boolean
  status: string
  sessionId: string
  onNewSession: () => void
}) {
  return (
    <header className="z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-card/95 px-4 backdrop-blur-xl sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-brand" style={{ background: "oklch(0.52 0.265 285)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ALICE_AVATAR_URL} alt="Alice" width={40} height={40} className="w-full h-full" draggable={false} />
          </span>
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card",
              isLoading ? "bg-amber-400" : "bg-emerald-500"
            )}
          />
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          <h1 className="truncate text-sm font-semibold leading-tight">Alice</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="secondary" className="h-4 rounded px-1.5 text-[10px] font-semibold shrink-0">
              IA Minerva
            </Badge>
            {sessionId && <span className="hidden max-w-[180px] truncate text-[10px] text-muted-foreground/70 md:inline">Sessao {sessionId}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
              <Link href="/alice/historico" aria-label="Historico de conversas">
                <History className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Historico</TooltipContent>
        </Tooltip>

        <Button variant="outline" size="sm" onClick={onNewSession} disabled={isLoading} className="h-9 rounded-lg">
          <MessageSquarePlus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Nova conversa</span>
        </Button>
      </div>
    </header>
  )
}

function ChatMessage({
  message,
  userAvatar,
  copied,
  submittingFeedback,
  formatTime,
  onCopy,
  onFeedback,
}: {
  message: Message
  userAvatar: string
  copied: boolean
  submittingFeedback: boolean
  formatTime: (date: Date) => string
  onCopy: (message: Message) => void
  onFeedback: (message: Message, rating: FeedbackRating) => void
}) {
  const isUser = message.type === "user"
  const isError = message.type === "error"

  return (
    <div className={cn("group flex animate-fade-in gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && <MessageAvatar type={message.type} />}

      <div className={cn("flex max-w-[min(800px,85%)] flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm transition-all duration-200",
            isUser && "rounded-br-md bg-primary text-primary-foreground shadow-brand",
            !isUser &&
              !isError &&
              "rounded-bl-md border border-border/70 bg-card/95 text-card-foreground shadow-premium",
            isError && "rounded-bl-md border border-destructive/25 bg-destructive/8 text-foreground",
            message.needsClarification && "border-amber-300/70 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
          )}
        >
          {isError && (
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              Falha ao responder
            </div>
          )}
          <MessageContent content={message.content} compact={isUser} />
        </div>

        <div className={cn("flex items-center gap-2 text-[11px] text-muted-foreground", isUser && "flex-row-reverse")}>
          <span className="flex items-center gap-1">
            <Clock3 className="h-3 w-3" />
            {formatTime(message.timestamp)}
          </span>

          {!isUser && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onCopy(message)}
                    className="rounded-md p-1 text-muted-foreground opacity-70 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
                    aria-label="Copiar resposta"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Clipboard className="h-3.5 w-3.5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{copied ? "Copiado" : "Copiar"}</TooltipContent>
              </Tooltip>

              {message.type === "assistant" && message.queryLogId && !message.needsClarification && (
                <FeedbackActions message={message} loading={submittingFeedback} onFeedback={onFeedback} />
              )}
            </>
          )}
        </div>
      </div>

      {isUser && <AvatarDisplay avatarId={userAvatar} size={32} className="mt-1 rounded-xl shadow-sm shrink-0" />}
    </div>
  )
}

function MessageAvatar({ type }: { type: Message["type"] }) {
  const isError = type === "error"

  if (isError) {
    return (
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm bg-destructive text-destructive-foreground">
        <AlertTriangle className="h-4 w-4" />
      </div>
    )
  }

  return (
    <span
      className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-sm"
      style={{ background: "oklch(0.52 0.265 285)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ALICE_AVATAR_URL} alt="Alice" width={32} height={32} className="w-full h-full" draggable={false} />
    </span>
  )
}

function MessageContent({ content, compact = false }: { content: string; compact?: boolean }) {
  const parts = splitCodeBlocks(content)

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {parts.map((part, index) =>
        part.type === "code" ? (
          <CodeBlock key={index} code={part.value} language={part.language} />
        ) : (
          <RichText key={index} text={part.value} compact={compact} />
        )
      )}
    </div>
  )
}

function RichText({ text, compact }: { text: string; compact: boolean }) {
  const lines = text.split("\n")
  const nodes: React.ReactNode[] = []
  let listItems: string[] = []

  const flushList = () => {
    if (!listItems.length) return
    nodes.push(
      <ul key={`list-${nodes.length}`} className={cn("my-2 list-disc space-y-1 pl-5", compact && "my-1")}>
        {listItems.map((item, index) => (
          <li key={index}>{formatInline(item)}</li>
        ))}
      </ul>
    )
    listItems = []
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      return
    }

    if (/^[-*]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-*]\s+/, ""))
      return
    }

    flushList()

    if (/^#{1,3}\s+/.test(trimmed)) {
      nodes.push(
        <h3 key={index} className={cn("mt-1 text-sm font-semibold", compact && "text-primary-foreground")}>
          {formatInline(trimmed.replace(/^#{1,3}\s+/, ""))}
        </h3>
      )
      return
    }

    nodes.push(
      <p key={index} className="whitespace-pre-wrap">
        {formatInline(line)}
      </p>
    )
  })

  flushList()
  return <>{nodes}</>
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      toast({ title: "Nao foi possivel copiar", variant: "destructive" })
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#0b1220] text-slate-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{language || "codigo"}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="max-h-80 overflow-auto p-3 text-xs leading-5">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function FeedbackActions({
  message,
  loading,
  onFeedback,
}: {
  message: Message
  loading: boolean
  onFeedback: (message: Message, rating: FeedbackRating) => void
}) {
  if (message.feedback) {
    return (
      <span className={cn("rounded-md px-1.5 py-0.5 font-medium", message.feedback === "POSITIVE" ? "text-emerald-600" : "text-rose-500")}>
        {message.feedback === "POSITIVE" ? "Feedback positivo" : "Feedback registrado"}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span className="hidden text-muted-foreground/70 sm:inline">Util?</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onFeedback(message, "POSITIVE")}
            disabled={loading}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-emerald-500/10 hover:text-emerald-600 disabled:opacity-50"
            aria-label="Resposta util"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent>Boa resposta</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onFeedback(message, "NEGATIVE")}
            disabled={loading}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-50"
            aria-label="Resposta incorreta"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Corrigir resposta</TooltipContent>
      </Tooltip>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex animate-fade-in gap-3">
      <MessageAvatar type="assistant" />
      <div className="rounded-2xl rounded-bl-md border border-border/70 bg-card px-4 py-3 shadow-premium">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          Alice esta analisando
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.2s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.1s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/70" />
        </div>
      </div>
    </div>
  )
}

function FeedbackPanel({
  value,
  loading,
  onChange,
  onCancel,
  onSubmit,
}: {
  value: string
  loading: boolean
  onChange: (value: string) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <div className="border-t border-rose-500/20 bg-rose-50/80 px-4 py-3 backdrop-blur dark:bg-rose-500/8 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
          <ThumbsDown className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">Ajude a Alice a melhorar</p>
            <p className="text-xs text-rose-700/70 dark:text-rose-200/70">Descreva a resposta esperada ou deixe uma orientacao breve.</p>
          </div>
          <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Ex.: considerar apenas contratos ativos do centro gestor..."
            className="min-h-[72px] resize-none bg-background/90 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={onSubmit} disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Enviar feedback
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              <X className="h-3.5 w-3.5" />
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Composer({
  value,
  isLoading,
  awaitingClarification,
  inputRef,
  onChange,
  onKeyDown,
  onSend,
  onPromptClick,
}: {
  value: string
  isLoading: boolean
  awaitingClarification: boolean
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  onChange: (value: string) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onPromptClick: (prompt: string) => void
}) {
  return (
    <footer className="shrink-0 border-t border-border/70 bg-card/95 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto max-w-5xl space-y-3">
        {awaitingClarification ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-xs text-amber-700 dark:text-amber-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            Alice precisa dessa informacao para continuar.
          </div>
        ) : (
          <div className="hidden gap-2 md:flex">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onPromptClick(prompt)}
                disabled={isLoading}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-premium transition-all duration-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
          <Textarea
            ref={inputRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={isLoading}
            placeholder={awaitingClarification ? "Responda a Alice aqui..." : "Pergunte sobre contratos, orcamentos, colaboradores..."}
            rows={1}
            className="max-h-36 min-h-11 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm shadow-none focus-visible:ring-0"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                onClick={onSend}
                disabled={isLoading || !value.trim()}
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl shadow-brand"
                aria-label="Enviar mensagem"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Enter para enviar</TooltipContent>
          </Tooltip>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          Enter envia. Shift + Enter quebra linha. Alice pode consultar dados internos do Minerva.
        </p>
      </div>
    </footer>
  )
}

function splitCodeBlocks(content: string) {
  const regex = /```(\w+)?\n?([\s\S]*?)```/g
  const parts: Array<{ type: "text" | "code"; value: string; language?: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) })
    }
    parts.push({ type: "code", language: match[1], value: match[2].trim() })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) })
  }

  return parts.length ? parts : [{ type: "text", value: content }]
}

function formatInline(text: string) {
  const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return segments.map((segment, index) => {
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-muted px-1.5 py-0.5 text-[0.85em] font-medium text-foreground">
          {segment.slice(1, -1)}
        </code>
      )
    }

    if (segment.startsWith("**") && segment.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {segment.slice(2, -2)}
        </strong>
      )
    }

    return segment
  })
}
