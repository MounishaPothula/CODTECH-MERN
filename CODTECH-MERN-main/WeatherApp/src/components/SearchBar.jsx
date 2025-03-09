import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import { cn } from '../utils/utils';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const { fetchCity, darkMode } = useWeatherStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (query.trim()) {
      await fetchCity(query.trim());
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter city name..."
          className={cn(
            "w-full px-4 py-2 pl-10 rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "transition-colors",
            darkMode
              ? "bg-gray-800 text-white placeholder-gray-400 border-gray-700"
              : "bg-white text-gray-900 placeholder-gray-500 border-gray-200"
          )}
        />
        <Search 
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
            darkMode ? "text-gray-400" : "text-gray-500"
          )} 
        />
      </div>
    </form>
  );
}