import React, { useEffect, useState } from 'react';
import { Sun, Moon, MapPin } from 'lucide-react';
import { useWeatherStore } from './store/weatherStore';
import SearchBar from './components/SearchBar';
import WeatherCard from './components/WeatherCard';
import WeatherDetail from './components/WeatherDetail';
import LocationSetup from './components/LocationSetup';
import UnitToggle from './components/UnitToggle';
import { cn } from './utils/utils';

export default function App() {
  const [showLocationSetup, setShowLocationSetup] = useState(false);
  const {
    cities,
    loading,
    error,
    darkMode,
    selectedCity,
    locationSetupComplete,
    userLocation,
    setSelectedCity,
    toggleDarkMode,
    initializeUserLocation
  } = useWeatherStore();

  useEffect(() => {
    initializeUserLocation();
  }, [initializeUserLocation]);

  const handleLocationClick = () => {
    setShowLocationSetup(true);
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors",
      darkMode ? "bg-gray-900" : "bg-gray-100"
    )}>
      {(!locationSetupComplete || showLocationSetup) && (
        <LocationSetup onClose={() => setShowLocationSetup(false)} />
      )}
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className={cn(
            "text-3xl font-bold",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            Weather Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLocationClick}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm",
                "transition-colors",
                darkMode 
                  ? "bg-gray-800 text-gray-200 hover:bg-gray-700" 
                  : "bg-white text-gray-800 hover:bg-gray-100"
              )}
            >
              <MapPin size={16} />
              {cities[0]?.city || "Set Location"}
            </button>
            <UnitToggle />
            <button
              onClick={toggleDarkMode}
              className={cn(
                "p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              )}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <SearchBar />
        </div>

        {error && (
          <div className={cn(
            "mb-8 p-4 rounded-lg text-center",
            darkMode 
              ? "bg-red-900/30 text-red-400" 
              : "bg-red-100 text-red-700"
          )}>
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {!loading && cities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city) => (
              <WeatherCard key={city.city} weather={city} />
            ))}
          </div>
        )}

        {!loading && !error && cities.length === 0 && (
          <div className={cn(
            "text-center p-8 rounded-lg",
            darkMode 
              ? "bg-gray-800 text-gray-300" 
              : "bg-white text-gray-600"
          )}>
            <p>No cities added yet. Use the search bar above to add a city.</p>
          </div>
        )}

        {selectedCity && (
          <WeatherDetail onClose={() => setSelectedCity(null)} />
        )}
      </div>
    </div>
  );
}