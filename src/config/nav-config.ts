import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Core',
    variant: 'primary',
    items: [
      { title: 'Today', url: '/dashboard/today', icon: 'clock', shortcut: ['g', 't'], items: [] },
      {
        title: 'Calendar',
        url: '/dashboard/calendar',
        icon: 'calendar',
        shortcut: ['c', 'a'],
        items: []
      },
      { title: 'Tasks', url: '/dashboard/tasks', icon: 'check', shortcut: ['t', 't'], items: [] },
      {
        title: 'Customers',
        url: '/dashboard/customers',
        icon: 'teams',
        shortcut: ['c', 'u'],
        items: []
      },
      {
        title: 'Opportunities',
        url: '/dashboard/opportunities',
        icon: 'opportunities',
        shortcut: ['o', 'p'],
        items: []
      },
      { title: 'Kanban', url: '/dashboard/kanban', icon: 'kanban', shortcut: ['k', 'k'], items: [] }
    ]
  },
  {
    label: 'Workspace',
    variant: 'primary',
    items: [
      { title: 'Inbox', url: '/dashboard/inbox', icon: 'inbox', shortcut: ['g', 'i'], items: [] },
      { title: 'Activity', url: '/dashboard/activity', icon: 'trendingUp', items: [] },
      { title: 'Overview', url: '/dashboard/overview', icon: 'dashboard', items: [] },
      { title: 'Business Pulse', url: '/dashboard/business-pulse', icon: 'pulse', items: [] },
      { title: 'Automations', url: '/dashboard/automations', icon: 'automations', items: [] },
      { title: 'Goals', url: '/dashboard/goals', icon: 'goals', items: [] },
      { title: 'Documents', url: '/dashboard/documents', icon: 'documents', items: [] },
      { title: 'Proposals', url: '/dashboard/proposals', icon: 'proposals', items: [] }
    ]
  },
  {
    label: 'System',
    variant: 'secondary',
    items: [
      { title: 'Team', url: '/dashboard/team', icon: 'teams', items: [] },
      { title: 'Integrations', url: '/dashboard/integrations', icon: 'integrations', items: [] },
      { title: 'Settings', url: '/dashboard/settings', icon: 'settings', items: [] }
    ]
  }
];

// The most-used destinations remain directly visible. Everything else belongs
// in the secondary More surface instead of disappearing into a tiny icon rail.
export const mobileNavItems = [
  navGroups[0].items[0], // Today
  navGroups[0].items[1], // Calendar
  navGroups[0].items[2], // Tasks
  navGroups[0].items[3], // Customers
  navGroups[0].items[4] // Opportunities
];

export const desktopNavItems = [
  navGroups[0].items[0], // Today
  navGroups[0].items[1], // Calendar
  navGroups[0].items[2], // Tasks
  navGroups[0].items[3], // Customers
  navGroups[0].items[4], // Opportunities
  navGroups[0].items[5], // Kanban
  navGroups[1].items[0], // Inbox
  navGroups[1].items[1] // Activity
];
