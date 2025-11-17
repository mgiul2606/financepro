// Profile types based on backend schemas

export enum ProfileType {
  PERSONAL = 'personal',
  FAMILY = 'family',
  BUSINESS = 'business',
}

export enum DatabaseType {
  POSTGRESQL = 'postgresql',
  MSSQL = 'mssql',
}

export interface FinancialProfile {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  profile_type: ProfileType;
  default_currency: string;
  database_connection_string?: string;
  database_type?: DatabaseType;
  is_active: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialProfileCreate {
  name: string;
  description?: string;
  profile_type?: ProfileType;
  default_currency?: string;
  database_connection_string?: string;
  database_type?: DatabaseType;
}

export interface FinancialProfileUpdate {
  name?: string;
  description?: string;
  profile_type?: ProfileType;
  default_currency?: string;
  database_connection_string?: string;
  database_type?: DatabaseType;
  is_active?: boolean;
}

export interface FinancialProfileListResponse {
  profiles: FinancialProfile[];
  total: number;
}

export interface ProfileSelection {
  id: string;
  user_id: string;
  active_profile_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ProfileSelectionUpdate {
  active_profile_ids: string[];
}

export interface MainProfile {
  user_id: string;
  main_profile_id?: string;
}

export interface MainProfileUpdate {
  main_profile_id: string;
}
