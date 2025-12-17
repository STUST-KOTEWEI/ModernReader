"use client";

import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce'; // Assuming a debounce hook exists

type Book = {
  id: string;
  title: string;
  authors: string[];
};

interface BookSearchInputProps {
  onSelectBook: (book: Book) => void;
  placeholder: string;
}

function BookSearchInput({ onSelectBook, placeholder }: BookSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const fetchBooks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/catalog/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setIsDropdownOpen(true);
        }
      } catch (error) {
        console.error('Failed to fetch books:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [debouncedQuery]);

  const handleSelect = (book: Book) => {
    setQuery(book.title);
    onSelectBook(book);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm">
        <Search className="h-5 w-5 text-gray-400 mx-3" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && results.length > 0 && setIsDropdownOpen(true)}
          onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)} // Delay to allow click
          placeholder={placeholder}
          className="w-full p-3 bg-transparent focus:outline-none"
        />
        {isLoading && <Loader2 className="h-5 w-5 text-gray-400 animate-spin mr-3" />}
      </div>
      {isDropdownOpen && results.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {results.map((book) => (
            <li
              key={book.id}
              onMouseDown={() => handleSelect(book)}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
            >
              <p className="font-semibold">{book.title}</p>
              <p className="text-sm text-gray-500">{book.authors.join(', ')}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BookSearchInput;
