import { FormEvent, useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { catalogClient } from "../services/api";
import { useI18n } from "../i18n/useI18n";
import { ragClient } from "../services/api";

interface CatalogItem {
  id: string;
  title: string;
  authors: string[];
  language: string;
  topics: string[];
  summary: string;
  source?: string | null;
  metadata?: Record<string, any> | null;
}

// Cover image component with error handling and placeholder
const CoverImage = ({ cover, title }: { cover?: string; title: string }) => {
  const [imgError, setImgError] = useState(false);
  
  return (
    <div className="w-20 h-28 flex items-center justify-center rounded border bg-gray-50 dark:bg-gray-700 overflow-hidden">
      {cover && !imgError ? (
        <img 
          src={cover} 
          alt={title} 
          className="w-full h-full object-cover" 
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-3xl">📚</span>
      )}
    </div>
  );
};

export const CatalogPage = () => {
  const { t, language: uiLanguage } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [isbn, setIsbn] = useState("");
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [localTitle, setLocalTitle] = useState("");
  const [localAuthors, setLocalAuthors] = useState("");
  const [localCoverUrl, setLocalCoverUrl] = useState("");

  // 統一的搜尋邏輯（使用 useCallback 避免無限循環）
  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const q = [query, scenario].filter(Boolean).join(" ");
      const searchLang = language || uiLanguage;
      const response = await catalogClient.search({ 
        q: q || undefined, 
        language: searchLang || undefined, 
        source: undefined 
      });
      const results: CatalogItem[] = response.results || [];
      setItems(results);
    } catch (error) {
      console.error('Search error:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query, scenario, language, uiLanguage]);

  // 從 URL 參數同步到 state
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = params.get('q') || '';
    const langParam = params.get('language') || '';
    if (qParam) setQuery(qParam);
    if (langParam) setLanguage(langParam);
  }, [location.search]);

  // 當搜尋相關狀態改變時執行搜尋
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const search = async (event?: FormEvent) => {
    event?.preventDefault();
    setLoading(true);
    try {
      const q = [query, scenario].filter(Boolean).join(" ");
      const searchLang = language || uiLanguage;
      const response = await catalogClient.search({ 
        q: q || undefined, 
        language: searchLang || undefined, 
        source: undefined 
      });
      const results: CatalogItem[] = response.results || [];
      setItems(results);
    } catch (error) {
      console.error('Search error:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addLocal = (e: FormEvent) => {
    e.preventDefault();
    const newItem: CatalogItem = {
      id: `local-${Date.now()}`,
      title: localTitle || t('titleLabel'),
      authors: localAuthors ? localAuthors.split(',').map(s => s.trim()).filter(Boolean) : [],
      language: language || 'und',
      topics: [],
      summary: '',
      source: 'Local',
      metadata: { isbn, cover_url: localCoverUrl }
    };
    setItems((prev) => [newItem, ...prev]);
    setLocalTitle("");
    setLocalAuthors("");
    setLocalCoverUrl("");
  };

  return (
    <section className="p-6 max-w-6xl mx-auto space-y-6">
      <h3 className="text-2xl font-bold">{t('catalogMetasearch')}</h3>
      <div className="flex gap-2">
        <button
          className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-700"
          onClick={async () => {
            // 先匯入範例到 DB，再將目錄嵌入向量庫
            try {
              await catalogClient.importSample();
            } catch (e) {
              // ignore to continue embedding
            }
            await ragClient.ingestCatalog().catch(() => {});
            await search();
          }}
        >匯入範例目錄</button>
      </div>
  <form className="grid gap-3 md:grid-cols-5 bg-white dark:bg-gray-800 p-4 rounded" onSubmit={(e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (language) params.set('language', language);
    const searchStr = params.toString();
    navigate(`/app/catalog${searchStr ? '?' + searchStr : ''}`);
  }}>
        <input className="border rounded px-3 py-2 md:col-span-2" placeholder={t('searchKeyword')} value={query} onChange={(e) => setQuery(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder={t('languageLabel')} value={language} onChange={(e) => setLanguage(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder={t('isbn')} value={isbn} onChange={(e) => setIsbn(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder={t('scenarioKeywords')} value={scenario} onChange={(e) => setScenario(e.target.value)} />
        <button type="submit" className="bg-indigo-600 text-white rounded px-4 py-2 md:col-span-1">{t('search')}</button>
      </form>

      <form className="grid gap-3 md:grid-cols-5 bg-white dark:bg-gray-800 p-4 rounded" onSubmit={addLocal}>
        <div className="md:col-span-5 font-semibold">{t('addBook')}</div>
        <input className="border rounded px-3 py-2" placeholder={t('titleLabel')} value={localTitle} onChange={(e) => setLocalTitle(e.target.value)} />
        <input className="border rounded px-3 py-2 md:col-span-2" placeholder={t('authorsLabel')} value={localAuthors} onChange={(e) => setLocalAuthors(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder={t('coverUrl')} value={localCoverUrl} onChange={(e) => setLocalCoverUrl(e.target.value)} />
        <button type="submit" className="bg-gray-100 dark:bg-gray-700 rounded px-4 py-2">{t('add')}</button>
      </form>

      {loading && <p>{t('loading')}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item) => {
          const cover = item.metadata?.cover_url as string | undefined;
          const isbnMeta = (item.metadata?.isbn as string | undefined) || (item.metadata?.ISBN as string | undefined);
          const lib = (item.metadata?.library_location as string | undefined);
          const mapUrl = lib ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lib)}` : undefined;
          
          return (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded shadow p-4 flex gap-4">
              <CoverImage cover={cover} title={item.title} />
              <div className="flex-1">
                <div className="font-semibold">{item.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.authors.join(", ")}</div>
                <div className="text-xs text-gray-500 mt-1">{item.language?.toUpperCase()} • {item.source ?? "Community"}{isbnMeta ? ` • ISBN ${isbnMeta}` : ''}</div>
                <p className="text-sm mt-2 line-clamp-3">{item.summary}</p>
                {lib && (
                  <div className="mt-2 text-xs">
                    <span className="text-gray-500">館藏地點：</span>
                    <a href={mapUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{lib}</a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
