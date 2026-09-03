'use client';

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAutomationsQueryOptions, automationKeys } from '@/features/automations/api/queries';
import * as client from '@/features/automations/api/client';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import type { Automation } from '../types';

interface AutomationsListProps {
  organizationId: string;
}

const triggerLabels: Record<string, string> = {
  task_completed: 'Tarea completada',
  event_completed: 'Evento completado',
  waiting_due: 'Esperando vencido',
  task_overdue: 'Tarea vencida',
  customer_inactive: 'Cliente inactivo'
};

const actionLabels: Record<string, string> = {
  create_follow_up: 'Crear seguimiento',
  create_task: 'Crear tarea',
  create_attention: 'Crear atención',
  mark_attention: 'Marcar atención'
};

export function AutomationsList({ organizationId }: AutomationsListProps) {
  const queryClient = useQueryClient();

  const { data: automations = [] } = useSuspenseQuery(getAutomationsQueryOptions(organizationId));

  const toggleMutation = useMutation({
    mutationFn: (id: string) => {
      const automation = automations.find((a) => a.id === id);
      return client.toggleAutomation(id, !automation?.enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.all });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.deleteAutomation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.all });
    }
  });

  if (automations.length === 0) {
    return (
      <div className='rounded-lg border border-dashed p-12 text-center'>
        <Icons.automations className='text-muted-foreground mx-auto h-8 w-8 mb-2' />
        <p className='text-muted-foreground text-sm'>No automations configured yet</p>
        <p className='text-muted-foreground/70 text-xs mt-1'>
          Automations will help your workflow run smoothly
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {automations.map((automation) => (
        <Card key={automation.id} className='p-4'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1'>
              <div className='flex items-center gap-2'>
                <Badge variant='secondary'>
                  {triggerLabels[automation.trigger] || automation.trigger}
                </Badge>
                <Icons.arrowRight className='h-4 w-4 text-muted-foreground' />
                <Badge variant='outline'>
                  {actionLabels[automation.action] || automation.action}
                </Badge>
              </div>
              {Object.keys(automation.config || {}).length > 0 && (
                <div className='text-xs text-muted-foreground mt-2'>
                  {Object.entries(automation.config as Record<string, unknown>).map(
                    ([key, value]) => (
                      <div key={key}>
                        {key}: {String(value)}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <Switch
                checked={automation.enabled}
                onCheckedChange={() => toggleMutation.mutate(automation.id)}
                disabled={toggleMutation.isPending}
              />
              <Button
                variant='ghost'
                size='icon'
                onClick={() => deleteMutation.mutate(automation.id)}
                disabled={deleteMutation.isPending}
              >
                <Icons.trash className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
