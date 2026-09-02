# MEGA SAAS PRODUCT PROMPT — BUSINESS OPERATING SYSTEM

## 0. Mission

Transform this application from a thin collection of dashboard pages into a finished, premium Business Operating System: a calm, fast, visual workspace in which the calendar, tasks, customers, opportunities, communications, documents and team work form one connected operating loop.

The product must feel closer to a blend of Linear + Things + Superlist + Routine + Raycast + Apple productivity software than to a generic CRM, BI dashboard, ERP or shadcn starter.

The central product idea is **power under the surface**. The interface should look simple at first sight, but every object should open into useful context and every important action should be fast, reversible and connected to the rest of the workspace.

Never solve a product problem by adding a useless screen. Prefer contextual panels, command bars, inspectors, inline editing, drawers, popovers, keyboard actions and connected timelines.

## 1. Product principles

1. **Everything is work, not a record.** A customer, event, task or opportunity is useful because it drives an outcome.
2. **The calendar is a work surface.** Events are not dead appointments. They can have notes, tasks, people, customer context, outcomes, follow-ups and history.
3. **Context should travel with the user.** Opening an item should not force navigation away from the current view.
4. **One object, many views.** The same task/event/customer should be accessible from Today, Calendar, Search, Inbox, Activity, Customer, Pipeline and mobile.
5. **Fast by default.** Keyboard first, instant visual feedback, optimistic updates where safe, clear loading/error states.
6. **No fake functionality.** Do not display controls that do nothing.
7. **No dead-end pages.** Every page must answer a question or provide an action surface.
8. **Responsive is a product mode, not a CSS afterthought.** Desktop and mobile compositions can differ while preserving the same capabilities.
9. **Visual restraint.** Avoid gratuitous shadows, giant gradients, excessive glass, noisy borders, excessive cards and dashboard wallpaper.
10. **Progressive disclosure.** First layer is calm; second and third layers contain depth.

## 2. Global workspace shell

### Desktop

- Persistent left workspace navigation.
- Compact top command/header bar.
- Global search and command palette.
- Quick-create entry point always reachable.
- Notification center with unread state and useful actions.
- User/workspace switcher.
- Breadcrumbs only where navigation context helps; do not waste space repeating obvious labels.
- Support contextual right inspector on Calendar, Tasks, Customers, Opportunities and search results.

### Mobile

- Bottom navigation: Today, Calendar, Tasks, Customers, More.
- Safe-area aware controls.
- Large enough touch targets.
- Hide bottom nav on deliberate downward scroll and reveal on upward scroll.
- Full-screen contextual sheets instead of tiny dialogs.
- Keep the same capabilities as desktop: open, edit, move, complete, assign, link, search, quick-create.

### Global command center

Provide a Raycast-style command palette:

- Open with Cmd/Ctrl+K.
- Search pages, customers, tasks, events, opportunities and actions.
- Actions: New event, New task, New customer, New note, New opportunity, Search, Jump to Today, Focus Mode, Pause, End of Day.
- Recent items.
- Favorites.
- Keyboard shortcuts visible when useful.
- Commands must execute real product operations rather than route-only navigation.

## 3. Today / home

Today is the operating cockpit, not a grid of metric cards.

Show:
- Current date and human greeting.
- A concise status sentence: “Todo bajo control”, “3 cosas necesitan atención”, etc.
- Next event with countdown/state.
- Tasks due today and overdue tasks.
- Priority queue.
- Upcoming commitments.
- Recent activity.
- Follow-ups requiring action.
- Team attention for managers.
- Short weekly horizon.

Interaction:
- Every row is actionable.
- Open item in inspector without leaving Today.
- Complete tasks inline.
- Reorder priority list by drag and drop.
- Drag a task to calendar to schedule it.
- Drag a calendar item into Today priority queue where appropriate.
- Quick capture with natural-language input.
- “Plan my day” mode can group tasks around existing events.

## 4. Calendar — flagship module

Calendar must be one of the deepest surfaces in the application.

### Views

- Month.
- Week.
- Day.
- Agenda/list view.
- Compact mobile month.
- Mobile day timeline.
- Optional multi-calendar/team overlay architecture.

### Navigation

- Previous/next period.
- Today.
- Jump to date.
- Month/year picker.
- View switcher.
- Search.
- Filters.
- Calendar/category management.
- Personal/team visibility.

### Event creation

Support:
- Click empty slot.
- Drag across time slots to create a duration.
- Quick create via keyboard.
- Create from task.
- Create from customer.
- Create from opportunity.
- Create follow-up from an existing event.

### Event interaction

Clicking an event must open a **right-side inspector on desktop** and a **full-height sheet on mobile**.

Never force users into a blocking centered CRUD dialog for normal event inspection.

Inspector header:
- Color/category marker.
- Event title, editable inline.
- State: Planned, In progress, Done, Cancelled.
- More menu.
- Close.

Primary actions:
- Edit.
- Duplicate.
- Delete.
- Mark done.
- Start.
- Create task from event.
- Create follow-up event.
- Open customer.
- Open location/maps.
- Copy event details.

### Event information layers

Layer 1 — essentials:
- Title.
- Date.
- Start/end.
- Duration.
- All-day.
- Status.
- Assignee.
- Customer.
- Location.
- External meeting URL.

Layer 2 — work context:
- Description / notes.
- Tasks linked to the event.
- Event-related activity.
- Customer summary.
- Open tasks for the customer.
- Previous related interactions.

Layer 3 — workflow:
- Follow-up date.
- Next action.
- Owner.
- Outcome.
- Repeat rule.
- Reminder.
- Links/attachments architecture.
- Activity history.

### Inline editing

Allow editing of title, date, time, duration, status, assignee, customer and location without leaving the inspector.

### Dragging

Events must be movable directly on calendar:

- Drag vertically to change time.
- Drag horizontally across days in week/day-capable views.
- Snap to 5/10/15-minute increments.
- Show live ghost preview.
- Preserve duration while moving.
- Optimistic visual response with safe rollback on error.
- Show a small contextual toast with Undo after a move.

### Resizing

Events must be resizable from the bottom edge:

- Snap to 15-minute increments.
- Minimum duration 15 minutes.
- Live duration preview.
- Commit on pointer release.
- Keep the event title/preview readable while resizing.

### Keyboard calendar control

- Arrow keys navigate days where appropriate.
- T = Today.
- N = New event.
- / = Calendar search.
- Esc = close inspector.
- Enter = open focused event.

### Event duplication

Duplicate should open a lightweight confirmation/create state with copied context and adjustable date/time.

### Follow-up

“Crear seguimiento” should create a new event prefilled from the current event:
- related customer,
- assignee,
- useful title suffix,
- suggested date,
- copied context.

### Convert event into work

“Crear tarea” from event should create a real task connected to that event and customer when available, with due date optionally set to event end.

### Event status

Persist status. Visual treatment must remain restrained:
- planned = neutral,
- in progress = accent,
- done = muted/completed,
- cancelled = subdued/destructive.

### Recurrence architecture

Support a durable model for future recurrence:
- none,
- daily,
- weekly,
- monthly,
- custom frequency.

Do not fake recurrence in the UI. Keep the data model extensible even when advanced recurrence editing is phased in.

### Reminders architecture

Persist reminder policy per event:
- none,
- at start,
- 5/10/15/30/60 minutes,
- custom architecture.

## 5. Event inspector UX details

Desktop width should be resizable by dragging its left edge.

The inspector should remember a sensible width during the session.

Layout:
- Sticky header.
- Scrollable content.
- Sticky action footer only when necessary.
- No giant modal overlay.
- Preserve calendar context behind the inspector.

Suggested sections:
1. Header and state.
2. When.
3. People & customer.
4. Location.
5. Work items.
6. Notes.
7. Activity.
8. Related customer.
9. Follow-up.

Use expandable/collapsible sections for depth without clutter.

## 6. Unified task system

Tasks are first-class work objects.

Capabilities:
- List.
- Kanban.
- Today.
- Upcoming.
- Overdue.
- Waiting.
- My tasks.
- Team tasks.
- Filters.
- Search.
- Sort.
- Priority.
- Assignee.
- Customer.
- Due date.
- Event link.

Task actions:
- Complete inline.
- Reopen.
- Change status by drag/drop.
- Reschedule by drag.
- Assign/reassign.
- Change priority.
- Open inspector.
- Create event from task.
- Link customer.
- Add note.

Task inspector should show:
- description,
- status,
- priority,
- due date,
- assignee,
- customer,
- linked event,
- activity,
- quick actions.

## 7. Customer hub

A customer is not a CRUD detail page. It is a live context hub.

Show:
- identity/contact information,
- next action,
- active tasks,
- upcoming events,
- recent activity,
- opportunities,
- documents/proposals,
- notes,
- owner,
- health/attention state.

Every child object opens without destroying customer context.

Actions:
- New event.
- New task.
- New note.
- Call/email links.
- Map.
- Open opportunity.
- Schedule follow-up.

## 8. Activity timeline

Create a unified chronological timeline wherever context exists.

Activity types:
- note,
- call,
- email,
- status change,
- system event,
- task completion,
- event creation,
- event reschedule,
- event completion.

Timeline should explain what happened, when, by whom and what changed.

## 9. Inbox

Universal work inbox:
- unread notifications,
- mentions architecture,
- reminders,
- follow-ups,
- system events,
- assignment changes,
- overdue warnings.

Actions:
- complete,
- dismiss,
- snooze,
- open context,
- jump to item.

## 10. Opportunities

Pipeline must be useful, not a static demo.

Capabilities:
- stages,
- value,
- probability,
- expected close,
- owner,
- customer,
- next action,
- activity,
- tasks,
- events,
- notes.

Drag between stages.
Open in inspector.
Create event/task/follow-up from opportunity.

## 11. Documents, proposals, quotes

Treat commercial documents as part of workflows.

Each document should support:
- owner,
- customer,
- opportunity,
- status,
- created/updated times,
- related activity,
- next action.

The architecture should allow later file attachments and external storage.

## 12. Team/workload

Managers need a compact operational view:
- who is overloaded,
- overdue work,
- today's events,
- waiting tasks,
- ownership gaps,
- recent movement.

Do not create a BI dashboard. Use actionable lists and concise summaries.

## 13. Automations

Automations should be real configuration objects, not marketing tiles.

Trigger architecture:
- event created,
- event completed,
- task overdue,
- task completed,
- customer created,
- opportunity stage changed,
- form submitted.

Actions architecture:
- create task,
- create event,
- assign owner,
- create activity,
- notify.

Each automation should be inspectable and testable.

## 14. AI layer

AI should operate on the workspace context.

Useful actions:
- summarize customer,
- summarize event,
- prepare meeting brief,
- propose next action,
- turn notes into tasks,
- draft follow-up email,
- plan today from tasks and calendar,
- identify overdue/at-risk items.

Avoid a generic chat box that has no access to product data.

## 15. Search

Search should be global and contextual:
- events,
- tasks,
- customers,
- opportunities,
- activity.

Support keyboard navigation and direct opening in inspector.

## 16. Notes

Notes must remain lightweight.

Support:
- quick capture,
- pin,
- tag,
- customer association architecture,
- linking to event/task/opportunity architecture.

## 17. Focus / Pause / End of Day

### Focus

Dedicated calm mode that reduces navigation and surfaces one meaningful task at a time, with timer architecture and quick access to its related customer/event context.

### Pause / Disconnect

Short visual breathing/reset experience, easy to start and exit, not a gimmick.

### End of Day

Summarize:
- completed work,
- unfinished tasks,
- moved events,
- overdue items,
- suggested first action tomorrow.

## 18. Quick capture

Provide a universal quick capture action.

Examples:
- “Llamar a Ana mañana a las 10”
- “Preparar propuesta para Acme el viernes”
- “Revisar presupuesto el lunes”

The parser can begin as structured heuristics and evolve toward AI.

## 19. Notifications

Notifications must be actionable.

Each notification knows:
- source object,
- reason,
- timestamp,
- read/dismissed state,
- suggested action.

## 20. Performance and robustness

Mandatory:
- no unhandled promise errors,
- safe empty states,
- clear loading states,
- retry for transient failures,
- optimistic updates only where rollback exists,
- no cross-organization data leakage,
- server-side validation,
- client-side validation,
- permission checks,
- accessible keyboard flow,
- reduced-motion support,
- touch support,
- proper focus restoration,
- no hydration mismatches,
- mobile safe-area handling.

## 21. Data architecture

Core entities:
- organization,
- member/user,
- customer,
- event,
- task,
- activity,
- note,
- opportunity,
- document,
- automation,
- notification.

Important relationships:
- Event -> customer.
- Event -> assignee.
- Event -> tasks.
- Event -> activities.
- Task -> customer.
- Task -> event.
- Task -> assignee.
- Activity -> customer.
- Activity -> event where relevant.
- Opportunity -> customer.
- Future document/automation/notification links should follow the same contextual-object pattern.

All organization-scoped records must be protected by organization ownership checks.

## 22. Visual system

The visual language should feel premium, quiet and tactile.

Use:
- strong typography hierarchy,
- generous spacing,
- restrained radii,
- thin borders where needed,
- minimal shadows,
- subtle surface contrast,
- clear interaction feedback,
- purposeful motion.

Avoid:
- giant gradients,
- heavy glassmorphism,
- excessive shadow stacks,
- card grids for every concept,
- neon dashboard aesthetics,
- fake metric cards,
- cramped dense admin-table layouts.

## 23. Motion

Motion should communicate state:
- inspector slide,
- optimistic item movement,
- drag ghost,
- subtle reorder,
- command palette open/close,
- completed task transition.

Respect prefers-reduced-motion.

## 24. Accessibility

- Keyboard navigation.
- Focus-visible states.
- Proper labels.
- Aria pressed/expanded/selected states.
- Escape to close transient UI.
- Screen-reader announcements for drag/drop state changes where practical.
- Minimum touch target sizing.
- Do not rely on color alone.

## 25. Acceptance criteria

The finished application should pass this mental test:

1. User lands on Today and immediately understands what matters.
2. User can create a task or event in seconds.
3. User clicks an event and gets useful context without leaving the calendar.
4. User can edit event details inline.
5. User can drag an event to another time/day.
6. User can resize its duration.
7. User can create a task/follow-up from the event.
8. User can open the customer from the event and return without losing context.
9. User can search and jump directly to any object.
10. User can manage the same work from desktop and mobile.
11. No screen exists merely because the template had one.
12. No control is present unless it performs a meaningful action.
13. A manager can understand team workload without opening five pages.
14. The application feels like one coherent operating system rather than a collection of modules.

## 26. Implementation order

1. Stabilize the shell and object model.
2. Upgrade Calendar into the central work surface.
3. Add contextual inspector architecture.
4. Connect Events <-> Tasks <-> Activities <-> Customers.
5. Upgrade Today around the same objects.
6. Add Task/Customer/Opportunity inspectors.
7. Add Inbox/Search/Command actions.
8. Add automations and AI on top of real data.
9. Audit responsive/mobile behavior.
10. Run typecheck, lint and production build; fix every error before delivery.

## 27. Final quality bar

Do not return a visual mockup masquerading as functionality.
Do not add placeholder cards saying “coming soon” where an action is expected.
Do not duplicate the same data into disconnected pages.
Do not turn the application into a generic admin panel.

The target is a coherent premium operating system where **Calendar + Tasks + Customers + Activity** form one continuous work loop.
