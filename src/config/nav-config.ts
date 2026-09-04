import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Core',
    variant: 'primary',
    items: [
      { title: 'Today', url: '/dashboard/today', icon: 'clock', shortcut: ['g', 't'], items: [] },
      { title: 'Work', url: '/dashboard/my-work', icon: 'check', shortcut: ['g', 'w'], items: [] },
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
    label: 'More',
    variant: 'primary',
    items: [
      { title: 'Weekly Review', url: '/dashboard/weekly-review', icon: 'calendar', items: [] },
      { title: 'Activity', url: '/dashboard/activity', icon: 'trendingUp', items: [] },
      { title: 'Notifications', url: '/dashboard/notifications', icon: 'notification', items: [] },
      { title: 'Notes', url: '/dashboard/notes', icon: 'page', items: [] },
      { title: 'Opportunities', url: '/dashboard/opportunities', icon: 'opportunities', items: [] },
      { title: 'Quotes', url: '/dashboard/quotes', icon: 'post', items: [] },
      { title: 'Templates', url: '/dashboard/templates', icon: 'send', items: [] },
      { title: 'Goals', url: '/dashboard/goals', icon: 'goals', items: [] },
      { title: 'Documents', url: '/dashboard/documents', icon: 'documents', items: [] },
      { title: 'Proposals', url: '/dashboard/proposals', icon: 'proposals', items: [] },
      { title: 'Team', url: '/dashboard/team', icon: 'teams', items: [] }
    ]
  },
  {
    label: 'Settings',
    variant: 'secondary',
    items: [
      { title: 'Automations', url: '/dashboard/automations', icon: 'automations', items: [] },
      { title: 'Integrations', url: '/dashboard/integrations', icon: 'integrations', items: [] },
      { title: 'Users', url: '/dashboard/users', icon: 'teams', items: [] },
      { title: 'Workspaces', url: '/dashboard/workspaces', icon: 'workspace', items: [] },
      { title: 'Settings', url: '/dashboard/settings', icon: 'settings', items: [] }
    ]
  }
];

export const mobileNavItems = [
  navGroups[0].items[0],
  navGroups[0].items[1],
  navGroups[0].items[2],
  navGroups[0].items[3]
];
export const desktopNavItems = [
  navGroups[0].items[0],
  navGroups[0].items[1],
  navGroups[0].items[2],
  navGroups[0].items[3]
];
