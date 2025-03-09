import React from 'react';
import { ArrowLeft, Droplets, Wind, Thermometer, Cloud, Sunrise, Sunset, Eye, Gauge } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useWeatherStore } from '../store/weatherStore';
import { kelvinToCelsius, celsiusToFahrenheit, mpsToKmh, mpsToMph, cn } from '../utils/utils';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function WeatherDetail({ onClose }) {
  const { selectedCity, cities, units, darkMode } = useWeatherStore();
  const weather = cities.find(c => c.city === selectedCity);

  if (!weather) return null;

  const temperature = units.temperature === 'celsius'
    ? `${kelvinToCelsius(weather.temp)}°C`
    : `${celsiusToFahrenheit(kelvinToCelsius(weather.temp))}°F`;

  const feelsLike = units.temperature === 'celsius'
    ? `${kelvinToCelsius(weather.feelsLike)}°C`
    : `${celsiusToFahrenheit(kelvinToCelsius(weather.feelsLike))}°F`;

  const windSpeed = units.speed === 'kmh'
    ? `${mpsToKmh(weather.windSpeed)} km/h`
    : `${mpsToMph(weather.windSpeed)} mph`;

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const chartData = {
    labels: weather.forecast?.map(f => formatTime(f.time)) || [],
    datasets: [
      {
        label: 'Temperature',
        data: weather.forecast?.map(f => 
          units.temperature === 'celsius' 
            ? kelvinToCelsius(f.temp)
            : celsiusToFahrenheit(kelvinToCelsius(f.temp))
        ) || [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.parsed.y}°${units.temperature === 'celsius' ? 'C' : 'F'}`;
          }
        }
      }
    },
    scales: {
      y: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#4b5563'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#4b5563'
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto animate-in fade-in duration-300">
      <div className="container mx-auto px-4 py-8 animate-in slide-in-from-bottom duration-500">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full mr-4"
          >
            <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            {weather.city}
          </h1>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Current weather */}
          <div className="space-y-6">
            {/* Current weather card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-6">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`}
                  alt={weather.description}
                  className="w-32 h-32"
                />
                <div>
                  <h2 className="text-6xl font-bold text-gray-800 dark:text-white">
                    {temperature}
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 capitalize mt-2">
                    {weather.description}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Feels like {feelsLike}
                  </p>
                </div>
              </div>
            </div>

            {/* Weather stats grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                    <Droplets size={24} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Humidity</p>
                    <p className="text-xl font-semibold text-gray-800 dark:text-white">
                      {weather.humidity}%
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-lg">
                    <Wind size={24} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Wind Speed</p>
                    <p className="text-xl font-semibold text-gray-800 dark:text-white">
                      {windSpeed}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                    <Sunrise size={24} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Sunrise</p>
                    <p className="text-xl font-semibold text-gray-800 dark:text-white">
                      {formatTime(weather.sunrise)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                    <Sunset size={24} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Sunset</p>
                    <p className="text-xl font-semibold text-gray-800 dark:text-white">
                      {formatTime(weather.sunset)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-100 dark:bg-cyan-500/20 rounded-lg">
                    <Gauge size={24} className="text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Pressure</p>
                    <p className="text-xl font-semibold text-gray-800 dark:text-white">
                      {weather.pressure} hPa
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                    <Eye size={24} className="text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Visibility</p>
                    <p className="text-xl font-semibold text-gray-800 dark:text-white">
                      {weather.visibility} km
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Forecast */}
          <div className="space-y-6">
            {/* Temperature chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                24-Hour Temperature Forecast
              </h3>
              <div className="h-[300px] w-full">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Hourly forecast */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Hourly Forecast
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {weather.forecast?.map((f, index) => (
                  <div key={index} className="text-center p-3">
                    <p className="text-gray-500 dark:text-gray-400">
                      {formatTime(f.time)}
                    </p>
                    <img
                      src={`https://openweathermap.org/img/wn/${f.icon}.png`}
                      alt={f.description}
                      className="w-12 h-12 mx-auto"
                    />
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {units.temperature === 'celsius'
                        ? `${kelvinToCelsius(f.temp)}°C`
                        : `${celsiusToFahrenheit(kelvinToCelsius(f.temp))}°F`
                      }
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {f.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 