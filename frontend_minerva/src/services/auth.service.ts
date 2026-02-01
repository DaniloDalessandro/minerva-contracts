import {
  changePasswordAPI,
  logoutAPI,
} from '@/lib/api/auth';
import type {
  ChangePasswordData,
  ChangePasswordResponse,
} from '@/types/entities/auth';

export class AuthService {
  static async changePassword(data: ChangePasswordData): Promise<ChangePasswordResponse> {
    console.log("🔑 Alterando senha do usuário");
    const result = await changePasswordAPI(data);
    console.log("✅ Senha alterada com sucesso");
    return result;
  }

  static async logout(): Promise<void> {
    console.log("👋 Realizando logout");
    await logoutAPI();
    console.log("✅ Logout realizado com sucesso");
  }

  static async refreshToken(): Promise<void> {
    console.log("🔄 Renovando token de autenticação");
    // Token refresh is handled automatically by apiClient
    console.log("✅ Token renovado automaticamente");
  }
}
