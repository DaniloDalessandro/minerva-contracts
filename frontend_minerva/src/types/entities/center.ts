
export interface UserEmailReference {
  email: string;
}


export interface ManagementCenter {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: UserEmailReference;
  updated_by?: UserEmailReference;
}


export interface RequestingCenter {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  management_center: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
  created_by?: UserEmailReference;
  updated_by?: UserEmailReference;
}
