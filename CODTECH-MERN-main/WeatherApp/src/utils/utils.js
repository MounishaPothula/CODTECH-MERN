import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function kelvinToCelsius(kelvin) {
  return Math.round(kelvin - 273.15);
}

export function celsiusToFahrenheit(celsius) {
  return Math.round((celsius * 9/5) + 32);
}

export function mpsToKmh(mps) {
  return Math.round(mps * 3.6);
}

export function mpsToMph(mps) {
  return Math.round(mps * 2.237);
}