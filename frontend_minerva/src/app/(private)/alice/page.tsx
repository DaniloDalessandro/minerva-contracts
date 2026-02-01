"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Bot, Send, User, Loader2, MessageCircle, RefreshCw, Sparkles } from "lucide-react"
import { AliceService } from "@/services"
import { toast } from "@/hooks/use-toast"

interface Message {
  id: string
  type: 'user' | 'assistant' | 'error'
  content: string
  timestamp: Date
  metadata?: {
    sql_query?: string
    execution_time_ms?: number
    result_count?: number
    error_details?: string
  }
}

// Componente wrapper com Suspense para useSearchParams
export default function AlicePage() {
  return (
    <Suspense fallback={<AliceLoadingFallback />}>
      <AlicePageContent />
    </Suspense>
  )
}

function AliceLoadingFallback() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-500" />
          Fale com Alice
        </h2>
      </div>
      <Card className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
          <p className="text-muted-foreground">Carregando Alice...</p>
        </div>
      </Card>
    </div>
  )
}

function AlicePageContent() {
  const searchParams = useSearchParams()
  const sessionParam = searchParams.get('session')

  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Carregar sessão específica se houver parâmetro na URL
  useEffect(() => {
    const loadSession = async () => {
      if (sessionParam) {
        try {
          setIsPageLoading(true)
          // Buscar detalhes da sessão pelo session_id (UUID)
          const sessions = await AliceService.getSessions()
          const session = sessions.results.find(s => s.session_id === sessionParam)

          if (session) {
            const sessionDetail = await AliceService.getSessionDetail(session.id)

            // Converter mensagens da sessão para o formato Message
            const loadedMessages: Message[] = sessionDetail.messages?.map((msg: any, index: number) => ({
              id: `${session.id}_${index}`,
              type: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content,
              timestamp: new Date(msg.timestamp || sessionDetail.created_at),
              metadata: msg.metadata
            })) || []

            setMessages(loadedMessages)
            setSessionId(sessionParam)

            toast({
              title: "Conversa carregada",
              description: `${loadedMessages.length} mensagens restauradas`,
            })
          } else {
            throw new Error("Sessão não encontrada")
          }
        } catch (error) {
          console.error("Erro ao carregar sessão:", error)
          toast({
            title: "Erro",
            description: "Não foi possível carregar a conversa",
            variant: "destructive",
          })
          // Iniciar nova conversa em caso de erro
          initializeWelcome()
        } finally {
          setIsPageLoading(false)
        }
      } else {
        initializeWelcome()
      }
    }

    loadSession()
  }, [sessionParam])

  const initializeWelcome = () => {
    try {
      const welcomeMessage: Message = {
        id: "welcome",
        type: "assistant",
        content: "Olá! 😊 Eu sou a Alice, sua assistente virtual do Sistema Minerva.\n\nPosso ajudar você a encontrar informações sobre contratos, orçamentos, funcionários e muito mais.\n\nÉ só me dizer o que você precisa!",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
      setIsPageLoading(false)
    } catch (error) {
      console.error("Erro ao inicializar página Alice:", error)
      setIsPageLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      console.log("🚀 Enviando mensagem para Alice:", inputMessage.trim())
      const response = await AliceService.sendMessage({
        message: inputMessage.trim(),
        session_id: sessionId || undefined,
        create_new_session: !sessionId
      })
      console.log("✅ Resposta recebida:", response)

      if (response.success) {
        // Atualiza session_id se for uma nova sessão
        if (!sessionId && response.session_id) {
          setSessionId(response.session_id)
        }

        const assistantMessage: Message = {
          id: Date.now().toString() + "_assistant",
          type: "assistant",
          content: response.response,
          timestamp: new Date(),
          metadata: {
            sql_query: response.sql_query,
            execution_time_ms: response.execution_time_ms,
            result_count: response.result_count
          }
        }

        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          id: Date.now().toString() + "_error",
          type: "error",
          content: response.response || response.error || "Erro desconhecido",
          timestamp: new Date(),
          metadata: {
            error_details: response.error
          }
        }

        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error("Erro no chat:", error)
      
      const errorMessage: Message = {
        id: Date.now().toString() + "_error",
        type: "error",
        content: "Erro de conexão com o servidor. Tente novamente.",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startNewSession = () => {
    setSessionId("")
    setMessages([{
      id: "welcome_new",
      type: "assistant",
      content: "Nova conversa iniciada! 😊\n\nComo posso ajudar você?",
      timestamp: new Date()
    }])
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }


  // Loading state
  if (isPageLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            Fale com Alice
          </h2>
        </div>
        <Card className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
            <p className="text-muted-foreground">Carregando Alice...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-500" />
          Fale com Alice
        </h2>
        <Button 
          variant="outline" 
          onClick={startNewSession}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 h-[calc(100vh-200px)]">
        {/* Chat Area */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-500" />
                Chat com Alice
              </div>
              <Badge variant={isLoading ? "secondary" : "default"} className="flex items-center gap-1">
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-3 w-3" />
                    Online
                  </>
                )}
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 px-6 max-h-[calc(100vh-300px)]">
              <div className="space-y-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="flex gap-3 max-w-3xl">
                      {message.type !== "user" && (
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${
                          message.type === "error" ? "bg-red-500" : "bg-purple-500"
                        }`}>
                          {message.type === "error" ? "!" : <Bot className="h-4 w-4" />}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div
                          className={`p-4 rounded-lg ${
                            message.type === "user"
                              ? "bg-blue-500 text-white ml-auto"
                              : message.type === "error"
                              ? "bg-red-50 border border-red-200"
                              : "bg-gray-50 border"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatTime(message.timestamp)}</span>
                        </div>

                      </div>
                      
                      {message.type === "user" && (
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <Separator />
            
            <div className="p-6">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Digite sua pergunta aqui..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={isLoading || !inputMessage.trim()}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}