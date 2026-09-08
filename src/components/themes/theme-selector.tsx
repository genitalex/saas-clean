'use client';

import { useThemeConfig } from '@/components/themes/active-theme';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { Icons } from '../icons';
import { Kbd } from '@/components/ui/kbd';
import { THEMES } from './theme.config';

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig();

  return (
    <div className='flex items-center gap-2'>
      <Label htmlFor='theme-selector' className='sr-only'>
        Theme
      </Label>
      <Select
        items={THEMES.map((theme) => ({ value: theme.value, label: theme.name }))}
        value={activeTheme}
        onValueChange={(value) => {
          if (value !== null) setActiveTheme(value);
        }}
      >
        <SelectTrigger
          id='theme-selector'
          className='h-9 w-9 justify-center px-0 sm:w-auto sm:justify-start sm:px-3 *:data-[slot=select-value]:hidden sm:*:data-[slot=select-value]:block sm:*:data-[slot=select-value]:w-24'
        >
          <span className='text-muted-foreground'>
            <Icons.palette />
          </span>
          <SelectValue placeholder='Select a theme' />
          <Kbd className='hidden sm:inline-flex'>T T</Kbd>
        </SelectTrigger>
        <SelectContent align='end'>
          {THEMES.length > 0 && (
            <>
              <SelectGroup>
                <SelectLabel>Experiencias</SelectLabel>
                {THEMES.map((theme) => (
                  <SelectItem key={theme.name} value={theme.value}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
