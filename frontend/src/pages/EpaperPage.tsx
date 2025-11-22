import { FormEvent, useState } from "react";

import { epaperClient } from "../services/api";

interface Card {
  heading: string;
  body: string;
  highlights: string[];
  metadata?: Record<string, unknown> | null;
}

export const EpaperPage = () => {
  const [title, setTitle] = useState("電子紙示例");
  const [text, setText] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [deviceGroup, setDeviceGroup] = useState("lab-demo");
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFormat = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await epaperClient.format({ title, text });
      setCards(response.cards);
      setLog((prev) => [
        `生成 ${response.cards.length} 張卡片`,
        ...prev
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const normalized = cards.map((c) => ({
        heading: c.heading,
        body: c.body,
        highlights: c.highlights,
        // API expects undefined, not null
        metadata: c.metadata || undefined,
      }));
      const response = await epaperClient.publish({ title, device_group: deviceGroup, cards: normalized });
      setLog((prev) => [
        `已發佈 Job ${response.job_id}（${response.card_count} 張卡片）`,
        ...prev
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="epaper-grid">
      <section className="panel">
        <h3>電子紙內容產生</h3>
        <form className="epaper-form" onSubmit={handleFormat}>
          <label>
            標題
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            裝置群組
            <input value={deviceGroup} onChange={(e) => setDeviceGroup(e.target.value)} />
          </label>
          <label>
            原始文本
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder="貼上要推播到電子紙的內容" />
          </label>
          <div className="epaper-actions">
            <button type="submit" disabled={loading || !text.trim()}>生成功能卡片</button>
            <button type="button" onClick={handlePublish} disabled={loading || cards.length === 0}>發佈到電子紙</button>
          </div>
        </form>
      </section>
      <section className="panel">
        <h3>卡片預覽</h3>
        {cards.length === 0 && <p>請先生成卡片。</p>}
        <div className="card-preview">
          {cards.map((card, idx) => (
            <article key={idx} className="epaper-card">
              <header>{card.heading}</header>
              <p>{card.body}</p>
              {card.highlights.length > 0 && (
                <ul>
                  {card.highlights.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>
      <section className="panel">
        <h3>同步記錄</h3>
        <ul className="catalog-list">
          {log.map((entry, idx) => (
            <li key={idx}>{entry}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};
