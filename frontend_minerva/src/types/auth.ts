// User data
export interface UserData {
  id: string;
  email: string;
  name: string;
}

// JWT Payload
export interface JWTPayload {
  exp: number;
  [key: string]: any;
}

// Auth Context Type
export interface AuthContextType {
  user: UserData | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: { access: string; refresh: string; user: UserData }) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

// Change Password
export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}

// Login Response (for reference)
export interface LoginResponse {
  access: string;
  refresh: string;
  user: UserData;
}
