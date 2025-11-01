import { RecommendationPanel } from "../components/RecommendationPanel";
import { SessionTelemetryPanel } from "../components/SessionTelemetryPanel";

export const DashboardPage = () => {
  return (
    <div className="dashboard-grid">
      <RecommendationPanel />
      <SessionTelemetryPanel />
    </div>
  );
};
