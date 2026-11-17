
export interface SetorUserEmailRef {
  email: string;
}


export interface Direction {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: SetorUserEmailRef;
  updated_by?: SetorUserEmailRef;
}


export interface Management {
  id: number;
  name: string;
  is_active: boolean;
  direction: number | { id: number; name: string };
  created_at: string;
  updated_at: string;
  created_by?: SetorUserEmailRef;
  updated_by?: SetorUserEmailRef;
}


export interface Coordination {
  id: number;
  name: string;
  is_active: boolean;
  management: number | { id: number; name: string };
  created_at: string;
  updated_at: string;
  created_by?: SetorUserEmailRef;
  updated_by?: SetorUserEmailRef;
}
