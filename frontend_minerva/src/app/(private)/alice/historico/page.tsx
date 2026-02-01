"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  MessageCircle,
  Calendar,
  Clock,
  Trash2,
  RefreshCw,
  Loader2,
  MessageSquarePlus
} from "lucide-react"
import { AliceService } from "@/services"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"

interface ConversationSession {
  id: number
  session_id: string
  created_at: string
  updated_at: string
  message_count: number
  is_active: boolean
}

export default function AliceHistoricoPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<ConversationSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<ConversationSession | null>(null)

  const loadSessions = async () => {
    try {
      setIsLoading(true)
      const response = await AliceService.getSessions()
      setSessions(response.results || [])
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de conversas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return

    try {
      setDeletingSessionId(sessionToDelete.id)
      await AliceService.clearSession(sessionToDelete.id)

      toast({
        title: "Sucesso",
        description: "Conversa excluída com sucesso",
      })

      // Recarregar as sessões
      await loadSessions()
    } catch (error) {
      console.error("Erro ao excluir sessão:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conversa",
        variant: "destructive",
      })
    } finally {
      setDeletingSessionId(null)
      setSessionToDelete(null)
    }
  }

  const handleViewSession = (session: ConversationSession) => {
    // Redirecionar para a página principal do Alice com o session_id
    router.push(`/alice?session=${session.session_id}`)
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      })
    } catch {
      return "Data inválida"
    }
  }

  return (
    <div className="w-full py-1">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                Histórico de Conversas
              </CardTitle>
              <CardDescription className="mt-2">
                Todas as suas conversas anteriores com Alice
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadSessions}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                size="sm"
                onClick={() => router.push('/alice')}
              >
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Nova Conversa
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conversa encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não iniciou nenhuma conversa com Alice
              </p>
              <Button onClick={() => router.push('/alice')}>
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Iniciar Nova Conversa
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {sessions.map((session) => (
                  <Card
                    key={session.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewSession(session)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                              <MessageCircle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">
                                Conversa #{session.id}
                              </h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(session.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Última atualização: {formatDate(session.updated_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <Separator className="my-3" />

                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {session.message_count} {session.message_count === 1 ? 'mensagem' : 'mensagens'}
                            </Badge>
                            {session.is_active && (
                              <Badge variant="default" className="bg-green-600">
                                Ativa
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSessionToDelete(session)
                          }}
                          disabled={deletingSessionId === session.id}
                        >
                          {deletingSessionId === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conversa #{sessionToDelete?.id}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
