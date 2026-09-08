import { queryOptions } from '@tanstack/react-query';

import { getCurrentWeather } from './service';
import type { WeatherLocation } from './types';

export const weatherKeys = {
  all: ['weather'] as const,
  current: (location: WeatherLocation) =>
    [...weatherKeys.all, 'current', location.latitude, location.longitude] as const
};

export const currentWeatherQueryOptions = (location: WeatherLocation) =>
  queryOptions({
    queryKey: weatherKeys.current(location),
    queryFn: () => getCurrentWeather(location),
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    retry: 1
  });
