import { FormEvent, useEffect, useState } from "react";

import { catalogClient } from "../services/api";

interface CatalogItem {
  id: string;
  title: string;
  authors: string[];
  language: string;
  topics: string[];
  summary: string;
  source?: string | null;
}

export const CatalogPage = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [query, setQuery] = useState("forest");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void search();
  }, []);

  const search = async (event?: FormEvent) => {
    event?.preventDefault();
    setLoading(true);
    try {
      const response = await catalogClient.search({ q: query || undefined, language: language || undefined });
      setItems(response.results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h3>Catalog Metasearch</h3>
      <form className="catalog-search" onSubmit={search}>
        <input placeholder="Search keyword" value={query} onChange={(e) => setQuery(e.target.value)} />
        <input placeholder="Language" value={language} onChange={(e) => setLanguage(e.target.value)} />
        <button type="submit">Search</button>
      </form>
      {loading && <p>Loading…</p>}
      <ul className="catalog-list">
        {items.map((item) => (
          <li key={item.id}>
            <div className="panel-item">
              <strong>{item.title}</strong>
              <span>{item.authors.join(", ")}</span>
              <small>{item.language.toUpperCase()} • {item.source ?? "Community"}</small>
              <p>{item.summary}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
