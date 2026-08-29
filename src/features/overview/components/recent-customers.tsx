import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { overviewMock } from './mock-data';

export function RecentCustomers() {
  return (
    <Card className='transition-shadow hover:shadow-sm'>
      <CardHeader className='flex-row items-center justify-between border-b'>
        <CardTitle className='text-base'>Clientes recientes</CardTitle>
        <Button
          variant='ghost'
          size='sm'
          render={<Link href='/dashboard/customers' aria-label='Ver clientes' />}
        >
          Ver clientes <Icons.chevronRight data-icon='inline-end' />
        </Button>
      </CardHeader>
      <CardContent className='grid gap-1 pt-3 md:grid-cols-3'>
        {overviewMock.customers.map((customer) => (
          <div
            key={customer.name}
            className='flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60'
          >
            <span className='bg-secondary text-secondary-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
              {customer.initials}
            </span>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>{customer.name}</p>
              <p className='text-muted-foreground truncate text-xs'>
                {customer.type} · {customer.activity}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
