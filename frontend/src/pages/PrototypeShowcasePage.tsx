import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { prototypeClient } from "../services/api";
import type {
  PrototypeInterestPayload,
  PrototypeOverview,
  PrototypePreviewMode,
  PrototypeTimelinePhase,
} from "../types/prototype";
import { Button, Card } from "../design-system";

const gradientBg =
  "bg-gradient-to-br from-rose-50 via-amber-50 to-indigo-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800";
const inputClass =
  "w-full rounded-2xl border border-gray-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition";

const PreviewPill: React.FC<{
  mode: PrototypePreviewMode;
  active: boolean;
  onSelect: () => void;
}> = ({ mode, active, onSelect }) => (
  <button
    onClick={onSelect}
    className={`px-4 py-3 rounded-2xl text-left border transition-all ${
      active
        ? "bg-white/90 dark:bg-slate-900/80 border-indigo-300 shadow-lg"
        : "bg-white/40 dark:bg-slate-900/30 border-transparent hover:border-indigo-200"
    }`}
  >
    <div className="flex items-center gap-3">
      <span className="text-2xl">{mode.title.slice(0, 1)}</span>
      <div>
        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
          {mode.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {mode.caption}
        </p>
      </div>
    </div>
  </button>
);

const InterestForm: React.FC<{
  onSuccess: () => void;
}> = ({ onSuccess }) => {
  const [payload, setPayload] = useState<PrototypeInterestPayload>({
    name: "",
    email: "",
    role: "",
    organization: "",
    focus_area: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (key: keyof PrototypeInterestPayload, value: string) => {
    setPayload((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const sanitized: PrototypeInterestPayload = {
        ...payload,
        organization: payload.organization?.trim()
          ? payload.organization.trim()
          : undefined,
        focus_area: payload.focus_area?.trim()
          ? payload.focus_area.trim()
          : undefined,
        message: payload.message?.trim()
          ? payload.message.trim()
          : undefined,
      };
      await prototypeClient.submitInterest(sanitized);
      setSuccess("我們已收到訊息，團隊將與你聯繫！");
      setPayload({
        name: "",
        email: "",
        role: "",
        organization: "",
        focus_area: "",
        message: "",
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      setError("提交失敗，請稍後再試或寫信至 hello@modernreader.com");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-white/60 dark:border-slate-800 p-6 space-y-4"
      onSubmit={handleSubmit}
    >
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          參與共創
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          說說你擅長的領域，我們會寄送下一版原型。
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <input
          required
          className={inputClass}
          placeholder="姓名 / Name"
          value={payload.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
        <input
          required
          type="email"
          className={inputClass}
          placeholder="Email"
          value={payload.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
        <input
          required
          className={inputClass}
          placeholder="角色 (AI / HCI / Content / Ops)"
          value={payload.role}
          onChange={(e) => handleChange("role", e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="機構 / Organization"
          value={payload.organization}
          onChange={(e) => handleChange("organization", e.target.value)}
        />
      </div>
      <input
        className={inputClass}
        placeholder="想聚焦的模組 (Podcast / DRM / Indigenous / Device)"
        value={payload.focus_area}
        onChange={(e) => handleChange("focus_area", e.target.value)}
      />
      <textarea
        className={`${inputClass} h-28`}
        placeholder="備註 / 想法 / 想參與的方式"
        value={payload.message}
        onChange={(e) => handleChange("message", e.target.value)}
      />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "送出中..." : "送出共創意願"}
      </Button>
      <p className="text-xs text-gray-400 text-center">
        或直接 Email：hello@modernreader.com · Discord：discord.gg/modernreader
      </p>
    </form>
  );
};

export const PrototypeShowcasePage: React.FC = () => {
  const [data, setData] = useState<PrototypeOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePreview, setActivePreview] = useState("device");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const overview = await prototypeClient.getOverview();
        if (mounted) {
          setData(overview);
          setActivePreview(overview.preview_modes[0]?.id ?? "device");
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const previewMode = useMemo(
    () => data?.preview_modes.find((m) => m.id === activePreview),
    [activePreview, data]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading prototype…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Failed to load prototype data.
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${gradientBg}`}>
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        <header className="text-center space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500">
            Prototype v1
          </p>
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white">
            {data.hero.headline}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {data.hero.promise}
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-500">
            <span className="px-3 py-1 rounded-full bg-white/60 dark:bg-slate-900/60">
              {data.hero.subheading}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/60 dark:bg-slate-900/60">
              {data.hero.location}
            </span>
          </div>
          <div className="flex gap-6 justify-center">
            {data.hero.hero_stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-semibold text-indigo-600">
                  {stat.label}
                </p>
                <p className="text-sm text-gray-500">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.context}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4 justify-center">
            <Link to="/signup">
              <Button variant="primary">登入後試用 Dashboard</Button>
            </Link>
            <Link to="/app/tour">
              <Button variant="secondary" className="bg-white/80">
                瀏覽內部 Tour
              </Button>
            </Link>
          </div>
        </header>

        {/* Features */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              核心模組
            </h2>
            <p className="text-sm text-gray-500">
              E Ink · Podcast · DRM · Indigenous · AI Companion
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.features.map((feature) => (
              <Card
                key={feature.id}
                className="p-6 shadow-lg border border-white/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur"
              >
                <div className="text-3xl">{feature.icon}</div>
                <h3 className="text-xl font-semibold mt-3 mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{feature.summary}</p>
                <div className="text-xs text-indigo-600 font-semibold tracking-wide">
                  {feature.pillar}
                </div>
                {feature.metric_label && (
                  <p className="text-sm text-gray-500 mt-1">
                    {feature.metric_label}:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {feature.metric_value}
                    </span>
                  </p>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Preview */}
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-3">
            <p className="uppercase text-xs tracking-[0.4em] text-gray-500">
              Prototype Console
            </p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              互動預覽
            </h2>
            <p className="text-sm text-gray-500">
              四種預覽面板，展示柔性電子紙、Podcast、DRM、AI 伴侶的即時狀態。
            </p>
            <div className="space-y-2">
              {data.preview_modes.map((mode) => (
                <PreviewPill
                  key={mode.id}
                  mode={mode}
                  active={mode.id === activePreview}
                  onSelect={() => setActivePreview(mode.id)}
                />
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-white/70 dark:border-slate-800 p-6 relative overflow-hidden">
            {previewMode && (
              <div className="space-y-4 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">✨</span>
                  <div>
                    <p className="text-lg font-semibold">{previewMode.title}</p>
                    <p className="text-sm text-gray-500">
                      {previewMode.caption}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 shadow-inner">
                  <p className="text-sm uppercase tracking-[0.4em] text-white/60 mb-2">
                    {previewMode.illustration.toUpperCase()}
                  </p>
                  <p className="text-2xl font-semibold mb-4">
                    Sweet Flow Interactive
                  </p>
                  <ul className="space-y-2 text-sm">
                    {previewMode.actions.map((action) => (
                      <li key={action} className="flex items-center gap-2">
                        <span>•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Flows */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sweet × Podcast × DRM
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {data.flows.map((flow) => (
              <Card
                key={flow.id}
                className="p-6 bg-white/80 dark:bg-slate-900/80 border border-white/70 dark:border-slate-800"
              >
                <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
                  {flow.id}
                </p>
                <h3 className="text-2xl font-semibold mt-2 mb-4">
                  {flow.title}
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {flow.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span>•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm font-semibold text-indigo-600">
                  {flow.highlight}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            134 週執行路線
          </h2>
          <div className="grid lg:grid-cols-4 gap-6">
            {data.timeline.map((phase: PrototypeTimelinePhase) => (
              <div
                key={phase.phase}
                className="rounded-3xl border border-white/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 p-5"
              >
                <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
                  {phase.weeks}
                </p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-2 mb-3">
                  {phase.phase}
                </h3>
                <ul className="text-sm text-gray-500 space-y-1">
                  {phase.focus.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <p className="text-sm text-indigo-600 font-semibold mt-4">
                  {phase.outcome}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="grid lg:grid-cols-[2fr,1fr] gap-6 items-start">
          <Card className="p-6 bg-gradient-to-br from-indigo-700 to-purple-700 text-white shadow-2xl border-none">
            <p className="uppercase text-xs tracking-[0.4em] text-white/70 mb-2">
              Join Us
            </p>
            <h2 className="text-3xl font-semibold mb-3">
              {data.call_to_action.headline}
            </h2>
            <p className="text-sm text-white/80 mb-4">
              {data.call_to_action.subtitle}
            </p>
            <div className="space-y-2 text-sm">
              <p>
                Email:{" "}
                <a
                  className="underline"
                  href={`mailto:${data.call_to_action.contact_email}`}
                >
                  {data.call_to_action.contact_email}
                </a>
              </p>
              <p>
                Discord:{" "}
                <a
                  className="underline"
                  href={data.call_to_action.discord}
                  target="_blank"
                  rel="noreferrer"
                >
                  {data.call_to_action.discord}
                </a>
              </p>
              {data.call_to_action.deck_url && (
                <p>
                  Pitch deck:{" "}
                  <a
                    className="underline"
                    href={data.call_to_action.deck_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {data.call_to_action.deck_url}
                  </a>
                </p>
              )}
            </div>
          </Card>
          <InterestForm onSuccess={() => {}} />
        </section>
      </div>
    </div>
  );
};
