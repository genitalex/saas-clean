import {
  IconActivity,
  IconAdjustmentsHorizontal,
  IconArchive,
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowRight,
  IconBell,
  IconBold,
  IconBolt,
  IconBox,
  IconBrandGithub,
  IconBrandTwitter,
  IconBrightness,
  IconCalendar,
  IconCloud,
  IconCloudRain,
  IconCloudSnow,
  IconCloudStorm,
  IconCheck,
  IconChecks,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconChevronsDown,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircle,
  IconCircleCheck,
  IconCirclePlus,
  IconCircleX,
  IconClipboardText,
  IconClock,
  IconCode,
  IconCommand,
  IconCreditCard,
  IconDeviceLaptop,
  IconDots,
  IconDotsVertical,
  IconEdit,
  IconExternalLink,
  IconEyeOff,
  IconFile,
  IconFileDescription,
  IconFiles,
  IconFileText,
  IconFileTypePdf,
  IconFileTypeDoc,
  IconFileTypeXls,
  IconFileZip,
  IconFolder,
  IconGripVertical,
  IconHelpCircle,
  IconInbox,
  IconInfoCircle,
  IconItalic,
  IconLayoutDashboard,
  IconLayoutKanban,
  IconLayoutSidebar,
  IconLoader2,
  IconLock,
  IconLogin,
  IconLogout,
  IconMessage,
  IconMinus,
  IconMoon,
  IconMusic,
  IconPalette,
  IconPaperclip,
  IconPhone,
  IconPhoto,
  IconPin,
  IconPizza,
  IconPlug,
  IconPlus,
  IconProps,
  IconRosetteDiscountCheck,
  IconSearch,
  IconSelector,
  IconSend,
  IconSettings,
  IconShare,
  IconSlash,
  IconSparkles,
  IconStack2,
  IconStar,
  IconSun,
  IconTarget,
  IconTargetArrow,
  IconTrash,
  IconTrendingDown,
  IconTrendingUp,
  IconTypography,
  IconUnderline,
  IconUpload,
  IconUser,
  IconUserCircle,
  IconUserEdit,
  IconUserX,
  IconUsers,
  IconVideo,
  IconCrown,
  IconX
} from '@tabler/icons-react';

export type Icon = React.ComponentType<IconProps>;

const themedSvg = (props: IconProps, color: string, children: React.ReactNode) => {
  const { size = 24, strokeWidth = 1.9, style, ...svgProps } = props;
  return (
    <svg
      {...svgProps}
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={strokeWidth}
      strokeLinecap='round'
      strokeLinejoin='round'
      style={{ ...style, color }}
    >
      {children}
    </svg>
  );
};

const ThemeTodayIcon: Icon = (props) =>
  themedSvg(
    props,
    '#3b82f6',
    <>
      <circle cx='12' cy='12' r='8.5' />
      <path d='M12 7v5l3.5 2' />
    </>
  );

const ThemeWorkIcon: Icon = (props) =>
  themedSvg(
    props,
    '#7c3aed',
    <>
      <circle cx='12' cy='12' r='8.5' />
      <path d='m8.5 12 2.5 2.5 4.5-5' />
    </>
  );

const ThemeCalendarIcon: Icon = (props) =>
  themedSvg(
    props,
    '#06b6d4',
    <>
      <rect x='3.5' y='5' width='17' height='15' rx='3' />
      <path d='M7 3.5v4M17 3.5v4M3.5 9h17' />
      <path d='M8 13h.01M12 13h.01M16 13h.01M8 16h.01M12 16h.01M16 16h.01' strokeWidth='2.6' />
    </>
  );

const ThemeCustomersIcon: Icon = (props) =>
  themedSvg(
    props,
    '#f97316',
    <>
      <circle cx='9' cy='8' r='3' />
      <path d='M3.5 19c.7-3.1 2.6-4.8 5.5-4.8s4.8 1.7 5.5 4.8' />
      <path d='M16 6.5a2.6 2.6 0 1 1 0 5.1M16 14c2.2.2 3.7 1.7 4.4 4' />
    </>
  );

const ThemeOpportunityIcon: Icon = (props) =>
  themedSvg(
    props,
    '#ec4899',
    <>
      <path d='M4 17.5 9 12l3 3 7.5-8' />
      <path d='M15 7h4.5v4.5' />
      <path d='M4 20h16' />
    </>
  );

const ThemeNotificationIcon: Icon = (props) =>
  themedSvg(
    props,
    '#ef4444',
    <>
      <path d='M6.5 10a5.5 5.5 0 1 1 11 0v3.5l1.5 2H5l1.5-2Z' />
      <path d='M10 19h4' />
    </>
  );

const ThemeNoteIcon: Icon = (props) =>
  themedSvg(
    props,
    '#eab308',
    <>
      <path d='M6 3.5h8l4 4V20H6z' />
      <path d='M14 3.5V8h4' />
      <path d='M9 12h6M9 15.5h4' />
    </>
  );

const ThemeQuoteIcon: Icon = (props) =>
  themedSvg(
    props,
    '#8b5cf6',
    <>
      <path d='M6 3.5h9l3 3V20H6z' />
      <path d='M15 3.5V7h3' />
      <path d='M9 12h2.6M13.4 12H16M9 15.5h7' />
      <path d='M9 9.5h.01' strokeWidth='2.8' />
    </>
  );

const ThemeDocumentsIcon: Icon = (props) =>
  themedSvg(
    props,
    '#14b8a6',
    <>
      <path d='M7 5.5 9 3.5h8.5A1.5 1.5 0 0 1 19 5v13.5' />
      <path d='M5 7h9l3 3v10.5H5z' />
      <path d='M14 7v3h3M8.5 14h6M8.5 17h4' />
    </>
  );

const ThemeTemplateIcon: Icon = (props) =>
  themedSvg(
    props,
    '#f59e0b',
    <>
      <rect x='5' y='3.5' width='14' height='17' rx='2.5' />
      <path d='M9 3.5v4h6v-4M9 11h6M9 14.5h6M9 18h3' />
    </>
  );

const ThemeGoalsIcon: Icon = (props) =>
  themedSvg(
    props,
    '#10b981',
    <>
      <circle cx='12' cy='12' r='8.5' />
      <circle cx='12' cy='12' r='4.5' />
      <circle cx='12' cy='12' r='1.3' fill='currentColor' stroke='none' />
    </>
  );

const ThemeTeamIcon: Icon = (props) =>
  themedSvg(
    props,
    '#3b82f6',
    <>
      <circle cx='9' cy='8' r='3' />
      <path d='M3.5 19c.7-3.1 2.6-4.8 5.5-4.8s4.8 1.7 5.5 4.8' />
      <circle cx='17' cy='9' r='2.2' />
      <path d='M16 14.5c2 .3 3.3 1.7 3.9 3.7' />
    </>
  );

const ThemeAutomationIcon: Icon = (props) =>
  themedSvg(
    props,
    '#f97316',
    <path d='m13 2-8 12h6l-1 8 8-12h-6Z' fill='currentColor' stroke='none' />
  );

const ThemeIntegrationIcon: Icon = (props) =>
  themedSvg(
    props,
    '#14b8a6',
    <>
      <path d='M8 6v4a4 4 0 0 0 4 4h4' />
      <path d='M16 10V6h-4M16 6l3 3' />
      <circle cx='8' cy='6' r='2' fill='currentColor' stroke='none' />
      <circle cx='16' cy='18' r='2' fill='currentColor' stroke='none' />
    </>
  );

const ThemeWorkspaceIcon: Icon = (props) =>
  themedSvg(
    props,
    '#a855f7',
    <>
      <path d='M4 7.5 7 4h5l2.5 3.5' />
      <path d='M4 7.5h15.5L18 20H5Z' />
      <path d='M9 7.5v3.2a3 3 0 0 0 3 3h2.2' />
    </>
  );

const ThemeSettingsIcon: Icon = (props) =>
  themedSvg(
    props,
    '#64748b',
    <>
      <path d='M12 3.8 13.3 5.5l2.1-.2.7 2 1.9.9-.7 2 1.3 1.6-1.3 1.7.7 2-1.9.9-.7 2-2.1-.2L12 20.1l-1.3-1.6-2.1.2-.7-2-1.9-.9.7-2-1.3-1.7 1.3-1.6-.7-2 1.9-.9.7-2 2.1.2Z' />
      <circle cx='12' cy='12' r='2.7' />
    </>
  );

export const Icons = {
  // General
  alertCircle: IconAlertCircle,
  warning: IconAlertTriangle,
  arrowRight: IconArrowRight,
  check: IconCheck,
  checks: IconChecks,
  circleCheck: ThemeWorkIcon,
  close: IconX,
  clock: ThemeTodayIcon,
  code: IconCode,
  dots: IconDots,
  ellipsis: IconDotsVertical,
  externalLink: IconExternalLink,
  help: IconHelpCircle,
  info: IconInfoCircle,
  spinner: IconLoader2,
  search: IconSearch,
  settings: ThemeSettingsIcon,
  trash: IconTrash,
  archive: IconArchive,

  // Navigation / Chevrons
  chevronDown: IconChevronDown,
  chevronLeft: IconChevronLeft,
  chevronRight: IconChevronRight,
  chevronUp: IconChevronUp,
  chevronsDown: IconChevronsDown,
  chevronsLeft: IconChevronsLeft,
  chevronsRight: IconChevronsRight,
  chevronsUpDown: IconSelector,

  // Layout
  dashboard: IconLayoutDashboard,
  kanban: IconLayoutKanban,
  panelLeft: IconLayoutSidebar,

  // User
  user: IconUser,
  user2: IconUserCircle,
  account: IconUserCircle,
  profile: IconUser,
  employee: IconUserX,
  userPen: IconUserEdit,
  teams: ThemeTeamIcon,

  // Brand
  github: IconBrandGithub,
  twitter: IconBrandTwitter,
  logo: IconCommand,

  // Communication
  chat: IconMessage,
  notification: ThemeNotificationIcon,
  phone: IconPhone,
  video: IconVideo,
  send: IconSend,
  paperclip: IconPaperclip,

  // Files
  page: IconFile,
  post: IconFileText,
  note: ThemeNoteIcon,
  quote: ThemeQuoteIcon,
  template: ThemeTemplateIcon,
  fileTypePdf: IconFileTypePdf,
  fileTypeDoc: IconFileTypeDoc,
  fileTypeXls: IconFileTypeXls,
  fileZip: IconFileZip,
  media: IconPhoto,
  music: IconMusic,

  // Actions
  add: IconPlus,
  edit: IconEdit,
  pin: IconPin,
  upload: IconUpload,
  share: IconShare,
  login: IconLogin,
  logout: IconLogout,
  gripVertical: IconGripVertical,

  // Shapes / Indicators
  circle: IconCircle,
  circleX: IconCircleX,
  plusCircle: IconCirclePlus,
  xCircle: IconCircleX,
  minus: IconMinus,

  // Theme
  sun: IconSun,
  moon: IconMoon,
  brightness: IconBrightness,
  laptop: IconDeviceLaptop,
  palette: IconPalette,

  // Commerce / Plans
  billing: IconCreditCard,
  creditCard: IconCreditCard,
  product: IconBox,
  pro: IconCrown,
  exclusive: IconStar,
  sparkles: IconSparkles,
  badgeCheck: IconRosetteDiscountCheck,
  lock: IconLock,

  // Data / Charts
  trendingDown: IconTrendingDown,
  trendingUp: IconTrendingUp,
  eyeOff: IconEyeOff,
  adjustments: IconAdjustmentsHorizontal,

  // Text formatting
  bold: IconBold,
  italic: IconItalic,
  underline: IconUnderline,
  text: IconTypography,

  // Toast
  toastSuccess: IconCircleCheck,
  toastInfo: IconInfoCircle,
  toastWarning: IconAlertTriangle,
  toastError: IconCircleX,
  toastLoading: IconLoader2,

  // Misc
  pizza: IconPizza,
  workspace: ThemeWorkspaceIcon,
  forms: IconClipboardText,
  slash: IconSlash,
  calendar: ThemeCalendarIcon,
  cloud: IconCloud,
  cloudRain: IconCloudRain,
  cloudSnow: IconCloudSnow,
  cloudStorm: IconCloudStorm,
  galleryVerticalEnd: IconStack2,
  moreHorizontal: IconDots,

  // Work objects
  inbox: IconInbox,
  opportunities: ThemeOpportunityIcon,
  automations: ThemeAutomationIcon,
  goals: ThemeGoalsIcon,
  documents: ThemeDocumentsIcon,
  proposals: IconFileDescription,
  integrations: ThemeIntegrationIcon,
  pulse: IconActivity
};
