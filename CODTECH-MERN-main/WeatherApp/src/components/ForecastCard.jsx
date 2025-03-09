import React from 'react';
import { Line } from 'react-chartjs-2';
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
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Cloud,
  Sunrise,
  Sunset,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { useWeatherStore } from '../store/weatherStore';
import { kelvinToCelsius, celsiusToFahrenheit, mpsToKmh, mpsToMph, cn } from '../utils/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ForecastCard({ weather, onRefresh, isRefreshing }) {
  const { units, darkMode } = useWeatherStore();

  const getTemperature = (temp) => {
    const celsiusTemp = kelvinToCelsius(temp);
    return units.temperature === 'celsius'
      ? celsiusTemp
      : celsiusToFahrenheit(celsiusTemp);
  };

  const getWindSpeed = (speed) => {
    return units.speed === 'kmh'
      ? mpsToKmh(speed)
      : mpsToMph(speed);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const chartData = {
    labels: weather.forecast?.map(f => new Date(f.dt * 1000).toLocaleTimeString([], { hour: '2-digit' })) || [],
    datasets: [
      {
        label: 'Temperature',
        data: weather.forecast?.map(f => getTemperature(f.temp)) || [],
        borderColor: '#3b82f6',
        tension: 0.4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#fff' : '#000'
        }
      }
    },
    scales: {
      y: {
        ticks: {
          color: darkMode ? '#fff' : '#000'
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        ticks: {
          color: darkMode ? '#fff' : '#000'
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  const getWeatherAdvice = () => {
    const temp = getTemperature(weather.temp);
    const isRaining = weather.description.includes('rain');
    const isWindy = getWindSpeed(weather.windSpeed) > 20;

    const advices = [];
    if (isRaining) advices.push("Don't forget your umbrella!");
    if (temp < 10) advices.push("It's cold - bundle up!");
    if (temp > 30) advices.push("Stay hydrated and avoid direct sun exposure");
    if (isWindy) advices.push("Watch out for strong winds");
    
    return advices.length > 0 ? advices.join(' ') : "Great weather for outdoor activities!";
  };

  const lastUpdated = new Date(weather.lastUpdated).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg col-span-full",
      "transform transition-all"
    )}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {weather.city}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {weather.country}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <MapPin size={14} />
            <span>{weather.coord.lat.toFixed(2)}°N, {weather.coord.lon.toFixed(2)}°E</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Updated: {lastUpdated}
          </span>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "p-2 rounded-full transition-all",
              darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Thermometer size={24} />
            <span className="text-lg font-semibold">Temperature</span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold">
              {getTemperature(weather.temp)}°
              {units.temperature === 'celsius' ? 'C' : 'F'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Feels like: {getTemperature(weather.feelsLike)}°
              {units.temperature === 'celsius' ? 'C' : 'F'}
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Sun size={24} />
            <span className="text-lg font-semibold">Sun Schedule</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <Sunrise size={16} className="text-yellow-500" />
              <span>{formatTime(weather.sunrise)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sunset size={16} className="text-orange-500" />
              <span>{formatTime(weather.sunset)}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Cloud size={24} />
            <span className="text-lg font-semibold">Conditions</span>
          </div>
          <div className="mt-2 flex items-center gap-4">
            <img
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt={weather.description}
              className="w-12 h-12"
            />
            <p className="text-xl font-bold capitalize">{weather.description}</p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Droplets size={24} />
            <span className="text-lg font-semibold">Humidity</span>
          </div>
          <p className="text-2xl font-bold mt-2">{weather.humidity}%</p>
        </div>

        <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Wind size={24} />
            <span className="text-lg font-semibold">Wind Speed</span>
          </div>
          <p className="text-2xl font-bold mt-2">
            {getWindSpeed(weather.windSpeed)} {units.speed}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg mb-8">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">24-Hour Forecast</h3>
        <div className="h-[300px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Sun size={24} />
          <span className="text-lg font-semibold">Weather Advice</span>
        </div>
        <p className="text-lg mt-2 text-gray-700 dark:text-gray-200">
          {getWeatherAdvice()}
        </p>
      </div>
    </div>
  );
} 