
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}


export interface UserReference {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
}


export interface AuditFields {
  created_at: string;
  updated_at: string;
  created_by: UserReference | null;
  updated_by: UserReference | null;
}


export interface OptimisticUpdate {
  isOptimistic?: boolean;
}


export interface ApiError {
  error: string;
  message?: string;
}
