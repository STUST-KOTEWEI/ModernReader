import { Outlet, Link, Navigate, useLocation } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useSessionStore } from "../state/session";
import React from "react";
import { userClient } from "../services/api";
import { useI18n } from "../i18n/useI18n";
import { HealthBanner } from "../components/HealthBanner";
import { FloatingChatbot } from "../components/FloatingChatbot";

export const AppLayout = () => {
  const { user, token } = useSessionStore();
  const setSession = useSessionStore((s) => s.setSession);
  const location = useLocation();
  const [hydrating, setHydrating] = React.useState(true);
  const { setLanguage } = useI18n();

  // Hydrate session from localStorage once on mount
  React.useEffect(() => {
    if (!token) {
      try {
        const savedToken = localStorage.getItem("mr_jwt");
        const savedEmail = localStorage.getItem("mr_email");
        if (savedToken && savedEmail) {
          setSession({ token: savedToken, user: { email: savedEmail } });
        }
      } catch {}
    }
    // even if nothing found, stop hydrating to allow redirect
    const id = setTimeout(() => setHydrating(false), 0);
    return () => clearTimeout(id);
  }, []);

  // Once we have a token, load user settings and apply preferred language
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) return;
      try {
        const s: any = await userClient.getSettings(token);
        if (!mounted) return;
        if (s && typeof s === 'object' && 'default_language' in s && typeof s.default_language === 'string') {
          setLanguage(s.default_language as any);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [token]);

  // Protect /app routes: require login
  if (hydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <main className="app-content">
        <HealthBanner />
        <Outlet />
        <FloatingChatbot />
      </main>
    </div>
  );
};
