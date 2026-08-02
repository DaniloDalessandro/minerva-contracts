import { onlyDigits } from "./masks"

export function isValidCPF(cpf: string): boolean {
  const clean = onlyDigits(cpf)

  if (clean.length !== 11) return false
  if (/^(\d)\1{10}$/.test(clean)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(clean.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(clean.charAt(10))) return false

  return true
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Colapsa espaços duplicados sem mexer num espaço único no final —
// seguro para usar a cada tecla digitada (não atrapalha separar palavras).
export function collapseSpaces(name: string): string {
  return name.replace(/ {2,}/g, " ")
}

// Colapsa espaços e remove os das pontas — só para usar no blur/submit,
// nunca a cada tecla (senão o usuário não consegue digitar um espaço).
export function normalizeName(name: string): string {
  return collapseSpaces(name).trim()
}

export function normalizeEmail(email: string): string {
  return email.replace(/\s+/g, "").toLowerCase()
}
