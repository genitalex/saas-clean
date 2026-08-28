import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      {
        title: 'Overview',
        url: '/dashboard/overview',
        icon: 'dashboard',
        shortcut: ['d', 'd'],
        items: []
      },
      { title: 'Today', url: '/dashboard/today', icon: 'clock', items: [] },
      {
        title: 'Calendar',
        url: '/dashboard/calendar',
        icon: 'calendar',
        shortcut: ['c', 'a'],
        items: []
      },
      { title: 'Opportunities', url: '/dashboard/opportunities', icon: 'trendingUp', items: [] },
      { title: 'Business Pulse', url: '/dashboard/business-pulse', icon: 'dashboard', items: [] }
    ]
  },
  {
    label: 'Work',
    items: [
      {
        title: 'Customers',
        url: '/dashboard/customers',
        icon: 'teams',
        shortcut: ['c', 'u'],
        items: []
      },
      { title: 'Tasks', url: '/dashboard/tasks', icon: 'check', shortcut: ['t', 't'], items: [] },
      {
        title: 'Kanban',
        url: '/dashboard/kanban',
        icon: 'kanban',
        shortcut: ['k', 'k'],
        items: []
      },
      { title: 'Activity', url: '/dashboard/activity', icon: 'trendingUp', items: [] }
    ]
  },
  {
    label: 'System',
    items: [
      {
        title: 'Notifications',
        url: '/dashboard/notifications',
        icon: 'notification',
        shortcut: ['n', 'n'],
        items: []
      },
      { title: 'Team', url: '/dashboard/team', icon: 'teams', items: [] },
      { title: 'Settings', url: '/dashboard/settings', icon: 'settings', items: [] }
    ]
  }
];
