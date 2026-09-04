import type { DesignTarget } from '../types/design-types';

export interface DesignTreeNode {
  id: string;
  label: string;
  selector: string;
  children?: DesignTreeNode[];
}

export const SCREEN_TREES: Record<string, DesignTreeNode[]> = {
  today: [
    {
      id: 'shell.header',
      label: 'Header',
      selector: '[data-design-id="shell.header"]',
      children: [
        { id: 'header.search', label: 'Search', selector: '[data-design-id="header.search"]' }
      ]
    },
    { id: 'today.greeting', label: 'Greeting', selector: '[data-design-id="today.greeting"]' },
    {
      id: 'today.quick-capture',
      label: 'Quick Capture',
      selector: '[data-design-id="today.quick-capture"]'
    },
    { id: 'today.attention', label: 'Attention', selector: '[data-design-id="today.attention"]' },
    {
      id: 'today.quick-actions',
      label: 'Quick Actions',
      selector: '[data-design-id="today.quick-actions"]'
    },
    {
      id: 'navigation.bottom',
      label: 'Bottom Navigation',
      selector: '[data-design-id="navigation.bottom"]'
    }
  ],
  work: [
    { id: 'work.filters', label: 'Filters', selector: '[data-design-id="work.filters"]' },
    { id: 'work.list', label: 'List', selector: '[data-design-id="work.list"]' },
    {
      id: 'work.board',
      label: 'Board',
      selector: '[data-design-id="work.board"]',
      children: [
        { id: 'work.column', label: 'Column', selector: '[data-design-id="work.column"]' },
        { id: 'work.task', label: 'Task', selector: '[data-design-id="work.task"]' }
      ]
    },
    {
      id: 'navigation.bottom',
      label: 'Bottom Navigation',
      selector: '[data-design-id="navigation.bottom"]'
    }
  ],
  calendar: [
    { id: 'calendar.toolbar', label: 'Toolbar', selector: '[data-design-id="calendar.toolbar"]' },
    {
      id: 'calendar.month-title',
      label: 'Month Header',
      selector: '[data-design-id="calendar.month-title"]'
    },
    {
      id: 'calendar.view-selector',
      label: 'View Selector',
      selector: '[data-design-id="calendar.view-selector"]'
    },
    {
      id: 'calendar.category',
      label: 'Categories',
      selector: '[data-design-id="calendar.category"]'
    },
    {
      id: 'calendar.grid',
      label: 'Calendar Grid',
      selector: '[data-design-id="calendar.grid"]',
      children: [
        { id: 'calendar.cell', label: 'Day', selector: '[data-design-id="calendar.cell"]' },
        { id: 'calendar.event', label: 'Event', selector: '[data-design-id="calendar.event"]' }
      ]
    }
  ],
  customers: [
    { id: 'customers.search', label: 'Search', selector: '[data-design-id="customers.search"]' },
    {
      id: 'customers.table',
      label: 'Table',
      selector: '[data-design-id="customers.table"]',
      children: [
        { id: 'customers.row', label: 'Row', selector: '[data-design-id="customers.row"]' }
      ]
    },
    {
      id: 'customers.inspector',
      label: 'Inspector',
      selector: '[data-design-id="customers.inspector"]'
    }
  ]
};

export function targetFromElement(element: HTMLElement): DesignTarget {
  const id = element.dataset.designId || '';
  return {
    id,
    label: id || element.dataset.slot || element.tagName.toLowerCase(),
    type: element.tagName.toLowerCase(),
    component: element.dataset.designComponent || element.dataset.slot || 'Unregistered',
    role: element.dataset.designRole || '',
    variant: element.dataset.designVariant || '',
    source: element.dataset.designSource || 'Elemento registrado en runtime'
  };
}
