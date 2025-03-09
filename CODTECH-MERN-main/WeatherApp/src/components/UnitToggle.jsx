import React from 'react';
import { useWeatherStore } from '../store/weatherStore';
import { cn } from '../utils/utils';

export default function UnitToggle() {
  const { units, toggleTemperatureUnit, toggleSpeedUnit, darkMode } = useWeatherStore();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleTemperatureUnit}
        className={cn(
          "px-3 py-1.5 rounded-lg font-medium text-sm transition-colors",
          darkMode 
            ? "bg-gray-800 text-gray-200 hover:bg-gray-700" 
            : "bg-white text-gray-800 hover:bg-gray-100"
        )}
        aria-label="Toggle temperature unit"
      >
        {units.temperature === 'celsius' ? '°C' : '°F'}
      </button>
      <button
        onClick={toggleSpeedUnit}
        className={cn(
          "px-3 py-1.5 rounded-lg font-medium text-sm transition-colors",
          darkMode 
            ? "bg-gray-800 text-gray-200 hover:bg-gray-700" 
            : "bg-white text-gray-800 hover:bg-gray-100"
        )}
        aria-label="Toggle wind speed unit"
      >
        {units.speed === 'kmh' ? 'km/h' : 'mph'}
      </button>
    </div>
  );
} 