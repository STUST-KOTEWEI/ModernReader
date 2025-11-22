import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";

import { AppLayout } from "./pages/AppLayout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CatalogPage } from "./pages/CatalogPage";
import { EpaperPage } from "./pages/EpaperPage";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { AIAssistantDemoPage } from "./pages/AIAssistantDemoPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { AudioPage } from "./pages/AudioPage";
import IndigenousLanguagePage from "./pages/IndigenousLanguagePage";
import IndigenousChatbotPage from "./pages/IndigenousChatbotPage";
import { PronunciationPracticePage } from "./pages/PronunciationPracticePage";
import { LearningProgressPage } from "./pages/LearningProgressPage";
import { DemoTourPage } from "./pages/DemoTourPage";
import PodcastPage from "./pages/PodcastPage";
import DeviceIntegrationPage from "./pages/DeviceIntegrationPage";
import ARSimulationPage from "./pages/ARSimulationPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import EmotionPage from "./pages/EmotionPage";
import NotFoundPage from "./pages/NotFoundPage";
import { PrototypeShowcasePage } from "./pages/PrototypeShowcasePage";
import "./styles/global.css";

const RouterImpl = (typeof window !== 'undefined' && window.location.protocol === 'file:') ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterImpl>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/prototype" element={<PrototypeShowcasePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
  <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/app/*" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="epaper" element={<EpaperPage />} />
          <Route path="ai" element={<AIAssistantPage />} />
          <Route path="ai-demo" element={<AIAssistantDemoPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="audio" element={<AudioPage />} />
          <Route path="podcast" element={<PodcastPage />} />
          <Route path="devices" element={<DeviceIntegrationPage />} />
          <Route path="ar" element={<ARSimulationPage />} />
          <Route path="emotion" element={<EmotionPage />} />
          <Route path="indigenous" element={<IndigenousLanguagePage />} />
          <Route path="indigenous-chat" element={<IndigenousChatbotPage />} />
          <Route path="pronunciation" element={<PronunciationPracticePage />} />
          <Route path="progress" element={<LearningProgressPage />} />
          <Route path="tour" element={<DemoTourPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage scope="app" />} />
        </Route>
        <Route path="*" element={<NotFoundPage scope="root" />} />
      </Routes>
    </RouterImpl>
  </React.StrictMode>
);
