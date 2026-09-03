'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as service from '@/features/automations/api/service';
import { automationKeys } from '@/features/automations/api/queries';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import type { AutomationPayload } from '../types';

interface AutomationFormProps {
  organizationId: string;
  onSuccess?: () => void;
}

const triggerOptions = [
  { value: 'task_completed', label: 'Cuando tarea se completa' },
  { value: 'event_completed', label: 'Cuando evento se completa' },
  { value: 'waiting_due', label: 'Cuando espera vence' },
  { value: 'task_overdue', label: 'Cuando tarea vence' },
  { value: 'customer_inactive', label: 'Cuando cliente inactivo' }
];

const actionOptions = [
  { value: 'create_follow_up', label: 'Crear seguimiento' },
  { value: 'create_task', label: 'Crear tarea' },
  { value: 'create_attention', label: 'Crear atención' },
  { value: 'mark_attention', label: 'Marcar atención' }
];

export function AutomationForm({ organizationId, onSuccess }: AutomationFormProps) {
  const queryClient = useQueryClient();
  const [trigger, setTrigger] = useState<string>('task_completed');
  const [action, setAction] = useState<string>('create_follow_up');

  const mutation = useMutation({
    mutationFn: async (values: AutomationPayload) => {
      return service.createAutomation(organizationId, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.all });
      setTrigger('task_completed');
      setAction('create_follow_up');
      onSuccess?.();
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate({
      trigger: trigger as any,
      action: action as any,
      enabled: true
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='trigger'>Cuando</Label>
        <Select value={trigger} onValueChange={(val) => val && setTrigger(val)}>
          <SelectTrigger id='trigger'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {triggerOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='action'>Entonces</Label>
        <Select value={action} onValueChange={(val) => val && setAction(val)}>
          <SelectTrigger id='action'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {actionOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type='submit' className='w-full' disabled={mutation.isPending}>
        {mutation.isPending && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
        Crear automatización
      </Button>
    </form>
  );
}
