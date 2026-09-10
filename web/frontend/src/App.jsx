import { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import './App.css';

const starterText = `在資訊快速流動的時代，閱讀不只是把文字看完，而是讓想法真正留下來。\n\nModernReader 將長篇內容拆成容易開始的小段落，搭配語音導讀、摘要與情緒標記，讓每一次閱讀都更有節奏。\n\n你可以先從一個問題開始：這一段文字讓我感到什麼？它和我的生活有什麼關係？當讀者能夠停下來思考，閱讀就不再只是接收資訊，而是與內容建立連結。`;
const emotions = [
  { label: '啟發', icon: '✦', color: '#d97706' },
  { label: '平靜', icon: '○', color: '#0f766e' },
  { label: '困惑', icon: '?', color: '#7c3aed' },
  { label: '緊張', icon: '!', color: '#dc2626' },
];

function parseText(raw, fileName = '示範文章') {
  const clean = raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\r/g, '')
    .trim();
  const paragraphs = clean.split(/\n\s*\n|(?<=[。！？.!?])\s{2,}/).map((p) => p.trim()).filter(Boolean);
  return { title: fileName.replace(/\.(epub|txt|md|html?)$/i, '') || '未命名書籍', paragraphs: paragraphs.length ? paragraphs : [starterText] };
}

async function parseEpub(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const container = new DOMParser().parseFromString(await zip.file('META-INF/container.xml').async('text'), 'application/xml');
  const rootfile = container.querySelector('rootfile')?.getAttribute('full-path');
  if (!rootfile || !zip.file(rootfile)) throw new Error('EPUB 缺少有效的 OPF 封裝資訊');
  const opf = new DOMParser().parseFromString(await zip.file(rootfile).async('text'), 'application/xml');
  const manifest = new Map([...opf.querySelectorAll('manifest > item')].map((item) => [item.getAttribute('id'), item.getAttribute('href')]));
  const base = rootfile.includes('/') ? rootfile.slice(0, rootfile.lastIndexOf('/') + 1) : '';
  const chapters = [];
  for (const ref of opf.querySelectorAll('spine > itemref')) {
    const href = manifest.get(ref.getAttribute('idref'));
    const path = href ? `${base}${href}`.replace(/\/[^/]+\/\.\.\//g, '/') : '';
    const entry = path && zip.file(path);
    if (!entry) continue;
    const document = new DOMParser().parseFromString(await entry.async('text'), 'text/html');
    const text = document.body?.textContent?.replace(/\s+/g, ' ').trim();
    if (text) chapters.push(text);
  }
  const title = opf.querySelector('metadata > title, dc\\:title')?.textContent?.trim() || file.name.replace(/\.epub$/i, '');
  return { title, paragraphs: chapters.length ? chapters : [starterText] };
}

function App() {
  const [book, setBook] = useState(() => JSON.parse(localStorage.getItem('modernreader-book') || 'null') || parseText(starterText));
  const [active, setActive] = useState(0);
  const [marks, setMarks] = useState(() => JSON.parse(localStorage.getItem('modernreader-marks') || '{}'));
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [fontSize, setFontSize] = useState('normal');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => localStorage.setItem('modernreader-book', JSON.stringify(book)), [book]);
  useEffect(() => localStorage.setItem('modernreader-marks', JSON.stringify(marks)), [marks]);
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target.matches('textarea, input')) return;
      if (event.key === 'ArrowLeft') setActive((n) => Math.max(0, n - 1));
      if (event.key === 'ArrowRight') setActive((n) => Math.min(book.paragraphs.length - 1, n + 1));
      if (event.code === 'Space') { event.preventDefault(); speak(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, book.paragraphs.length, isSpeaking]);

  const progress = Math.round(((active + 1) / book.paragraphs.length) * 100);
  const currentMark = marks[active];
  const wordCount = useMemo(() => book.paragraphs.join(' ').split(/\s+/).filter(Boolean).length, [book]);

  async function importFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const imported = file.name.toLowerCase().endsWith('.epub') ? await parseEpub(file) : await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(parseText(String(reader.result), file.name));
        reader.onerror = reject;
        reader.readAsText(file);
      });
      setBook(imported); setActive(0); setMarks({}); setAnswer('');
    } catch (error) {
      setAnswer(`無法讀取這本 EPUB：${error.message}`);
    } finally { setIsImporting(false); }
    event.target.value = '';
  }

  function speak() {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(book.paragraphs[active]);
    utterance.lang = /[\u4e00-\u9fff]/.test(book.paragraphs[active]) ? 'zh-TW' : 'en-US';
    utterance.rate = 0.92;
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance); setIsSpeaking(true);
  }

  function summarize() {
    const text = book.paragraphs[active];
    const sentences = text.split(/(?<=[。！？.!?])/).filter(Boolean);
    setAnswer(`本段重點：${(sentences.slice(0, 2).join('') || text).slice(0, 180)}${text.length > 180 ? '…' : ''}`);
  }

  function askBook() {
    const question = query.trim();
    if (!question) return;
    const match = book.paragraphs.find((p) => p.includes(question)) || book.paragraphs[active];
    setAnswer(`根據目前書籍內容，最相關的段落是：「${match.slice(0, 220)}${match.length > 220 ? '…' : ''}」\n\n這是離線示範模式；接上 LLM API 後，可升級為真正的 RAG 書籍問答。`);
  }

  function markEmotion(emotion) {
    setMarks((old) => ({ ...old, [active]: emotion }));
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">MR</span><div><strong>ModernReader</strong><small>讓閱讀變得可呼吸</small></div></div>
        <div className="top-actions"><button className="ghost-button" disabled={isImporting} onClick={() => fileInput.current?.click()}>{isImporting ? '讀取中…' : '＋ 匯入書籍'}</button><input ref={fileInput} hidden type="file" accept=".epub,.txt,.md,.html,.htm" onChange={importFile} /><button className="icon-button" aria-label="切換字體大小" onClick={() => setFontSize(fontSize === 'large' ? 'normal' : 'large')}>Aa</button></div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <div className="eyebrow">MY LIBRARY</div><h2>我的書櫃</h2>
          <div className="book-card active-book"><div className="book-cover">{book.title.slice(0, 2).toUpperCase()}</div><div><strong>{book.title}</strong><span>{book.paragraphs.length} 個閱讀段落</span></div></div>
          <div className="progress-box"><div className="progress-row"><span>閱讀進度</span><b>{progress}%</b></div><div className="progress-track"><i style={{ width: `${progress}%` }} /></div><small>今日已閱讀 {active + 1} 段 · 約 {Math.max(1, Math.ceil(wordCount / 180))} 分鐘</small></div>
          <div className="eyebrow toc-label">TABLE OF CONTENTS</div><nav className="toc">{book.paragraphs.map((paragraph, index) => <button key={index} className={active === index ? 'toc-item selected' : 'toc-item'} onClick={() => setActive(index)}><span>{String(index + 1).padStart(2, '0')}</span>{paragraph.slice(0, 28)}{paragraph.length > 28 ? '…' : ''}</button>)}</nav>
        </aside>

        <section className={`reader ${fontSize}`}>
          <div className="reader-meta"><span>正在閱讀</span><span>{active + 1} / {book.paragraphs.length}</span></div>
          <h1>{book.title}</h1><p className="reader-subtitle">你的專注閱讀空間</p>
          <div className="focus-card"><div className="focus-label">FOCUS MODE <span>●</span></div><p>{book.paragraphs[active]}</p>{currentMark && <div className="current-mark" style={{ color: currentMark.color }}>已標記為「{currentMark.label}」</div>}</div>
          <div className="reader-controls"><button className="primary-button" onClick={speak}>{isSpeaking ? '■ 停止朗讀' : '▶ 語音導讀'}</button><button className="secondary-button" onClick={summarize}>✦ 生成摘要</button><span className="control-hint">Space 播放 · ← → 切換段落</span></div>
          <div className="emotion-panel"><div><h3>這段文字帶給你什麼感受？</h3><p>留下情緒標記，建立你的個人閱讀地圖。</p></div><div className="emotion-buttons">{emotions.map((emotion) => <button key={emotion.label} className={currentMark?.label === emotion.label ? 'emotion active' : 'emotion'} onClick={() => markEmotion(emotion)} style={{ '--emotion': emotion.color }}><b>{emotion.icon}</b>{emotion.label}</button>)}</div></div>
          <div className="pager"><button disabled={active === 0} onClick={() => setActive((n) => n - 1)}>← 上一段</button><button disabled={active === book.paragraphs.length - 1} onClick={() => setActive((n) => n + 1)}>下一段 →</button></div>
        </section>

        <aside className="insight-panel"><div className="eyebrow">AI READING COMPANION</div><h2>一起理解這本書</h2><p className="muted">離線模式會根據目前匯入的內容提供基礎回應。</p><div className="question-box"><textarea value={query} onChange={(e) => setQuery(e.target.value)} placeholder="問問這本書，例如：這一段的重點是什麼？" rows="4" /><button onClick={askBook}>詢問 ModernReader <span>↗</span></button></div>{answer && <div className="answer-box"><div className="answer-title">ModernReader 的回應</div>{answer}</div>}<div className="insight-divider" /><div className="eyebrow">YOUR READING SIGNALS</div><div className="signal"><span className="signal-dot calm" /><div><strong>{Object.keys(marks).length ? '你正在建立閱讀情緒地圖' : '還沒有情緒標記'}</strong><small>{Object.keys(marks).length ? `${Object.keys(marks).length} 個段落已被記錄` : '標記第一段，開始觀察自己的閱讀感受'}</small></div></div></aside>
      </main>
    </div>
  );
}

export default App;
