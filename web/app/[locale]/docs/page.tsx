"use client";

import { useEffect, useMemo, useState } from "react";
import { Upload, Loader2, FileText, Search, BookOpen, Sparkles } from "lucide-react";

type DocumentRecord = {
  id: string;
  title: string;
  filename: string;
  language?: string | null;
  content_type: string;
  size_bytes: number;
  page_count?: number | null;
  chunk_count: number;
  uploaded_at: string;
};

type DocListResponse = { documents: DocumentRecord[] };

type DocUploadResponse = { document: DocumentRecord; message: string };

type DocQuerySnippet = {
  text: string;
  document_id: string;
  title?: string | null;
  score: number;
};

type DocQueryResponse = {
  answer: string;
  snippets: DocQuerySnippet[];
  generated_at: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8001";

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function DocsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("zh-TW");
  const [community, setCommunity] = useState("");
  const [persona, setPersona] = useState("guide");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [question, setQuestion] = useState("");
  const [topK, setTopK] = useState(4);
  const [querying, setQuerying] = useState(false);
  const [answer, setAnswer] = useState<string>("");
  const [snippets, setSnippets] = useState<DocQuerySnippet[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/docs`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data: DocListResponse = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
      setError("無法讀取文件列表，請確認後端已啟動且 OPENAI_API_KEY 已設置。");
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadMessage("請先選擇檔案（PDF/TXT/MD）");
      return;
    }
    setUploading(true);
    setUploadMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title.trim()) formData.append("title", title.trim());
      if (language) formData.append("language", language);
      if (community.trim()) formData.append("community", community.trim());

      const res = await fetch(`${API_BASE}/api/v1/docs/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || "上傳失敗");
      }
      const data: DocUploadResponse = await res.json();
      setUploadMessage(data.message || "上傳成功");
      setDocuments((prev) => [data.document, ...prev]);
      setFile(null);
      setTitle("");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "上傳失敗，請稍後再試");
    } finally {
      setUploading(false);
    }
  };

  const handleQuery = async () => {
    if (!question.trim()) {
      setError("請輸入問題");
      return;
    }
    setQuerying(true);
    setError(null);
    setAnswer("");
    setSnippets([]);

    try {
      const res = await fetch(`${API_BASE}/api/v1/docs/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          top_k: topK,
          doc_ids: selectedDocIds.size ? Array.from(selectedDocIds) : undefined,
          language,
          community: community || undefined,
          persona,
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || "查詢失敗");
      }
      const data: DocQueryResponse = await res.json();
      setAnswer(data.answer);
      setSnippets(data.snippets || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "查詢失敗，請稍後再試");
    } finally {
      setQuerying(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formattedDocs = useMemo(
    () =>
      documents.map((doc) => ({
        ...doc,
        uploadedLabel: new Date(doc.uploaded_at).toLocaleString(),
      })),
    [documents]
  );

  return (
    <div className="p-8 lg:p-12 space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-4xl text-[#1a1a1a] mb-2 flex items-center gap-3">
            <BookOpen size={36} /> 私有資料室
          </h1>
          <p className="text-[#666]">上傳 PDF/TXT/MD，使用 OpenAI Embedding + 本地向量檢索回答問題。</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#e5e0d8] px-4 py-2 rounded-full shadow-sm text-sm text-[#444]">
          <Sparkles size={16} className="text-yellow-500" />
          需要 `OPENAI_API_KEY`（後端）與 `NEXT_PUBLIC_API_BASE`
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload */}
        <form onSubmit={handleUpload} className="bg-white rounded-2xl border border-[#e5e0d8] p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#1a1a1a]">
            <Upload size={20} />
            <h2 className="font-semibold text-lg">上傳並索引</h2>
          </div>

          <label className="block">
            <div className="border-2 border-dashed border-[#e5e0d8] rounded-xl p-6 text-center cursor-pointer hover:border-[#1a1a1a] transition-colors">
              <input
                type="file"
                accept=".pdf,.txt,.md"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText />
                  <div className="text-sm text-[#444]">{file.name}</div>
                  <div className="text-xs text-[#777]">{formatSize(file.size)}</div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#666]">
                  <Upload size={28} />
                  <span>點擊選擇 PDF / TXT / MD</span>
                  <span className="text-xs text-[#999]">內容將本地向量化後儲存</span>
                </div>
              )}
            </div>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[#666] mb-1">標題（可空，預設檔名）</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0"
                placeholder="如：部落文化研究"
              />
            </div>
            <div>
              <label className="block text-sm text-[#666] mb-1">語言</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0"
              >
                <option value="zh-TW">繁中</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#666] mb-1">社群/族群 (可選)</label>
              <input
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0"
                placeholder="如：排灣族 / Māori / Inuktitut"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] text-white py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            {uploading ? "上傳中..." : "上傳並索引"}
          </button>

          {uploadMessage && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {uploadMessage}
            </div>
          )}
        </form>

        {/* Query */}
        <div className="bg-white rounded-2xl border border-[#e5e0d8] p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#1a1a1a]">
            <Search size={20} />
            <h2 className="font-semibold text-lg">提問</h2>
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            className="w-full px-3 py-3 rounded-lg border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0"
            placeholder="想問什麼？例如：請摘要第三章的重點，或請比較兩個文件的論述。"
          />
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#666]">Top K</span>
              <input
                type="number"
                min={1}
                max={10}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-lg border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#666]">Persona</span>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#e5e0d8] focus:border-[#1a1a1a] focus:ring-0"
              >
                <option value="elder">長者</option>
                <option value="guide">導覽員</option>
                <option value="scholar">研究者</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#666]">
              <span className="font-medium text-[#1a1a1a]">限定文件：</span>
              <span>{selectedDocIds.size ? `${selectedDocIds.size} 份` : "全部"}</span>
            </div>
          </div>
          <button
            onClick={handleQuery}
            disabled={querying || !question.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] text-white py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-60"
          >
            {querying ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            {querying ? "查詢中..." : "向資料室提問"}
          </button>

          {answer && (
            <div className="bg-[#f7f4ed] border border-[#e5e0d8] rounded-xl p-4 space-y-3">
              <div className="text-sm text-[#666]">回答</div>
              <div className="whitespace-pre-wrap leading-relaxed text-[#1a1a1a]">{answer}</div>
              {snippets.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-[#666]">引用片段</div>
                  <div className="grid gap-2">
                    {snippets.map((s, idx) => (
                      <div key={`${s.document_id}-${idx}`} className="bg-white border border-[#e5e0d8] rounded-lg p-3">
                        <div className="text-xs text-[#999] mb-1">
                          {s.title || "未命名"} · 相似度 {s.score.toFixed(3)}
                        </div>
                        <div className="text-sm text-[#1a1a1a] line-clamp-3">{s.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Document list */}
      <div className="bg-white rounded-2xl border border-[#e5e0d8] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#1a1a1a]">
            <FileText size={20} />
            <h2 className="font-semibold text-lg">已上傳文件</h2>
          </div>
          <div className="text-sm text-[#666]">點擊選取文件以限定查詢</div>
        </div>

        {loadingDocs ? (
          <div className="flex items-center gap-2 text-[#666]">
            <Loader2 className="animate-spin" size={18} />
            載入中...
          </div>
        ) : formattedDocs.length === 0 ? (
          <div className="text-[#666]">尚未上傳文件，先上傳一份 PDF/TXT/MD 吧！</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {formattedDocs.map((doc) => {
              const checked = selectedDocIds.has(doc.id);
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => toggleSelection(doc.id)}
                  className={`text-left border rounded-xl p-4 transition-all ${
                    checked ? "border-[#1a1a1a] bg-[#f7f4ed]" : "border-[#e5e0d8] bg-white hover:border-[#1a1a1a]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-[#1a1a1a] line-clamp-1">{doc.title}</div>
                    <input type="checkbox" readOnly checked={checked} className="h-4 w-4 accent-black" />
                  </div>
                  <div className="text-sm text-[#666] line-clamp-1">{doc.filename}</div>
                  <div className="text-xs text-[#999] mt-1">
                    {doc.language || "未知"} · {doc.content_type.toUpperCase()} · {doc.page_count ? `${doc.page_count} 頁 · ` : ""}
                    {formatSize(doc.size_bytes)}
                  </div>
                  <div className="text-xs text-[#999]">chunks: {doc.chunk_count} · {doc.uploadedLabel}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
