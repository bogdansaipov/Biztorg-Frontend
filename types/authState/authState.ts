import { User } from "../user/user";
export interface AuthState {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  setAuth: (payload: { user: User }) => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
  hydrate: () => void;
}