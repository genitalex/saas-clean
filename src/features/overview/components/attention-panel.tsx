import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { overviewMock } from './mock-data';

export function AttentionPanel() {
  return (
    <Card className='h-full'>
      <CardHeader className='border-b'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <span className='bg-amber-500/15 text-amber-700 dark:text-amber-400 flex size-7 items-center justify-center rounded-full'>
            <Icons.alertCircle />
          </span>
          Necesita atención
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-1 pt-2'>
        {overviewMock.attention.length > 0 ? (
          overviewMock.attention.map((item) => {
            const Icon = Icons[item.icon];
            return (
              <div
                key={item.title}
                className='flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-muted/60'
              >
                <Icon className='text-muted-foreground shrink-0' />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{item.title}</p>
                  <p className='text-muted-foreground truncate text-xs'>{item.subtitle}</p>
                </div>
                <Button variant='ghost' size='sm' type='button'>
                  Ver
                </Button>
              </div>
            );
          })
        ) : (
          <div className='text-muted-foreground px-2 py-6 text-sm'>
            <p className='font-medium text-foreground'>✓ Todo bajo control</p>
            <p className='mt-1'>No tienes nada urgente pendiente.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
