// User reference for created_by/updated_by
export interface UserEmailReference {
  email: string;
}

// Direction (Diretoria)
export interface Direction {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: UserEmailReference;
  updated_by?: UserEmailReference;
}

// Management (Gerência)
export interface Management {
  id: number;
  name: string;
  is_active: boolean;
  direction: number;
  created_at: string;
  updated_at: string;
  created_by?: UserEmailReference;
  updated_by?: UserEmailReference;
}

// Coordination (Coordenação)
export interface Coordination {
  id: number;
  name: string;
  is_active: boolean;
  management: number;
  created_at: string;
  updated_at: string;
  created_by?: UserEmailReference;
  updated_by?: UserEmailReference;
}
