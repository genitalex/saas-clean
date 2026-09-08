export interface WeatherLocation {
  city: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface WeatherPreference {
  location: WeatherLocation;
  source: 'geolocation' | 'manual';
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  city: string;
}

export interface GeocodingResult extends WeatherLocation {
  id: number;
}

export interface GeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    timezone?: string;
    country?: string;
    country_code?: string;
  }>;
}

export interface WeatherResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    is_day?: number;
  };
}
