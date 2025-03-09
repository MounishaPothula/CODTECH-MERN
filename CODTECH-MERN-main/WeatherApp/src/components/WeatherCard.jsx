import React from 'react';
import { Trash2, Droplets, Wind, Cloud } from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import { kelvinToCelsius, celsiusToFahrenheit, mpsToKmh, mpsToMph, cn } from '../utils/utils';

export default function WeatherCard({ weather }) {
  const { units, removeCity, setSelectedCity } = useWeatherStore();

  const temperature = units.temperature === 'celsius'
    ? `${kelvinToCelsius(weather.temp)}°C`
    : `${celsiusToFahrenheit(kelvinToCelsius(weather.temp))}°F`;

  const windSpeed = units.speed === 'kmh'
    ? `${mpsToKmh(weather.windSpeed)} km/h`
    : `${mpsToMph(weather.windSpeed)} mph`;

  const getWeatherColor = (temp) => {
    const celsius = kelvinToCelsius(temp);
    if (celsius <= 0) return 'text-blue-500';
    if (celsius <= 15) return 'text-cyan-500';
    if (celsius <= 25) return 'text-green-500';
    if (celsius <= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg cursor-pointer hover:scale-105 transform transition-all duration-200"
      onClick={() => setSelectedCity(weather.city)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {weather.city}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Cloud size={16} className="text-gray-500 dark:text-gray-400" />
            <p className="text-gray-600 dark:text-gray-300 capitalize">
              {weather.description}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeCity(weather.city);
          }}
          className="text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Remove city"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Main temperature display */}
      <div className="flex items-center gap-4 mb-4">
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.description}
          className="w-20 h-20"
        />
        <p className={cn(
          "text-5xl font-bold",
          getWeatherColor(weather.temp)
        )}>
          {temperature}
        </p>
      </div>

      {/* Basic stats */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
            <Droplets size={20} className="text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Humidity</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {weather.humidity}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
            <Wind size={20} className="text-green-500 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Wind Speed</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {windSpeed}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}