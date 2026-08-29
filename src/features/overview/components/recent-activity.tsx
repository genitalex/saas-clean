import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { overviewMock } from './mock-data';

export function RecentActivity() {
  return (
    <Card className='h-full transition-shadow hover:shadow-sm'>
      <CardHeader className='border-b'>
        <CardTitle className='text-base'>Actividad reciente</CardTitle>
      </CardHeader>
      <CardContent className='pt-4'>
        <div className='flex flex-col'>
          {overviewMock.activity.map((item, index) => (
            <div key={`${item.person}-${item.time}`} className='relative flex gap-3 pb-5 last:pb-0'>
              {index < overviewMock.activity.length - 1 && (
                <span className='bg-border absolute top-6 left-2.5 h-full w-px' />
              )}
              <span className='bg-primary/10 text-primary relative flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold'>
                {item.person[0]}
              </span>
              <div className='min-w-0 text-sm'>
                <p>
                  <span className='font-medium'>{item.person}</span> {item.action}{' '}
                  <span className='font-medium'>{item.subject}</span>
                </p>
                <p className='text-muted-foreground mt-0.5 text-xs'>{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
