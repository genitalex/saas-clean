import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { overviewMock } from './mock-data';

export function UpcomingPanel() {
  return (
    <Card className='h-full'>
      <CardHeader className='flex-row items-center justify-between border-b'>
        <CardTitle className='text-base'>Próximamente</CardTitle>
        <Button variant='ghost' size='sm' type='button' disabled>
          Ver calendario <Icons.chevronRight data-icon='inline-end' />
        </Button>
      </CardHeader>
      <CardContent className='pt-3'>
        <div className='flex flex-col gap-1'>
          {overviewMock.upcoming.map((item) => (
            <div
              key={item.time}
              className='flex items-center gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60'
            >
              <span className='text-muted-foreground w-12 text-sm tabular-nums'>{item.time}</span>
              <span className='bg-primary size-1.5 rounded-full' />
              <span className='text-sm'>{item.title}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
