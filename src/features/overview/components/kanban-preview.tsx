import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { overviewMock } from './mock-data';

export function KanbanPreview() {
  return (
    <Card>
      <CardHeader className='flex-row items-center justify-between border-b'>
        <CardTitle className='text-base'>Estado del trabajo</CardTitle>
        <Button variant='ghost' size='sm' render={<Link href='/dashboard/kanban' />}>
          Ver Kanban <Icons.chevronRight data-icon='inline-end' />
        </Button>
      </CardHeader>
      <CardContent className='grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4'>
        {overviewMock.kanban.map((column) => (
          <div key={column.label} className='bg-muted/50 rounded-lg p-3'>
            <div className='mb-3 flex items-center gap-2'>
              <span className={`size-2 rounded-full ${column.tone}`} />
              <span className='text-muted-foreground text-xs'>{column.label}</span>
            </div>
            <p className='text-2xl font-semibold tabular-nums'>{column.count}</p>
            <div className='bg-background mt-3 h-1 rounded-full'>
              <div className={`h-full w-2/3 rounded-full ${column.tone}`} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
