import { z } from 'zod'


export const directionSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'O registro deve conter mais de uma letra')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/.*[a-zA-Z].*[a-zA-Z].*/, 'O registro deve conter pelo menos duas letras')
    .trim(),
})


export const managementSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'O registro deve conter mais de uma letra')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/.*[a-zA-Z].*[a-zA-Z].*/, 'O registro deve conter pelo menos duas letras')
    .trim(),
  direction_id: z
    .number({ required_error: 'Direção é obrigatória' })
    .min(1, 'Selecione uma direção válida')
})


export const coordinationSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'O registro deve conter mais de uma letra')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/.*[a-zA-Z].*[a-zA-Z].*/, 'O registro deve conter pelo menos duas letras')
    .trim(),
  management_id: z
    .number({ required_error: 'Gerência é obrigatória' })
    .min(1, 'Selecione uma gerência válida')
})


export type DirectionFormData = z.infer<typeof directionSchema>
export type ManagementFormData = z.infer<typeof managementSchema>
export type CoordinationFormData = z.infer<typeof coordinationSchema>


export const validateUniqueDirectionName = async (
  name: string,
  existingNames: string[],
  currentId?: number
): Promise<boolean> => {
  const trimmedName = name.trim().toLowerCase()
  return !existingNames
    .filter((_, index) => index !== currentId)
    .some(existingName => existingName.toLowerCase() === trimmedName)
}


export const validateUniqueManagementName = async (
  name: string,
  directionId: number,
  existingNames: string[],
  currentId?: number
): Promise<boolean> => {
  const trimmedName = name.trim().toLowerCase()
  return !existingNames
    .filter((_, index) => index !== currentId)
    .some(existingName => existingName.toLowerCase() === trimmedName)
}


export const validateUniqueCoordinationName = async (
  name: string,
  managementId: number,
  existingNames: string[],
  currentId?: number
): Promise<boolean> => {
  const trimmedName = name.trim().toLowerCase()
  return !existingNames
    .filter((_, index) => index !== currentId)
    .some(existingName => existingName.toLowerCase() === trimmedName)
}


export const createUniqueDirectionNameValidator = (existingNames: string[], currentId?: number) => {
  return z.string().refine(
    async (name) => validateUniqueDirectionName(name, existingNames, currentId),
    { message: 'Este nome já está sendo usado por outra direção' }
  )
}

export const createUniqueManagementNameValidator = (
  existingNames: string[],
  directionId: number,
  currentId?: number
) => {
  return z.string().refine(
    async (name) => validateUniqueManagementName(name, directionId, existingNames, currentId),
    { message: 'Este nome já está sendo usado por outra gerência nesta direção' }
  )
}

export const createUniqueCoordinationNameValidator = (
  existingNames: string[],
  managementId: number,
  currentId?: number
) => {
  return z.string().refine(
    async (name) => validateUniqueCoordinationName(name, managementId, existingNames, currentId),
    { message: 'Este nome já está sendo usado por outra coordenação nesta gerência' }
  )
}