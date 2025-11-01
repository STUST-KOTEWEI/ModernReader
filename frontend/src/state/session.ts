import { create } from "zustand";

interface SessionState {
  token: string | null;
  user: { email: string } | null;
  setSession: (session: { token: string; user: { email: string } }) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  token: null,
  user: null,
  setSession: (session) => set({ token: session.token, user: session.user }),
  clear: () => set({ token: null, user: null })
}));
