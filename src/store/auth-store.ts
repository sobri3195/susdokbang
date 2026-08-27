import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = {
  name: string;
  role: "Admin" | "Analis" | "Dokter Penerbangan" | "Pimpinan";
  unit: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  login: (username: string) => void;
  setRole: (role: User["role"]) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (username) =>
        set({
          token: "demo-token-csakt",
          user: {
            name: username || "Operator CSAKT",
            role: "Admin",
            unit: "LAKESPRA",
          },
        }),
      setRole: (role) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                role,
                unit: role === "Pimpinan" ? "PUSKESAU" : "LAKESPRA",
              }
            : state.user,
        })),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "csakt-auth-v2",
      storage: {
        getItem: (name) => {
          const value = sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    },
  ),
);
