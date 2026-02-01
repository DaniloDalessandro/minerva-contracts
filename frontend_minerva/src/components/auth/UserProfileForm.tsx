"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Camera, Eye, EyeOff } from "lucide-react"
import { useAuthContext } from "@/context/AuthContext"
import { SetorService } from "@/services/setor.service"
import { API_ENDPOINTS } from "@/constants/api-endpoints"
import { useToast } from "@/hooks/use-toast"

interface UserProfileFormProps {
  isOpen: boolean
  onClose: () => void
}

interface UserProfileData {
  name: string
  cpf: string
  email: string
  phone: string
  direction_id: number | null
  management_id: number | null
  coordination_id: number | null
  avatar: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface Direction {
  id: number
  name: string
}

interface Management {
  id: number
  name: string
  direction: number
}

interface Coordination {
  id: number
  name: string
  management: number
}

export function UserProfileForm({ isOpen, onClose }: UserProfileFormProps) {
  const { user, updateUserProfile } = useAuthContext()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [directions, setDirections] = useState<Direction[]>([])
  const [managements, setManagements] = useState<Management[]>([])
  const [coordinations, setCoordinations] = useState<Coordination[]>([])
  const [filteredManagements, setFilteredManagements] = useState<Management[]>([])
  const [filteredCoordinations, setFilteredCoordinations] = useState<Coordination[]>([])
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  const [formData, setFormData] = useState<UserProfileData>({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    direction_id: null,
    management_id: null,
    coordination_id: null,
    avatar: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || "",
        cpf: user.cpf || "",
        email: user.email || "",
        phone: user.phone || "",
        direction_id: user.direction_id || null,
        management_id: user.management_id || null,
        coordination_id: user.coordination_id || null,
        avatar: user.avatar || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setPasswordError("")
    }
  }, [user, isOpen])

  useEffect(() => {
    const loadSetorData = async () => {
      try {
        const [directionsRes, managementsRes, coordinationsRes] = await Promise.all([
          SetorService.fetchDirections(1, 100, "", "", "active"),
          SetorService.fetchManagements(1, 100, "", "", "active"),
          SetorService.fetchCoordinations(1, 100, "", "", "active"),
        ])
        setDirections(directionsRes.results || [])
        setManagements(managementsRes.results || [])
        setCoordinations(coordinationsRes.results || [])
      } catch (error) {
        console.error("Erro ao carregar dados de setor:", error)
      }
    }

    if (isOpen) {
      loadSetorData()
    }
  }, [isOpen])

  // Filtra gerências quando direção muda
  useEffect(() => {
    if (formData.direction_id) {
      const filtered = managements.filter(m => m.direction === formData.direction_id)
      setFilteredManagements(filtered)
    } else {
      setFilteredManagements([])
    }
  }, [formData.direction_id, managements])

  // Filtra coordenações quando gerência muda
  useEffect(() => {
    if (formData.management_id) {
      const filtered = coordinations.filter(c => c.management === formData.management_id)
      setFilteredCoordinations(filtered)
    } else {
      setFilteredCoordinations([])
    }
  }, [formData.management_id, coordinations])

  const getInitials = (name: string) => {
    if (!name || name.trim() === "") return "U"

    const words = name.trim().split(" ").filter(word => word.length > 0)
    if (words.length === 0) return "U"
    if (words.length === 1) {
      return words[0][0].toUpperCase()
    }
    return (
      words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
    )
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return `(${numbers}`
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const handleInputChange = (field: keyof UserProfileData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = e.target.value

    if (field === "cpf") {
      value = formatCPF(value)
    } else if (field === "phone") {
      value = formatPhone(value)
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    if (field === "newPassword" || field === "confirmPassword") {
      setPasswordError("")
    }
  }

  const handleDirectionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      direction_id: value ? parseInt(value) : null,
      management_id: null,
      coordination_id: null,
    }))
  }

  const handleManagementChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      management_id: value ? parseInt(value) : null,
      coordination_id: null,
    }))
  }

  const handleCoordinationChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      coordination_id: value ? parseInt(value) : null,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")

    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        setPasswordError("Digite a senha atual para alterar a senha")
        return
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setPasswordError("As senhas não coincidem")
        return
      }
      if (formData.newPassword.length < 6) {
        setPasswordError("A nova senha deve ter pelo menos 6 caracteres")
        return
      }
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem("access")
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      }

      // Atualizar perfil
      const profileResponse = await fetch(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          full_name: formData.name,
          cpf: formData.cpf,
          phone: formData.phone,
          direction_id: formData.direction_id,
          management_id: formData.management_id,
          coordination_id: formData.coordination_id,
        }),
      })

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json()
        throw new Error(errorData.error || "Erro ao atualizar perfil")
      }

      // Alterar senha se preenchida
      if (formData.currentPassword && formData.newPassword) {
        const passwordResponse = await fetch(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
          method: "POST",
          headers,
          body: JSON.stringify({
            old_password: formData.currentPassword,
            new_password: formData.newPassword,
          }),
        })

        if (!passwordResponse.ok) {
          const errorData = await passwordResponse.json()
          setPasswordError(errorData.error || "Erro ao alterar senha")
          return
        }
      }

      const selectedDirection = directions.find(d => d.id === formData.direction_id)
      const selectedManagement = managements.find(m => m.id === formData.management_id)
      const selectedCoordination = coordinations.find(c => c.id === formData.coordination_id)

      // Atualizar contexto do usuário com novos dados
      updateUserProfile({
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf,
        phone: formData.phone,
        direction_id: formData.direction_id || undefined,
        direction_name: selectedDirection?.name,
        management_id: formData.management_id || undefined,
        management_name: selectedManagement?.name,
        coordination_id: formData.coordination_id || undefined,
        coordination_name: selectedCoordination?.name,
        avatar: formData.avatar,
      })

      toast({ title: "Sucesso", description: "Perfil atualizado com sucesso!" })
      onClose()
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Erro ao atualizar perfil", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatar: reader.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[750px] max-w-[95vw]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-primary">
              Minha Conta
            </DialogTitle>
            <hr className="mt-2 border-b border-gray-200" />
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.avatar} alt={formData.name} />
                  <AvatarFallback className="text-lg">
                    {getInitials(formData.name)}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/80 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                Clique no ícone da câmera para alterar sua foto
              </p>
            </div>

            {/* Personal Information */}
            <div className="grid gap-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Informações Pessoais
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange("name")}
                    required
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    type="text"
                    value={formData.cpf}
                    onChange={handleInputChange("cpf")}
                    required
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    required
                    placeholder="Digite seu email"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange("phone")}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            {/* Setor Section */}
            <div className="grid gap-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Setor
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="direction">Direção *</Label>
                  <Select
                    value={formData.direction_id?.toString() || ""}
                    onValueChange={handleDirectionChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a direção" />
                    </SelectTrigger>
                    <SelectContent>
                      {directions.map((direction) => (
                        <SelectItem key={direction.id} value={direction.id.toString()}>
                          {direction.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="management">Gerência</Label>
                  <Select
                    value={formData.management_id?.toString() || ""}
                    onValueChange={handleManagementChange}
                    disabled={!formData.direction_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a gerência" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredManagements.map((management) => (
                        <SelectItem key={management.id} value={management.id.toString()}>
                          {management.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="coordination">Coordenação</Label>
                  <Select
                    value={formData.coordination_id?.toString() || ""}
                    onValueChange={handleCoordinationChange}
                    disabled={!formData.management_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a coordenação" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCoordinations.map((coordination) => (
                        <SelectItem key={coordination.id} value={coordination.id.toString()}>
                          {coordination.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Gerência e Coordenação são opcionais.
              </p>
            </div>

            {/* Password Section */}
            <div className="grid gap-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Alterar Senha
              </h3>

              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={handleInputChange("currentPassword")}
                    placeholder="Digite sua senha atual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={handleInputChange("newPassword")}
                      placeholder="Digite a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleInputChange("confirmPassword")}
                      placeholder="Confirme a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}

              <p className="text-xs text-muted-foreground">
                Deixe os campos de senha em branco se não deseja alterá-la.
              </p>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
