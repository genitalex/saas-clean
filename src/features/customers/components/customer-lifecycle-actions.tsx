'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function CustomerLifecycleActions({
  customerId,
  archived,
  onEdit,
  onCompleted
}: {
  customerId: string;
  archived: boolean;
  onEdit?: () => void;
  onCompleted?: (action: 'archived' | 'restored' | 'deleted') => void;
}) {
  const queryClient = useQueryClient();
  const [permanentDialogOpen, setPermanentDialogOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['customers'] }),
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] }),
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['events'] }),
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    ]);
    window.dispatchEvent(new Event('customers:refresh'));
  };

  const archiveOrRestore = async () => {
    setPending(true);
    try {
      const response = await fetch(
        archived ? `/api/customers/${customerId}/restore` : `/api/customers/${customerId}`,
        {
          method: archived ? 'POST' : 'DELETE'
        }
      );
      if (!response.ok) throw new Error('No se pudo actualizar el estado del cliente.');
      await refresh();
      toast.success(archived ? 'Cliente recuperado' : 'Cliente archivado');
      onCompleted?.(archived ? 'restored' : 'archived');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el cliente.');
    } finally {
      setPending(false);
    }
  };

  const permanentlyDelete = async () => {
    setPending(true);
    try {
      const response = await fetch(`/api/customers/${customerId}?permanent=true`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('No se pudo eliminar el cliente.');
      setPermanentDialogOpen(false);
      await refresh();
      toast.success('Cliente eliminado definitivamente');
      onCompleted?.('deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el cliente.');
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label='Acciones del cliente'
          className='inline-flex size-9 items-center justify-center rounded-lg border border-border/60 hover:bg-muted'
        >
          <Icons.ellipsis className='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-64 bg-popover p-1.5'>
          <DropdownMenuItem className='py-2.5' onClick={onEdit} disabled={!onEdit}>
            <Icons.edit /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            className='py-2.5'
            onClick={() => void archiveOrRestore()}
            disabled={pending}
          >
            <Icons.archive /> {archived ? 'Recuperar' : 'Archivar'}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant='destructive'
            className='whitespace-normal py-2.5 leading-5'
            onClick={() => setPermanentDialogOpen(true)}
            disabled={pending}
          >
            <Icons.trash /> Eliminar definitivamente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={permanentDialogOpen} onOpenChange={setPermanentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar definitivamente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las tareas y eventos se conservarán sin cliente
              asociado, y el historial de actividad se conservará desvinculado. Las notas no se
              modificarán porque no están vinculadas a clientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={(event) => {
                event.preventDefault();
                void permanentlyDelete();
              }}
              disabled={pending}
            >
              {pending ? 'Eliminando…' : 'Eliminar definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
