export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  lastLogin: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  loading: boolean;
  error: string | null;
}
