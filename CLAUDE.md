# CLAUDE.md

This is an existing Next.js 16 + shadcn/ui application being developed into a premium business productivity / operating system SaaS.

The existing technical architecture, conventions and project references below are authoritative and must be preserved.

---

## Product Direction

The product should feel like a premium application for running work.

It should NOT feel like:

- a generic CRM
- a BI dashboard
- an admin panel
- a shadcn starter
- a collection of cards and CRUD screens

Core principle:

**Power under the surface.**

The application can contain many powerful features, but the interface should remain calm, clear and easy to understand.

The main questions the product should answer are:

1. What matters now?
2. What's next?
3. What's happening today?

Prefer progressive disclosure over exposing every feature simultaneously.

### Design references

Use the principles of these products as inspiration:

- Linear
- Things
- Raycast
- Amie
- Notion Calendar / Cron
- modern Apple productivity applications

Do NOT clone their UI or branding.

Use them only as inspiration for:

- hierarchy
- spacing
- typography
- navigation
- interaction design
- responsiveness
- motion
- calm visual language

---

# CRITICAL PROJECT RULES

## Authentication — DO NOT TOUCH

Authentication is already implemented.

Do NOT modify:

- Better Auth
- login
- signup
- sessions
- cookies
- OAuth
- auth middleware
- trusted origins
- auth redirects
- password reset
- email verification
- authentication configuration

Do not create authentication flows unless explicitly requested.

For preview/local UI assumptions:

- User: Alex
- Email: a@a.com
- Workspace: My Workspace

Never spend implementation time changing production authentication merely to make a preview work.

---

## Database — DO NOT TOUCH

The existing application uses PostgreSQL + Drizzle.

Do NOT:

- install Neon
- create another database
- replace PostgreSQL
- change `DATABASE_URL`
- replace Drizzle
- create migrations unless explicitly requested
- modify the production schema
- redesign the database architecture

Use the existing data layer and feature APIs.

Preview-only local or in-memory state is acceptable when required for UI development, but must not replace production architecture.

---

## Infrastructure — DO NOT TOUCH

Do NOT modify production infrastructure unless explicitly requested.

Do NOT spend implementation time on:

- Vercel configuration
- deployment configuration
- production environment variables
- production credentials
- external infrastructure
- database provisioning

Focus on the requested product/UI/UX work.

---

## Next.js Structure

This is an existing Next.js application.

The project uses:

`src/app/`

Do NOT create another root-level:

`app/`

directory.

Do not create duplicate:

- applications
- layouts
- routes
- pages
- global styles

The project uses pnpm.

If you need to run the application:

`pnpm dev`

---

# Existing Technical References

## Key References

- **[AGENTS.md](./AGENTS.md)** — Full project overview, tech stack, structure, conventions, data fetching patterns, deployment
- **[docs/forms.md](./docs/forms.md)** — Form system: TanStack Form + Zod, composable fields, validation, multi-step, sheet/dialog forms
- **[docs/themes.md](./docs/themes.md)** — Theme system: OKLCH colors, adding themes, font config
- **[docs/deployment.md](./docs/deployment.md)** — Deployment: Vercel, production environment variables, Docker

---

# Critical Technical Conventions

## React Query

Use **React Query** for all data fetching.

Follow the existing pattern:

- `void prefetchQuery()` on server
- `useSuspenseQuery` on client
- `useMutation` for forms
- `HydrationBoundary` + `dehydrate` for hydration
- `<Suspense fallback>` for streaming

Do not introduce a competing data-fetching architecture.

---

## API layer

Follow the existing feature API structure:

`api/types.ts` → `api/service.ts` → `api/queries.ts`

Queries use key factories such as:

`entityKeys.all`
`entityKeys.list`
`entityKeys.detail`

Components should use the existing service/query layer.

Do not import mock APIs directly.

Do not create duplicate API systems.

---

## URL search params

Use **nuqs** for URL search params.

Use:

- `searchParamsCache` on the server
- `useQueryStates` on the client
- `getSortingStateParser` for sorting

Follow the existing `useDataTable` conventions.

---

## Icons

Only import icons from:

`@/components/icons`

Never import from:

`@tabler/icons-react`

directly inside feature/components.

Keep iconography visually consistent throughout the product.

---

## Forms

Use:

`useAppForm` from `@/lib/form`

with TanStack `createFormHook`.

Use:

`form.AppField`

with components from:

`@/components/forms/fields`

such as:

- `field.TextField`
- `field.SelectField`
- etc.

Use raw `form.Field` only for one-off custom fields.

Use form-level Zod `onSubmit` validators.

Follow the existing shadcn/TanStack Form anatomy.

Do not invent a competing form system.

---

## Page headers

Use `PageContainer` props:

- `pageTitle`
- `pageDescription`
- `pageHeaderAction`

Do not manually import `<Heading>` for page headers unless existing architecture explicitly requires it.

---

## Formatting

Follow the existing formatting conventions:

- single quotes
- JSX single quotes
- no trailing comma
- 2-space indentation

Do not reformat unrelated files unnecessarily.

---

# Existing Product Areas

Preserve the existing functionality and routes, including:

- Overview
- Today
- Calendar
- Customers
- Tasks
- Kanban
- Opportunities
- Activity
- Inbox
- Business Pulse
- Automations
- Goals
- Documents
- Proposals
- Client Portal
- Team
- Integrations
- Settings

Do not remove working functionality unless explicitly requested.

Do not create duplicate systems for:

- tasks
- events
- customers
- opportunities

Reuse existing APIs, queries, mutations and components.

---

# Design System Direction

The visual system should feel:

- premium
- calm
- soft
- modern
- tactile
- fast
- human
- distinctive

Avoid:

- generic CRM styling
- dashboard clutter
- excessive card containers
- excessive borders
- heavy shadows
- giant gradients
- neon colors
- excessive glassmorphism
- tiny typography
- cramped layouts

---

## Typography

Typography is part of the product identity.

Prefer:

- confident primary headings
- readable body copy
- comfortable navigation labels
- clear hierarchy
- quiet metadata

Do not shrink text simply to fit more information.

Mobile typography must remain comfortable.

Do not globally increase every font size without considering context.

---

## Buttons

Buttons should feel tactile and inviting.

Prefer:

- comfortable height
- generous horizontal padding
- strong but restrained primary styling
- clear icon alignment
- good hover/focus states
- large enough touch targets

Avoid tiny utility-looking controls for important actions.

Use a coherent button language throughout the application.

---

## Iconography

The icon system should feel like one family.

Keep consistent:

- size
- weight
- alignment
- spacing
- visual presence

Icons should support the UI without disappearing into it.

---

## Color

Use a coherent semantic color system.

Prefer:

neutral foundation
+
one primary brand/accent family
+
small semantic colors

Do not choose arbitrary colors component-by-component.

The same visual language should be used across:

- navigation
- buttons
- dashboard
- calendar
- Kanban
- dialogs
- Focus
- Pause
- states

Light and dark modes should both feel intentional.

---

## Depth / Glass

Use modern depth carefully.

Allowed:

- subtle translucency
- occasional backdrop blur
- low-opacity borders
- layered surfaces
- diffuse shadows

Do NOT make everything glass.

Glass is an accent, not the design language.

---

# Responsive Design

Responsive design is a first-class requirement.

Do NOT design desktop first and simply shrink it.

Recompose the interface for each device class.

Target:

- 320px
- 360px
- 375px
- 390px
- 430px
- 480px
- 640px
- 768px
- 820px
- 1024px
- 1180px
- 1280px
- 1366px
- 1440px
- 1600px
- 1920px

At mobile:

**SHOW LESS**
**MAKE IT BIGGER**
**GIVE IT SPACE**

Prefer:

- larger typography
- larger touch targets
- more vertical spacing
- fewer simultaneous controls
- progressive disclosure

Never allow page-wide horizontal overflow.

If a component genuinely requires horizontal scrolling, contain that scrolling within the component.

---

# Mobile Navigation

Mobile should feel like a real mobile application.

Prefer a dedicated mobile navigation pattern such as:

- Today
- Calendar
- Tasks
- Customers
- More

Secondary functionality should live inside More.

Do not expose a shrunken desktop sidebar on mobile.

Use safe-area support.

Navigation controls should generally provide comfortable touch targets.

---

## Mobile Navigation — Scroll Behavior

The mobile bottom navigation should behave like a modern mobile app.

When the user scrolls **DOWN** through page content:

- smoothly hide the bottom navigation
- animate it downward/off-screen
- do not remove it abruptly
- do not cause the page layout to jump
- do not resize the content area when it hides

When the user scrolls **UP**:

- smoothly reveal the bottom navigation
- animate it back into view
- keep the transition fast and natural
- do not cause the page layout to jump

Behavior:

**Scroll down → hide**
**Scroll up → show**

When the user is at or near the top of the page:

**the bottom navigation must remain visible.**

Use a short, smooth transition with appropriate easing.

The implementation should be performant.

Avoid excessive scroll listeners, unnecessary re-renders, polling or animation loops.

Prefer passive scroll handling where appropriate.

Respect:

`prefers-reduced-motion`

When reduced motion is requested, avoid or minimize the animated translation while preserving the show/hide behavior and accessibility.

The bottom navigation must continue to respect:

`env(safe-area-inset-bottom)`

Do not allow the navigation to cover important content.

The content layout must remain stable when the navigation hides or appears.

---

# Desktop Navigation

The desktop sidebar should feel like a premium application navigation system.

Prioritize:

- readability
- strong hierarchy
- clear active state
- generous spacing
- consistent icons
- workspace context

Do not optimize for maximum number of links visible.

Secondary navigation can use progressive disclosure.

Collapsed navigation must remain intentional and usable.

---

# Calendar

Calendar is a flagship product area.

It should feel like a premium scheduling/productivity application.

It should NOT feel like a generic admin calendar.

Prioritize:

- excellent date navigation
- beautiful month/week/day views
- direct interaction
- meaningful event colors
- obvious today state
- clear weekend treatment
- muted out-of-month days
- responsive mobile behavior
- quick event creation

Clicking a day should be able to create an event using the existing event system.

Do not create a duplicate event backend.

---

# Kanban

Kanban should feel like a premium work board.

Desktop may use multiple columns.

Mobile should NOT show four tiny columns simultaneously.

Use a mobile-first composition such as:

- column selector
- focused single-column view
- controlled internal scrolling

Task cards should remain readable and touch-friendly.

---

# Focus / Pause / End of Day

These are signature product experiences.

## Focus

Should help the user focus on one real task.

Use existing task data and mutations.

Do not replace real mutations with fake local-only state.

## Pause

Should be calm, minimal and human.

## End of Day

Should use real available data and provide a calm closing experience.

These experiences should be visually simpler than the dashboard.

---

# Dashboard

The Dashboard should communicate:

- what matters
- what comes next
- what is happening today

Avoid making the Dashboard a wall of KPI cards.

Prefer:

- strong hierarchy
- fewer visible elements
- useful progressive disclosure

---

# Motion

Use motion intentionally and sparingly.

Good uses include:

- navigation transitions
- active states
- sheet opening
- command palette
- calendar interactions
- Focus transitions
- task completion
- mobile bottom-nav reveal/hide

Motion should make interactions feel connected and physical.

Avoid decorative animation that does not communicate state.

Respect:

`prefers-reduced-motion`

---

# Performance

Keep the application fast.

Do not add large libraries merely for visual effects.

Reuse existing components and utilities.

Avoid unnecessary rendering work.

For scroll-based UI behavior:

- avoid expensive calculations on every frame
- avoid unnecessary React state updates
- use performant event handling
- keep animations on transform/opacity where possible

---

# Accessibility

Maintain:

- keyboard navigation
- focus states
- semantic controls
- accessible labels
- sufficient contrast
- touch-friendly targets

Do not make visual improvements at the expense of usability.

---

# Shared Component Strategy

Prefer improving shared components over one-off page-specific hacks.

Examples:

- buttons
- typography
- surfaces
- navigation
- icons
- dialogs
- responsive primitives

The application should have ONE coherent visual language.

---

# Language

Spanish is the preferred user-facing language for NEW product copy.

Do not casually translate unrelated existing pages unless explicitly requested.

When adding new UI:

prefer Spanish copy unless the surrounding feature clearly uses another established language.

---

# Development Rules

Before making a substantial change:

1. Read `CLAUDE.md`.
2. Read the relevant section of `AGENTS.md` if the task touches architecture.
3. Inspect existing components before creating new ones.
4. Reuse existing APIs and shared primitives.
5. Prefer system-level improvements over one-off styling.
6. Avoid unrelated refactors.
7. Verify responsive behavior at relevant breakpoints.
8. Keep the application fast.
9. Preserve existing functionality.

---

# Product Quality Bar

When reviewing a UI change, ask:

- Does this feel like a real application?
- Is the hierarchy immediately understandable?
- Is there enough breathing room?
- Are important controls inviting to press?
- Is mobile genuinely designed rather than compressed?
- Does the interface feel distinctive?
- Does it feel calmer than a typical CRM?
- Is complexity hidden until needed?

When choosing between:

**more functionality**

and

**better clarity**

prefer better clarity unless the requested feature explicitly requires the additional functionality.