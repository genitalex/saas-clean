export function deserializeDate(value: string | Date, fieldName: string): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${fieldName}`);
  return date;
}

export function deserializeNullableDate(
  value: string | Date | null | undefined,
  fieldName: string
): Date | null | undefined {
  return value == null ? value : deserializeDate(value, fieldName);
}
