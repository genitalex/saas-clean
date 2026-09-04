'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttentionItemsQueryOptions, attentionKeys } from '@/features/automations/api/queries';
import * as client from '@/features/automations/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import type { AttentionItem } from '../types';

interface AttentionItemsProps {
  compact?: boolean;
}

const typeLabels: Record<string, { label: string; icon: keyof typeof Icons }> = {
  task_overdue: { label: 'Tarea vencida', icon: 'alertCircle' },
  follow_up_overdue: { label: 'Seguimiento vencido', icon: 'alertCircle' },
  task_blocked: { label: 'Tarea bloqueada', icon: 'warning' },
  waiting_ready: { label: 'Listo para reanudar', icon: 'check' },
  customer_inactive: { label: 'Cliente inactivo', icon: 'alertCircle' }
};

function getItemPath(item: AttentionItem) {
  if (item.refEntityType === 'task') return `/dashboard/tasks/${item.refEntityId}`;
  if (item.refEntityType === 'customer') return `/dashboard/customers/${item.refEntityId}`;
  return '#';
}

export function AttentionItems({ compact = false }: AttentionItemsProps) {
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    ...getAttentionItemsQueryOptions('active'),
    throwOnError: true
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => client.acknowledgeAttentionItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attentionKeys.all });
    }
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => client.resolveAttentionItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attentionKeys.all });
    }
  });

  if (items.length === 0) {
    return null;
  }

  const displayItems = compact ? items.slice(0, 3) : items;

  return (
    <div className='space-y-2'>
      {displayItems.map((item) => {
        const typeInfo = typeLabels[item.type as keyof typeof typeLabels] || {
          label: item.type,
          icon: 'alertCircle' as const
        };
        const IconComponent = Icons[typeInfo.icon as keyof typeof Icons];

        return (
          <Card key={item.id} className='p-3'>
            <div className='flex items-start gap-3'>
              {IconComponent && (
                <IconComponent className='h-4 w-4 text-amber-600 mt-0.5 shrink-0' />
              )}

              <div className='flex-1 min-w-0'>
                <Link
                  href={getItemPath(item)}
                  className='font-medium text-sm hover:underline block'
                >
                  {item.title}
                </Link>
                <p className='text-xs text-muted-foreground line-clamp-2'>{item.message}</p>
              </div>

              <div className='flex items-center gap-1 shrink-0'>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => acknowledgeMutation.mutate(item.id)}
                  disabled={acknowledgeMutation.isPending}
                  title='Reconocer'
                >
                  <Icons.check className='h-3 w-3' />
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => resolveMutation.mutate(item.id)}
                  disabled={resolveMutation.isPending}
                  title='Resolver'
                >
                  <Icons.close className='h-3 w-3' />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      {compact && items.length > 3 && (
        <Link
          href='/dashboard/attention'
          className='text-xs text-muted-foreground hover:underline block text-center py-2'
        >
          Ver todos ({items.length})
        </Link>
      )}
    </div>
  );
}
