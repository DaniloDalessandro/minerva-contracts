import { z } from 'zod'


export const managementCenterSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'O registro deve conter mais de uma letra')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/.*[a-zA-Z].*[a-zA-Z].*/, 'O registro deve conter pelo menos duas letras')
    .trim(),
})


export const requestingCenterSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'O registro deve conter mais de uma letra')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/.*[a-zA-Z].*[a-zA-Z].*/, 'O registro deve conter pelo menos duas letras')
    .trim(),
  management_center_id: z
    .number({ required_error: 'Centro gestor é obrigatório' })
    .min(1, 'Selecione um centro gestor válido')
})


export type ManagementCenterFormData = z.infer<typeof managementCenterSchema>
export type RequestingCenterFormData = z.infer<typeof requestingCenterSchema>


export const validateUniqueName = async (
  name: string,
  existingNames: string[],
  currentId?: number
): Promise<boolean> => {
  const trimmedName = name.trim().toLowerCase()
  return !existingNames
    .filter((_, index) => index !== currentId)
    .some(existingName => existingName.toLowerCase() === trimmedName)
}


export const createUniqueManagementCenterNameValidator = (existingNames: string[], currentId?: number) => {
  return z.string().refine(
    async (name) => validateUniqueName(name, existingNames, currentId),
    { message: 'Este nome já está sendo usado por outro centro gestor' }
  )
}


export const createUniqueRequestingCenterNameValidator = (
  existingNames: string[],
  currentId?: number
) => {
  return z.string().refine(
    async (name) => validateUniqueName(name, existingNames, currentId),
    { message: 'Este nome já está sendo usado por outro centro solicitante neste centro gestor' }
  )
}