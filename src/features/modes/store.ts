import { create } from 'zustand';

export type Mode = 'focus' | 'pause' | 'end-of-day' | null;

export type ModeState = {
  activeMode: Mode;
  focusTaskId: string | null;
  pauseDuration: number; // seconds
  pauseTimeRemaining: number; // seconds
  focusTaskTitle: string | null;
  focusTaskCustomer: string | null;
  focusTaskDueTime: string | null;
  focusPriority: string | null;
};

export const useModeStore = create<
  ModeState & {
    setFocusMode: (
      taskId: string,
      title: string,
      customer?: string,
      dueTime?: string,
      priority?: string
    ) => void;
    setFocusTaskId: (taskId: string | null) => void;
    setPauseMode: (duration: number) => void;
    setPauseTimeRemaining: (time: number) => void;
    setEndOfDayMode: () => void;
    clearMode: () => void;
  }
>((set) => ({
  activeMode: null,
  focusTaskId: null,
  pauseDuration: 60,
  pauseTimeRemaining: 0,
  focusTaskTitle: null,
  focusTaskCustomer: null,
  focusTaskDueTime: null,
  focusPriority: null,

  setFocusMode: (taskId, title, customer, dueTime, priority) =>
    set({
      activeMode: 'focus',
      focusTaskId: taskId,
      focusTaskTitle: title,
      focusTaskCustomer: customer ?? null,
      focusTaskDueTime: dueTime ?? null,
      focusPriority: priority ?? null
    }),

  setFocusTaskId: (taskId) => set({ focusTaskId: taskId }),

  setPauseMode: (duration) =>
    set({
      activeMode: 'pause',
      pauseDuration: duration,
      pauseTimeRemaining: duration
    }),

  setPauseTimeRemaining: (time) => set({ pauseTimeRemaining: time }),

  setEndOfDayMode: () => set({ activeMode: 'end-of-day' }),

  clearMode: () =>
    set({
      activeMode: null,
      focusTaskId: null,
      pauseDuration: 60,
      pauseTimeRemaining: 0,
      focusTaskTitle: null,
      focusTaskCustomer: null,
      focusTaskDueTime: null,
      focusPriority: null
    })
}));
