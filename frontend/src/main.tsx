import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppLayout } from "./pages/AppLayout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CatalogPage } from "./pages/CatalogPage";
import { EpaperPage } from "./pages/EpaperPage";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { AIAssistantDemoPage } from "./pages/AIAssistantDemoPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { AudioPage } from "./pages/AudioPage";
import IndigenousLanguagePage from "./pages/IndigenousLanguagePage";
import IndigenousChatbotPage from "./pages/IndigenousChatbotPage";
import PodcastPage from "./pages/PodcastPage";
import DevicesPage from "./pages/DevicesPage";
import SettingsPage from "./pages/SettingsPage";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/app/*" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="epaper" element={<EpaperPage />} />
          <Route path="ai" element={<AIAssistantPage />} />
          <Route path="ai-demo" element={<AIAssistantDemoPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="audio" element={<AudioPage />} />
          <Route path="podcast" element={<PodcastPage />} />
          <Route path="devices" element={<DevicesPage />} />
          <Route path="indigenous" element={<IndigenousLanguagePage />} />
          <Route path="indigenous-chat" element={<IndigenousChatbotPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
