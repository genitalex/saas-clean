import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './select';
import { cn } from '@/lib/utils';

type NativeSelectProps = Omit<React.ComponentProps<'select'>, 'size'> & {
  size?: 'sm' | 'default';
};

function NativeSelect({ className, size = 'default', ...props }: NativeSelectProps) {
  const options = React.Children.toArray(props.children).filter(
    (child): child is React.ReactElement<React.ComponentProps<'option'>> =>
      React.isValidElement(child) && child.type === NativeSelectOption
  );
  const value = props.value == null ? '' : String(props.value);

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        props.onChange?.({
          target: { value: nextValue ?? '' }
        } as React.ChangeEvent<HTMLSelectElement>);
      }}
      disabled={props.disabled}
    >
      <SelectTrigger
        id={props.id}
        name={props.name}
        aria-label={props['aria-label']}
        aria-invalid={props['aria-invalid']}
        disabled={props.disabled}
        size={size}
        className={cn('w-full', className)}
      >
        <SelectValue placeholder={options[0]?.props.children} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={String(option.props.value)} value={String(option.props.value)}>
              {option.props.children}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<'option'>) {
  return (
    <option
      data-slot='native-select-option'
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      {...props}
    />
  );
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<'optgroup'>) {
  return (
    <optgroup
      data-slot='native-select-optgroup'
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
