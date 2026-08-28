import { Card, CardContent } from '@/components/ui/card';
import { overviewMock } from './mock-data';

export function TodaySummary() {
  return (
    <section aria-labelledby='today-summary-title'>
      <h2 id='today-summary-title' className='mb-3 text-sm font-semibold'>
        Resumen de hoy
      </h2>
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {overviewMock.summary.map((item) => (
          <Card key={item.label} size='sm'>
            <CardContent className='flex items-end justify-between gap-3'>
              <div>
                <p className='text-muted-foreground text-xs'>{item.label}</p>
                <p className='mt-1 text-2xl font-semibold tabular-nums'>{item.value}</p>
              </div>
              <p className='text-muted-foreground max-w-24 text-right text-xs'>{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
