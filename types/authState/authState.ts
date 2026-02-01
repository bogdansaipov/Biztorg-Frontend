import { User } from "../user/user";

export interface AuthState {
    user: User | null,
    token: string | null,
    setAuth: (data: {user: User}) => void;
    logout: () => void;
}