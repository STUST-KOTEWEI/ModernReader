import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useSessionStore } from "../state/session";

export const AppLayout = () => {
  const { user } = useSessionStore();

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
};
