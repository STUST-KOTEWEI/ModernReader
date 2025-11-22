import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";

type Scope = "root" | "app";

export default function NotFoundPage({ scope = "root" }: { scope?: Scope }) {
  const { t } = useI18n();
  const primaryHref = scope === "app" ? "/app" : "/";
  const primaryText = scope === "app" ? t("goDashboard") : t("goHome");

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="text-7xl font-extrabold text-indigo-600">404</div>
        <h1 className="mt-4 text-2xl font-bold">{t("notFoundTitle")}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {t("notFoundHint")}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to={primaryHref}
            className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
          >
            {primaryText}
          </Link>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t("goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
