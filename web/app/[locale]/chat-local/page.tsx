"use client";

import { useState, useRef, useCallback } from 'react';
import { UploadCloud, MessageSquare, FileText, Loader2, Search } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import { pipeline, cos_sim } from '@xenova/transformers';

// Path to worker script
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type DocumentChunk = {
  text: string;
  embedding: number[];
};

function LocalChatPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentChunks, setDocumentChunks] = useState<DocumentChunk[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DocumentChunk[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setDocumentChunks([]);
      setResults([]);
    } else {
      alert('Please select a PDF file.');
    }
  };

  const handleProcessDocument = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      // 1. Extract text from PDF
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async (e) => {
        if (!e.target?.result) return;
        const pdf = await pdfjs.getDocument(e.target.result as ArrayBuffer).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map(s => (s as any).str).join(' ');
        }

        // 2. Chunk the text
        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 512, chunkOverlap: 50 });
        const chunks = await textSplitter.splitText(textContent);

        // 3. Vectorize the chunks
        const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        const processedChunks: DocumentChunk[] = [];
        for (const chunk of chunks) {
          const output = await extractor(chunk, { pooling: 'mean', normalize: true });
          processedChunks.push({ text: chunk, embedding: Array.from(output.data) });
        }
        setDocumentChunks(processedChunks);
        setIsProcessing(false);
      };
    } catch (error) {
      console.error("Failed to process document:", error);
      alert("There was an error processing the PDF.");
      setIsProcessing(false);
    }
  }, [file]);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || documentChunks.length === 0) return;

    setIsSearching(true);
    try {
      const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      const queryEmbedding = await extractor(query, { pooling: 'mean', normalize: true });

      const similarities = documentChunks.map(chunk => {
        const sim = cos_sim(Array.from(queryEmbedding.data), chunk.embedding);
        return { ...chunk, similarity: sim };
      });

      similarities.sort((a, b) => b.similarity - a.similarity);
      setResults(similarities.slice(0, 3)); // Show top 3 results

    } catch (error) {
      console.error("Search failed:", error);
      alert("There was an error performing the search.");
    } finally {
      setIsSearching(false);
    }
  }, [query, documentChunks]);

  return (
    <div className="p-8 lg:p-12 space-y-10">
      <header className="mb-6 lg:mb-4">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare size={32} className="text-purple-600" />
          <h1 className="font-serif font-bold text-4xl text-gray-900">Chat with your Document</h1>
        </div>
        <p className="text-gray-600 text-lg max-w-3xl">
          Upload a PDF and ask questions. All processing happens entirely in your browser for maximum privacy.
        </p>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select a PDF to get started</h3>
          <p className="mt-1 text-sm text-gray-500">All processing is done in your browser.</p>
          <div className="mt-6">
            <input
              type="file"
              id="file-upload"
              className="sr-only"
              accept=".pdf"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
            >
              <span>Upload a file</span>
            </label>
          </div>
        </div>

        {file && (
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-green-100 text-green-800 p-4 rounded-lg">
              <FileText className="h-5 w-5" />
              <span className="font-semibold">{file.name}</span>
            </div>
            <button
              onClick={handleProcessDocument}
              className="mt-4 bg-purple-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-purple-700 disabled:bg-gray-400"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Process Document'}
            </button>
          </div>
        )}

        {documentChunks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Ask a question about your document</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What is this document about?"
                className="flex-1 p-3 border border-gray-300 rounded-lg"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className="bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg disabled:bg-gray-400"
              >
                {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
              </button>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4 pt-6">
            <h3 className="text-xl font-bold">Relevant passages:</h3>
            <ul className="space-y-4">
              {results.map((chunk, index) => (
                <li key={index} className="p-4 bg-gray-100 rounded-lg border">
                  <p className="text-gray-700">{chunk.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Dummy TextSplitter to be replaced or implemented
class RecursiveCharacterTextSplitter {
  constructor(private options: { chunkSize: number, chunkOverlap: number }) { }
  async splitText(text: string): Promise<string[]> {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += this.options.chunkSize - this.options.chunkOverlap) {
      chunks.push(text.substring(i, i + this.options.chunkSize));
    }
    return chunks;
  }
}

export default LocalChatPage;