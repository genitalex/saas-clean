import type {
  GeocodingResponse,
  GeocodingResult,
  ReverseGeocodingResponse,
  WeatherData,
  WeatherLocation,
  WeatherResponse
} from './types';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_GEOCODING_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('No se pudo consultar Open-Meteo');
  return response.json() as Promise<T>;
}

export async function geocodeCity(query: string): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    name: query.trim(),
    count: '5',
    language: 'es',
    format: 'json'
  });
  const data = await fetchJson<GeocodingResponse>(`${GEOCODING_URL}?${params}`);
  return (data.results ?? []).map((result) => ({
    id: result.id,
    city: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone
  }));
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: 'es'
  });
  const data = await fetchJson<ReverseGeocodingResponse>(`${REVERSE_GEOCODING_URL}?${params}`);
  return (
    [
      data.city,
      data.town,
      data.village,
      data.municipality,
      data.locality,
      data.county,
      data.principalSubdivision,
      data.countryName
    ].find((value) => value?.trim()) ?? null
  );
}

export async function getCurrentWeather(location: WeatherLocation): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,weather_code,is_day',
    temperature_unit: 'celsius',
    timezone: 'auto'
  });
  const data = await fetchJson<WeatherResponse>(`${WEATHER_URL}?${params}`);
  const current = data.current;
  if (
    current?.temperature_2m === undefined ||
    current.weather_code === undefined ||
    current.is_day === undefined
  ) {
    throw new Error('La respuesta meteorológica está incompleta');
  }

  return {
    temperature: Math.round(current.temperature_2m),
    weatherCode: current.weather_code,
    isDay: current.is_day === 1,
    city: location.city
  };
}
