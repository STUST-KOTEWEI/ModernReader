"use client";

import { useState } from 'react';
import { Compass } from 'lucide-react';
import BookSearchInput from '@/components/learning/BookSearchInput';

type BookSearchResult = {
  id: string;
  title: string;
  authors: string[];
};

import { useGamification } from '@/hooks/useGamification';

function LearningPathPage() {
  const [startBook, setStartBook] = useState<BookSearchResult | null>(null);
  const [endBook, setEndBook] = useState<BookSearchResult | null>(null);
  const [path, setPath] = useState<BookSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { logActivity } = useGamification(); // Use the hook

  const handleFindPath = async () => {
    if (!startBook || !endBook) return;

    setIsLoading(true);
    setPath([]);
    try {
      const response = await fetch(`/api/v1/knowledge-graph/path/${startBook.id}/${endBook.id}`);
      if (!response.ok) {
        throw new Error('Failed to find learning path.');
      }
      const data = await response.json();
      setPath(data.path || []);
      if (data.path && data.path.length > 0) {
        logActivity('LEARNING_PATH_COMPLETED'); // Log activity
      }
    } catch (error) {
      console.error('Learning path API failed:', error);
      // You might want to set an error state here to show in the UI
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 lg:p-12 space-y-10 text-gray-800">
      <header className="mb-6 lg:mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Compass size={32} className="text-blue-600" />
          <h1 className="font-serif font-bold text-4xl text-gray-900">Learning Path Finder</h1>
        </div>
        <p className="text-gray-600 text-lg max-w-3xl">
          Discover the optimal path between two books using our Knowledge Graph.
        </p>
      </header>

      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Book Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-2">
            <label className="font-semibold text-lg">Start Book</label>
            <BookSearchInput
              placeholder="Search for the first book..."
              onSelectBook={setStartBook}
            />
          </div>
          <div className="space-y-2">
            <label className="font-semibold text-lg">End Book</label>
            <BookSearchInput
              placeholder="Search for the last book..."
              onSelectBook={setEndBook}
            />
          </div>
        </div>

        {/* Selected Books & Find Path Button */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div>
              <h3 className="font-bold text-gray-500">START</h3>
              {startBook ? (
                <div className="mt-2 p-3 bg-white rounded-lg border">
                  <p className="font-bold">{startBook.title}</p>
                  <p className="text-sm text-gray-600">{startBook.authors.join(', ')}</p>
                </div>
              ) : (
                <div className="mt-2 p-3 border-dashed border-2 rounded-lg text-gray-400">Select a start book</div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-500">END</h3>
              {endBook ? (
                <div className="mt-2 p-3 bg-white rounded-lg border">
                  <p className="font-bold">{endBook.title}</p>
                  <p className="text-sm text-gray-600">{endBook.authors.join(', ')}</p>
                </div>
              ) : (
                <div className="mt-2 p-3 border-dashed border-2 rounded-lg text-gray-400">Select an end book</div>
              )}
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={handleFindPath}
              disabled={!startBook || !endBook || isLoading}
              className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-transform duration-150 active:scale-95"
            >
              {isLoading ? 'Finding Path...' : 'Find Learning Path'}
            </button>
          </div>
        </div>

        {/* Path Visualization */}
        {path.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-6">Your Learning Path</h2>
            <div className="flex items-center justify-center overflow-x-auto py-4">
              <div className="flex items-center space-x-4">
                {path.map((book, index) => (
                  <div key={book.id} className="flex items-center">
                    <div className="w-48 text-center p-4 bg-white rounded-lg border shadow-sm">
                      <p className="font-bold text-base">{book.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{book.authors.join(', ')}</p>
                    </div>
                    {index < path.length - 1 && (
                      <div className="w-12 h-1 bg-blue-300 mx-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for no path found */}
        {!isLoading && path.length === 0 && startBook && endBook && (
          <div className="text-center text-gray-500 mt-8">
            <p>Could not find a learning path between these two books.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LearningPathPage;
