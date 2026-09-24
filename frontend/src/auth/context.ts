import { createContext } from "react";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refreshSession: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
