import React from 'react';
import { useI18n } from '../i18n/useI18n';

type Props = {
  className?: string;
  label?: string;
  onChangeExtra?: (lang: string) => void; // optional hook for callers
};

/**
 * Reusable language dropdown (en/zh/ja) that updates global i18n store.
 */
export const LanguageSelect: React.FC<Props> = ({ className = '', label, onChangeExtra }) => {
  const { language, setLanguage } = useI18n();
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <label className="text-sm text-gray-600 dark:text-gray-300" htmlFor="language-select">
          {label}
        </label>
      )}
      <select
        id="language-select"
        value={language}
        onChange={(e) => {
          const lang = e.target.value as any;
          setLanguage(lang);
          if (onChangeExtra) onChangeExtra(lang);
        }}
        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
        aria-label={label || 'Language'}
      >
        <option value="en">English</option>
        <option value="zh">中文</option>
        <option value="ja">日本語</option>
      </select>
    </div>
  );
};
