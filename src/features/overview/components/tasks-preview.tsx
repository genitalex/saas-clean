import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { overviewMock } from './mock-data';

export function TasksPreview() {
  return (
    <Card className='h-full'>
      <CardHeader className='flex-row items-center justify-between border-b'>
        <CardTitle className='text-base'>Tus tareas</CardTitle>
        <button
          type='button'
          className='text-muted-foreground hover:text-foreground text-xs font-medium'
        >
          Ver todas
        </button>
      </CardHeader>
      <CardContent className='flex flex-col gap-1 pt-3'>
        {overviewMock.tasks.map((task) => (
          <label
            key={task.title}
            className='flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60'
          >
            <Checkbox aria-label={`Completar ${task.title}`} />
            <span className='min-w-0 flex-1'>
              <span className='block truncate text-sm'>{task.title}</span>
              <span className='text-muted-foreground mt-0.5 block text-xs'>{task.when}</span>
            </span>
            {task.priority && (
              <Badge variant={task.priority === 'Alta' ? 'destructive' : 'outline'}>
                {task.priority}
              </Badge>
            )}
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
