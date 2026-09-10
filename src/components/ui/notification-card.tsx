'use client';

import type { FC } from 'react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

export type NotificationStatus = 'unread' | 'read' | 'archived';
export type ActionType = 'redirect' | 'api_call' | 'workflow' | 'modal';
export type ActionStyle = 'primary' | 'danger' | 'default';

export interface NotificationAction {
  id: string;
  label: string;
  type: ActionType;
  style?: ActionStyle;
  executed?: boolean;
}

export interface NotificationCardProps {
  id: string;
  title: string;
  body: string;
  status?: NotificationStatus;
  createdAt?: string | Date;
  actions?: NotificationAction[];
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  dismissOnClick?: boolean;
  onOpen?: (id: string) => void;
  onAction?: (notificationId: string, actionId: string, actionType: ActionType) => void;
  loadingActionId?: string;
  className?: string;
}

const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} d`;

  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  });
};

const getActionIcon = (actionType: ActionType) => {
  const iconProps = { size: 12, strokeWidth: 2.5 };
  switch (actionType) {
    case 'redirect':
      return <Icons.externalLink {...iconProps} />;
    case 'api_call':
      return <Icons.check {...iconProps} />;
    case 'workflow':
      return <Icons.clock {...iconProps} />;
    case 'modal':
      return <Icons.alertCircle {...iconProps} />;
    default:
      return null;
  }
};

export const NotificationCard: FC<NotificationCardProps> = ({
  id,
  title,
  body,
  status = 'unread',
  createdAt,
  actions = [],
  onMarkAsRead,
  onDismiss,
  onOpen,
  dismissOnClick = false,
  onAction,
  loadingActionId,
  className
}) => {
  const isUnread = status === 'unread';

  return (
    <div
      className={cn(
        'group relative w-full cursor-default rounded-2xl transition-all',
        (dismissOnClick || onOpen) && 'cursor-pointer hover:ring-1 hover:ring-border',
        isUnread ? 'bg-muted' : 'bg-muted/40',
        className
      )}
      onClick={() => {
        if (dismissOnClick) onDismiss?.(id);
        else onOpen?.(id);
      }}
    >
      <div className='px-4 py-3.5'>
        <div className='flex items-start justify-between gap-3'>
          {/* Main content */}
          <div className='min-w-0 flex-1 space-y-1 pr-24'>
            {/* Title with unread indicator */}
            <div className='flex items-center gap-2'>
              <h3
                className={cn(
                  'text-[15px] leading-tight font-semibold',
                  isUnread ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {title}
              </h3>
              {isUnread && <div className='h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-500' />}
            </div>

            {/* Description */}
            <p
              className={cn(
                'mb-0 text-[13px]',
                isUnread ? 'text-muted-foreground' : 'text-muted-foreground/60'
              )}
            >
              {body}
            </p>
          </div>

          <div className='absolute right-2.5 top-2.5 flex items-center gap-1'>
            {isUnread && onMarkAsRead && (
              <button
                type='button'
                onClick={(event) => {
                  event.stopPropagation();
                  onMarkAsRead(id);
                }}
                className='text-muted-foreground hover:bg-background/80 hover:text-foreground rounded-lg p-1.5 opacity-70 transition-all hover:opacity-100'
                aria-label='Marcar como leída'
              >
                <Icons.check size={15} />
              </button>
            )}
            {onDismiss && (
              <button
                type='button'
                onClick={(event) => {
                  event.stopPropagation();
                  onDismiss(id);
                }}
                className='flex size-8 items-center justify-center rounded-[10px] border border-border/70 bg-background text-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground hover:scale-105 hover:shadow-md'
                aria-label='Cerrar notificación'
              >
                <Icons.close size={16} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>

        <div className='mt-3 flex items-end justify-between'>
          {/* Actions */}
          {actions.length > 0 && (
            <div className={cn('flex flex-wrap items-center gap-2', !isUnread && 'opacity-60')}>
              {actions.map((action) => {
                const isLoading = loadingActionId === action.id;
                const isExecuted = action.executed || false;
                const showLoading = isLoading && action.type !== 'modal';

                return (
                  <button
                    key={action.id}
                    type='button'
                    disabled={isLoading || isExecuted}
                    onClick={(event) => {
                      event.stopPropagation();
                      onAction?.(id, action.id, action.type);
                    }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-normal transition',
                      action.style === 'primary'
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : action.style === 'danger'
                          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                          : 'bg-accent text-muted-foreground hover:bg-accent hover:text-foreground',
                      showLoading && 'opacity-50',
                      isExecuted && 'cursor-not-allowed opacity-60'
                    )}
                  >
                    {showLoading ? (
                      <Icons.spinner size={12} className='animate-spin' />
                    ) : (
                      <>
                        <span>{action.label}</span>
                        {isExecuted ? (
                          <Icons.check size={12} strokeWidth={2.5} />
                        ) : (
                          getActionIcon(action.type)
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Timestamp */}
          {createdAt && (
            <span className='text-muted-foreground/60 inline-block text-[11px]'>
              {formatDate(createdAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
