import React, { useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import { cn } from '../utils/utils';

export default function LocationSetup({ onClose }) {
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const { fetchCity, darkMode, setUserLocation } = useWeatherStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!city.trim()) {
      setError('Please enter your city name');
      return;
    }
    
    try {
      setError('');
      await fetchCity(city.trim());
      setUserLocation(city.trim());
      localStorage.setItem('userLocation', city.trim());
      onClose?.();
    } catch (err) {
      setError('Could not find this city. Please try again.');
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await fetchCity(`${latitude},${longitude}`);
          setUserLocation(`${latitude},${longitude}`);
          localStorage.setItem('userLocation', `${latitude},${longitude}`);
          onClose?.();
        } catch (err) {
          setError('Could not fetch weather for your location. Please enter your city manually.');
        }
      },
      () => {
        setError('Unable to get your location. Please enter your city manually.');
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={cn(
        "w-full max-w-md p-6 rounded-xl shadow-lg relative",
        darkMode ? "bg-gray-800" : "bg-white"
      )}>
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              "absolute right-4 top-4 p-2 rounded-full",
              "hover:bg-gray-100 dark:hover:bg-gray-700",
              "transition-colors"
            )}
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        )}

        <h2 className={cn(
          "text-2xl font-bold mb-4",
          darkMode ? "text-white" : "text-gray-900"
        )}>
          {onClose ? 'Change Location' : 'Welcome to Weather Dashboard'}
        </h2>
        <p className={cn(
          "mb-6",
          darkMode ? "text-gray-300" : "text-gray-600"
        )}>
          {onClose 
            ? 'Update your location to see weather information for a different area.'
            : 'To provide you with accurate weather information, please let us know your location.'
          }
        </p>

        <button
          onClick={handleGeolocation}
          className={cn(
            "w-full mb-4 p-3 rounded-lg flex items-center justify-center gap-2",
            "transition-colors",
            darkMode 
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          )}
        >
          <MapPin size={20} />
          Use My Current Location
        </button>

        <div className={cn(
          "relative my-6 text-center",
          darkMode ? "text-gray-400" : "text-gray-500"
        )}>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <span className="relative px-4 bg-white dark:bg-gray-800">OR</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter your city name..."
              className={cn(
                "w-full px-4 py-3 pl-10 rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                "transition-colors",
                darkMode
                  ? "bg-gray-700 text-white placeholder-gray-400 border-gray-600"
                  : "bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-200"
              )}
            />
            <Search 
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5",
                darkMode ? "text-gray-400" : "text-gray-500"
              )}
            />
          </div>
          {error && (
            <p className="mt-2 text-red-500 text-sm">
              {error}
            </p>
          )}
          <button
            type="submit"
            className={cn(
              "w-full mt-4 p-3 rounded-lg font-medium",
              "transition-colors",
              darkMode 
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            )}
          >
            {onClose ? 'Update Location' : 'Set Location'}
          </button>
        </form>
      </div>
    </div>
  );
} 