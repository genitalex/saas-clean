import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    variant: 'primary',
    items: [
      { title: 'Today', url: '/dashboard/today', icon: 'clock', shortcut: ['g', 't'], items: [] },
      { title: 'Tasks', url: '/dashboard/tasks', icon: 'check', shortcut: ['t', 't'], items: [] },
      {
        title: 'Kanban',
        url: '/dashboard/kanban',
        icon: 'kanban',
        shortcut: ['k', 'k'],
        items: []
      },
      {
        title: 'Calendar',
        url: '/dashboard/calendar',
        icon: 'calendar',
        shortcut: ['c', 'a'],
        items: []
      },
      {
        title: 'Customers',
        url: '/dashboard/customers',
        icon: 'teams',
        shortcut: ['c', 'u'],
        items: []
      }
    ]
  },
  {
    label: 'Trabajo',
    variant: 'primary',
    items: [
      { title: 'Inbox', url: '/dashboard/inbox', icon: 'inbox', shortcut: ['g', 'i'], items: [] },
      { title: 'Activity', url: '/dashboard/activity', icon: 'trendingUp', items: [] },
      { title: 'Opportunities', url: '/dashboard/opportunities', icon: 'opportunities', items: [] },
      { title: 'Business Pulse', url: '/dashboard/business-pulse', icon: 'pulse', items: [] },
      { title: 'Automations', url: '/dashboard/automations', icon: 'automations', items: [] },
      { title: 'Goals', url: '/dashboard/goals', icon: 'goals', items: [] },
      { title: 'Documents', url: '/dashboard/documents', icon: 'documents', items: [] },
      { title: 'Proposals', url: '/dashboard/proposals', icon: 'proposals', items: [] }
    ]
  },
  {
    label: 'Organización',
    variant: 'secondary',
    items: [
      { title: 'Team', url: '/dashboard/team', icon: 'teams', items: [] },
      { title: 'Integrations', url: '/dashboard/integrations', icon: 'integrations', items: [] },
      { title: 'Settings', url: '/dashboard/settings', icon: 'settings', items: [] }
    ]
  }
];

export const mobileNavItems = [
  navGroups[0].items[0], // Today
  navGroups[0].items[1], // Tasks
  navGroups[0].items[2], // Kanban
  navGroups[0].items[3], // Calendar
  navGroups[0].items[4] // Customers
];

export const desktopNavItems = mobileNavItems;
