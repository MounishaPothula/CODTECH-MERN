import { create } from 'zustand';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

const fetchWeatherData = async (city) => {
  try {
    // Handle coordinates format (lat,lon)
    let url;
    if (city.includes(',')) {
      const [lat, lon] = city.split(',');
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    } else {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`;
    }

    // Get current weather
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.cod !== 200) {
      throw new Error(data.message);
    }

    // Get 5-day forecast using the coordinates from the first API call
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${API_KEY}`
    );
    const forecastData = await forecastResponse.json();

    return {
      city: data.name,
      temp: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      pressure: data.main.pressure,
      visibility: data.visibility / 1000, // Convert to km
      forecast: forecastData.list.slice(0, 8).map(item => ({
        time: item.dt,
        temp: item.main.temp,
        description: item.weather[0].description,
        icon: item.weather[0].icon
      }))
    };
  } catch (error) {
    throw new Error(`Failed to fetch weather data: ${error.message}`);
  }
};

const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error('Unable to retrieve your location'));
        }
      );
    }
  });
};

export const useWeatherStore = create((set, get) => ({
  cities: [],
  loading: false,
  error: null,
  darkMode: localStorage.getItem('darkMode') === 'true',
  selectedCity: null,
  userLocation: localStorage.getItem('userLocation'),
  locationSetupComplete: !!localStorage.getItem('userLocation'),
  units: {
    temperature: localStorage.getItem('temperatureUnit') || 'celsius',
    speed: localStorage.getItem('speedUnit') || 'kmh',
  },

  initializeUserLocation: async () => {
    const userLocation = localStorage.getItem('userLocation');
    if (userLocation) {
      set({ loading: true });
      try {
        const weatherData = await fetchWeatherData(userLocation);
        set({
          cities: [weatherData],
          loading: false,
          error: null
        });
      } catch (error) {
        set({ 
          error: error.message,
          loading: false
        });
      }
    }
  },

  setUserLocation: (location) => {
    set({ 
      userLocation: location,
      locationSetupComplete: true
    });
  },

  fetchCity: async (cityName) => {
    set({ loading: true, error: null });
    try {
      const weatherData = await fetchWeatherData(cityName);
      set(state => ({
        cities: [
          ...state.cities.filter(c => c.city.toLowerCase() !== weatherData.city.toLowerCase()),
          weatherData
        ],
        loading: false,
        error: null
      }));
    } catch (error) {
      set({ 
        error: error.message, 
        loading: false 
      });
    }
  },

  setSelectedCity: (cityName) =>
    set(state => ({
      selectedCity: state.selectedCity === cityName ? null : cityName
    })),

  removeCity: (cityName) =>
    set(state => ({
      cities: state.cities.filter(c => c.city !== cityName),
      selectedCity: state.selectedCity === cityName ? null : state.selectedCity
    })),

  toggleDarkMode: () =>
    set(state => {
      const newDarkMode = !state.darkMode;
      localStorage.setItem('darkMode', newDarkMode);
      return { darkMode: newDarkMode };
    }),

  toggleTemperatureUnit: () =>
    set(state => {
      const newUnit = state.units.temperature === 'celsius' ? 'fahrenheit' : 'celsius';
      localStorage.setItem('temperatureUnit', newUnit);
      return {
        units: {
          ...state.units,
          temperature: newUnit
        }
      };
    }),

  toggleSpeedUnit: () =>
    set(state => {
      const newUnit = state.units.speed === 'kmh' ? 'mph' : 'kmh';
      localStorage.setItem('speedUnit', newUnit);
      return {
        units: {
          ...state.units,
          speed: newUnit
        }
      };
    })
}));