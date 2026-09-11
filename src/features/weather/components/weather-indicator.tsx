'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { currentWeatherQueryOptions } from '../api/queries';
import { geocodeCity, reverseGeocode } from '../api/service';
import type {
  GeocodingResult,
  WeatherData,
  WeatherLocation,
  WeatherPreference
} from '../api/types';

const weatherStorageKey = (userId: string) => `weather-preference:${userId}`;

function getWeatherIcon(weatherCode: number, isDay: boolean) {
  if (weatherCode === 0 || weatherCode === 1) return isDay ? Icons.sun : Icons.moon;
  if (weatherCode === 2) return Icons.cloudSun;
  if ([3, 45, 48].includes(weatherCode)) return Icons.cloud;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return Icons.cloudRain;
  }
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return Icons.cloudSnow;
  if ([95, 96, 99].includes(weatherCode)) return Icons.cloudStorm;
  return Icons.sun;
}

function readPreference(userId: string): WeatherPreference | null {
  try {
    const raw = window.localStorage.getItem(weatherStorageKey(userId));
    return raw ? (JSON.parse(raw) as WeatherPreference) : null;
  } catch {
    return null;
  }
}

function savePreference(userId: string, preference: WeatherPreference) {
  window.localStorage.setItem(weatherStorageKey(userId), JSON.stringify(preference));
}

export function WeatherIndicator({ userId }: { userId: string }) {
  const [preference, setPreference] = useState<WeatherPreference | null>(() =>
    readPreference(userId)
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [locationState, setLocationState] = useState<'idle' | 'requesting' | 'denied'>('idle');
  const [cityQuery, setCityQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [results, setResults] = useState<GeocodingResult[]>([]);

  const weatherQuery = useQuery({
    ...currentWeatherQueryOptions(preference?.location ?? { city: '', latitude: 0, longitude: 0 }),
    enabled: Boolean(preference)
  });

  function handleLocation() {
    if (!navigator.geolocation) {
      setLocationState('denied');
      return;
    }
    setLocationState('requesting');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location: WeatherLocation = {
          city: 'Tu ubicación',
          latitude: coords.latitude,
          longitude: coords.longitude
        };
        const nextPreference = { location, source: 'geolocation' as const };
        savePreference(userId, nextPreference);
        setPreference(nextPreference);
        setLocationState('idle');
        setDialogOpen(false);

        void reverseGeocode(coords.latitude, coords.longitude)
          .then((city) => {
            if (!city) return;
            const resolvedPreference: WeatherPreference = {
              ...nextPreference,
              location: { ...location, city }
            };
            savePreference(userId, resolvedPreference);
            setPreference(resolvedPreference);
          })
          .catch(() => undefined);
      },
      () => setLocationState('denied'),
      { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 10_000 }
    );
  }

  async function handleCitySearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cityQuery.trim().length < 2) return;
    setSearching(true);
    setSearchError(false);
    try {
      setResults(await geocodeCity(cityQuery));
    } catch {
      setSearchError(true);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function selectCity(result: GeocodingResult) {
    const nextPreference = { location: result, source: 'manual' as const };
    savePreference(userId, nextPreference);
    setPreference(nextPreference);
    setResults([]);
    setCityQuery('');
    setDialogOpen(false);
  }

  const weather = weatherQuery.data;

  return (
    <>
      <div className='min-h-7 text-base text-white/90'>
        {weather ? (
          <button
            type='button'
            className='text-left transition-colors hover:text-white'
            onClick={() => setDialogOpen(true)}
            aria-label='Configurar tiempo'
          >
            <WeatherValue weather={weather} city={preference?.location.city ?? weather.city} />
          </button>
        ) : preference && weatherQuery.isPending ? (
          <span className='text-white/70'>Cargando tiempo…</span>
        ) : preference && weatherQuery.isError ? (
          <button
            type='button'
            className='text-white/75 transition-colors hover:text-white'
            onClick={() => weatherQuery.refetch()}
          >
            No se pudo cargar el tiempo
          </button>
        ) : (
          <button
            type='button'
            className='inline-flex items-center gap-2 text-white/80 transition-colors hover:text-white'
            onClick={() => setDialogOpen(true)}
          >
            <Icons.settings className='size-3.5' /> Configurar tiempo
          </button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Configurar tiempo</DialogTitle>
            <DialogDescription>
              Elige una opción. No guardamos tu ubicación ni la seguimos en segundo plano.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <Button
              className='w-full'
              onClick={handleLocation}
              disabled={locationState === 'requesting'}
            >
              <Icons.pin data-icon='inline-start' />
              {locationState === 'requesting' ? 'Solicitando ubicación…' : 'Usar mi ubicación'}
            </Button>
            {locationState === 'denied' && (
              <p className='text-destructive text-sm'>
                No se pudo usar la ubicación. Puedes elegir una ciudad.
              </p>
            )}
            <div className='relative flex items-center gap-3 text-xs text-muted-foreground'>
              <span className='h-px flex-1 bg-border' /> o{' '}
              <span className='h-px flex-1 bg-border' />
            </div>
            <form className='flex gap-2' onSubmit={handleCitySearch}>
              <Input
                value={cityQuery}
                onChange={(event) => setCityQuery(event.target.value)}
                placeholder='Palma de Mallorca, España'
                aria-label='Ciudad'
              />
              <Button type='submit' variant='outline' disabled={searching}>
                {searching ? 'Buscando…' : 'Buscar'}
              </Button>
            </form>
            {searchError && (
              <p className='text-destructive text-sm'>No se pudo buscar la ciudad.</p>
            )}
            {results.length > 0 && (
              <div className='grid gap-1' aria-label='Resultados de ciudad'>
                {results.map((result) => (
                  <button
                    key={result.id}
                    type='button'
                    className='flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted'
                    onClick={() => selectCity(result)}
                  >
                    <span>{result.city}</span>
                    <span className='text-muted-foreground text-xs'>{result.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant='ghost' onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function WeatherValue({ weather, city }: { weather: WeatherData; city?: string }) {
  const WeatherIcon = getWeatherIcon(weather.weatherCode, weather.isDay);
  return (
    <span className={cn('inline-flex items-center gap-2')}>
      <WeatherIcon className='size-8 stroke-[1.7] drop-shadow-sm' aria-hidden='true' />
      <span className='font-semibold'>{weather.temperature} °C</span>
      {city && (
        <>
          <span className='text-white/50'>·</span>
          <span className='text-white/90'>{city}</span>
        </>
      )}
    </span>
  );
}
