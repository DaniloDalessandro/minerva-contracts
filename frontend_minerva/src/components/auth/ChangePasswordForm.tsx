"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { changePassword, ChangePasswordData } from '@/lib/api/auth'

interface ChangePasswordFormProps {
  isOpen: boolean
  onClose: () => void
}

export function ChangePasswordForm({ isOpen, onClose }: ChangePasswordFormProps) {
  console.log('ChangePasswordForm renderizado, isOpen:', isOpen)
  
  const [formData, setFormData] = useState<ChangePasswordData & { confirmPassword: string }>({
    old_password: '',
    new_password: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial
    }
  }

  const passwordValidation = validatePassword(formData.new_password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validações
    if (!formData.old_password.trim()) {
      setError('Senha atual é obrigatória')
      setLoading(false)
      return
    }

    if (!passwordValidation.isValid) {
      setError('A nova senha não atende aos critérios de segurança')
      setLoading(false)
      return
    }

    if (formData.new_password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (formData.old_password === formData.new_password) {
      setError('A nova senha deve ser diferente da atual')
      setLoading(false)
      return
    }

    try {
      await changePassword({
        old_password: formData.old_password,
        new_password: formData.new_password,
      })

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setFormData({ old_password: '', new_password: '', confirmPassword: '' })
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      setFormData({ old_password: '', new_password: '', confirmPassword: '' })
      setError('')
      setSuccess(false)
    }
  }

  if (!isOpen) {
    console.log('Modal não está aberto, não renderizando')
    return null
  }

  console.log('Renderizando modal aberto')

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogContent 
          className="sm:max-w-md" 
          style={{ 
            zIndex: 9999,
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90vw'
          }}
        >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </DialogTitle>
          <DialogDescription>
            Digite sua senha atual e escolha uma nova senha segura.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              ✅ Senha alterada com sucesso!
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Senha Atual */}
            <div className="space-y-2">
              <Label htmlFor="old_password">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="old_password"
                  type={showPasswords.old ? 'text' : 'password'}
                  value={formData.old_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, old_password: e.target.value }))}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('old')}
                  disabled={loading}
                >
                  {showPasswords.old ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Nova Senha */}
            <div className="space-y-2">
              <Label htmlFor="new_password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.new_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('new')}
                  disabled={loading}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Critérios de Senha */}
              {formData.new_password && (
                <div className="text-xs space-y-1">
                  <div className={passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}>
                    {passwordValidation.minLength ? '✓' : '✗'} Mínimo 8 caracteres
                  </div>
                  <div className={passwordValidation.hasUpper ? 'text-green-600' : 'text-red-600'}>
                    {passwordValidation.hasUpper ? '✓' : '✗'} Pelo menos uma letra maiúscula
                  </div>
                  <div className={passwordValidation.hasLower ? 'text-green-600' : 'text-red-600'}>
                    {passwordValidation.hasLower ? '✓' : '✗'} Pelo menos uma letra minúscula
                  </div>
                  <div className={passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}>
                    {passwordValidation.hasNumber ? '✓' : '✗'} Pelo menos um número
                  </div>
                  <div className={passwordValidation.hasSpecial ? 'text-green-600' : 'text-red-600'}>
                    {passwordValidation.hasSpecial ? '✓' : '✗'} Pelo menos um caractere especial
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar Nova Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('confirm')}
                  disabled={loading}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {formData.confirmPassword && formData.new_password !== formData.confirmPassword && (
                <div className="text-xs text-red-600">
                  ✗ As senhas não coincidem
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !passwordValidation.isValid}>
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </DialogFooter>
          </form>
        )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}