export type IntegrationScope = 'personal' | 'workspace';
export type IntegrationCategory = 'Calendar' | 'Communication' | 'Automation' | 'Developer tools';
export type IntegrationStatus = 'connected' | 'attention' | 'available' | 'coming-soon';

export type Integration = {
  id: string;
  name: string;
  description: string;
  scope: IntegrationScope;
  category: IntegrationCategory;
  status: IntegrationStatus;
  initials: string;
  tone: 'blue' | 'slate' | 'orange' | 'green' | 'violet';
  account?: string;
  detail?: string;
  permissions?: string[];
  resources?: string[];
};

export const integrations: Integration[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Keep meetings and availability in sync.',
    scope: 'personal',
    category: 'Calendar',
    status: 'connected',
    initials: 'G',
    tone: 'blue',
    account: 'alex@northstar.studio',
    detail: '2 calendars · Last synced 8 min ago',
    permissions: ['View events', 'Create and edit events'],
    resources: ['Work calendar', 'Personal calendar']
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    description: 'Bring Microsoft 365 meetings into your day.',
    scope: 'personal',
    category: 'Calendar',
    status: 'attention',
    initials: 'O',
    tone: 'slate',
    account: 'alex@northstar.studio',
    detail: 'Reconnect required'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Turn messages into actions and updates.',
    scope: 'workspace',
    category: 'Communication',
    status: 'connected',
    initials: 'S',
    tone: 'orange',
    account: 'Northstar Studio',
    detail: 'Connected to 3 channels'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect your workspace to 7,000+ apps.',
    scope: 'workspace',
    category: 'Automation',
    status: 'available',
    initials: 'Z',
    tone: 'orange'
  },
  {
    id: 'make',
    name: 'Make',
    description: 'Build visual automations across your stack.',
    scope: 'workspace',
    category: 'Automation',
    status: 'available',
    initials: 'M',
    tone: 'violet'
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Self-hosted workflows with full control.',
    scope: 'workspace',
    category: 'Automation',
    status: 'available',
    initials: 'n8',
    tone: 'orange'
  },
  {
    id: 'api',
    name: 'API access',
    description: 'Build custom experiences on your workspace data.',
    scope: 'workspace',
    category: 'Developer tools',
    status: 'available',
    initials: '{}',
    tone: 'slate'
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Send event updates to any endpoint.',
    scope: 'workspace',
    category: 'Developer tools',
    status: 'available',
    initials: '↗',
    tone: 'green'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Bring your knowledge base into context.',
    scope: 'workspace',
    category: 'Communication',
    status: 'coming-soon',
    initials: 'N',
    tone: 'slate'
  }
];

export const activity = [
  ['Today, 9:42 AM', 'Calendar sync completed', 'Google Calendar'],
  ['Yesterday, 4:18 PM', 'Permissions updated', 'Google Calendar'],
  ['Mon, 11:06 AM', 'Connected workspace', 'Slack']
] as const;

export function statusLabel(status: IntegrationStatus) {
  return {
    connected: 'Connected',
    attention: 'Needs attention',
    available: 'Available',
    'coming-soon': 'Coming soon'
  }[status];
}
export function statusClass(status: IntegrationStatus) {
  return {
    connected: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    attention: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    available: 'bg-muted text-muted-foreground',
    'coming-soon': 'bg-muted text-muted-foreground'
  }[status];
}
export function toneClass(tone: Integration['tone']) {
  return {
    blue: 'bg-blue-500/10 text-blue-600',
    slate: 'bg-muted text-foreground',
    orange: 'bg-orange-500/10 text-orange-600',
    green: 'bg-emerald-500/10 text-emerald-600',
    violet: 'bg-violet-500/10 text-violet-600'
  }[tone];
}
export function getIntegration(id: string) {
  return integrations.find((integration) => integration.id === id);
}
