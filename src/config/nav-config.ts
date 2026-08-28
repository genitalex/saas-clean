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
      {
        title: 'Today',
        url: '#',
        icon: 'clock',
        disabled: true,
        items: []
      },
      {
        title: 'Calendar',
        url: '/dashboard/calendar',
        icon: 'calendar',
        shortcut: ['c', 'a'],
        items: []
      }
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
      {
        title: 'Tasks',
        url: '/dashboard/tasks',
        icon: 'check',
        shortcut: ['t', 't'],
        items: []
      },
      {
        title: 'Kanban',
        url: '/dashboard/kanban',
        icon: 'kanban',
        shortcut: ['k', 'k'],
        items: []
      },
      {
        title: 'Activity',
        url: '#',
        icon: 'trendingUp',
        disabled: true,
        items: []
      }
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
      {
        title: 'Team',
        url: '#',
        icon: 'teams',
        disabled: true,
        items: []
      },
      {
        title: 'Settings',
        url: '#',
        icon: 'settings',
        disabled: true,
        items: []
      }
    ]
  }
];
