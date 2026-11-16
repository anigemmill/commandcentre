# THE OUTSIDE IN
# Command Centre
## Product Requirements, Architecture & Design System

> Source document, kept as supplied by the product owner. Do not edit to record decisions:
> record them in `docs/decisions.md` and reference the section number here.

**Document status:** Master product blueprint – Draft v1.1  
**Product owner:** The Outside In  
**Product:** Command Centre  
**Connected products:** Findable and Reel Deal  
**Visual direction:** Premium editorial  
**Interface:** Light and dark modes, light default

---

# PART ONE — PRODUCT DEFINITION

## 1. Product Vision

Command Centre is an AI-powered business growth and marketing operating system designed to help businesses understand their performance, develop strategy, identify opportunities, coordinate activity and achieve measurable growth.

It provides one central platform where businesses manage strategy, marketing, intelligence, projects, content, performance and their AI workforce.

Command Centre is the central intelligence and orchestration layer within The Outside In's connected product ecosystem.

### The three products

| Product | Primary responsibility |
|---|---|
| Command Centre | Think, plan, coordinate, analyse and measure |
| Findable | SEO, AEO, GEO and digital discoverability |
| Reel Deal | AI-powered video creation and creative production |

Each product must operate independently while offering additional functionality and intelligence when connected.

## 2. Product Principles

1. Business-first.
2. Connected intelligence.
3. AI-native.
4. Modular and configurable.
5. Secure multi-tenancy.
6. Measurable business outcomes.
7. Human-controlled AI execution.
8. Extensible architecture.
9. Commercial scalability.
10. Interoperability across products.
11. Consistent and accessible user experience.
12. Premium, recognisable visual identity.

## 3. Target Customers

Designed for businesses across multiple industries, with an initial commercial focus on:

- Tourism and hospitality.
- Experiences and attractions.
- Accommodation.
- Service-based businesses.
- Small and medium-sized businesses.
- Marketing agencies and multi-client organisations.

The architecture must remain industry-agnostic.

---

# PART TWO — PLATFORM FUNCTIONALITY

## 4. Platform Navigation

The platform will contain eleven principal modules.

### 01. Home
- Business performance snapshot.
- Today's priorities.
- Strategic objectives.
- Upcoming deadlines.
- Overdue tasks.
- Active projects.
- Campaign activity.
- Important intelligence.
- AI recommendations.
- Agent activity.
- Notifications and approvals.

### 02. Business Intelligence
- Business profile.
- Industry and market information.
- Products and services.
- Locations.
- Business model.
- Customer and audience profiles.
- Competitor intelligence.
- Customer feedback and sentiment.
- Market trends.
- Business opportunities.
- Knowledge and document library.

### 03. Strategy and Growth
- Business vision and mission.
- Business positioning.
- Competitive advantage.
- SWOT analysis.
- Business strategy.
- Marketing strategy.
- Annual growth plan.
- Six-month growth plan.
- Quarterly priorities.
- Monthly marketing plans.
- Objectives and KPIs.
- Strategic progress and learnings.

### 04. Marketing
- Integrated marketing plan.
- Channel strategies.
- Campaign management.
- Content calendar.
- Content bank.
- Social media planning.
- Email marketing.
- Paid advertising planning.
- Blog and article planning.
- Content production workflows.
- Campaign approvals and results.

### 05. Discoverability – Findable
- SEO.
- AEO.
- GEO and AI search visibility.
- Keyword opportunities.
- Search intent.
- Competitor visibility.
- Website optimisation.
- Technical SEO.
- Content opportunities.
- Search performance and recommendations.

### 06. Creative Studio – Reel Deal
- Video production requests.
- AI video creation.
- Brand intelligence.
- Creative templates.
- Production pipeline.
- Creative asset library.
- Campaign creative requirements.
- Production approvals.
- Content delivery and performance.

### 07. Projects and Tasks
- Project management.
- Task management.
- Milestones.
- Dependencies.
- Ownership.
- Deadlines.
- Budgets.
- Workload management.
- Progress tracking.
- Recurring tasks.
- Workflow automation.

### 08. AI Workforce
- Agent library.
- Agent configurations.
- Instructions and knowledge sources.
- Permissions.
- Schedules and triggers.
- Agent collaboration.
- Run history.
- Outputs and recommendations.
- Usage and performance monitoring.

### 09. Performance and Insights
- Business performance.
- Marketing performance.
- Website analytics.
- Search performance.
- Social performance.
- Video performance.
- Email performance.
- Advertising performance.
- Campaign reporting.
- Lead generation.
- Conversion tracking.
- Revenue reporting.
- Attribution and forecasting.

### 10. Approval Centre
- Content approvals.
- Campaign approvals.
- Creative approvals.
- AI recommendations.
- Strategic changes.
- External communications.
- Budget approvals.
- Automated action approvals.

### 11. Strategy Assistant
- Conversational business intelligence.
- Strategy analysis.
- Performance analysis.
- Intelligence summaries.
- Opportunity identification.
- Recommendations.
- Campaign ideation.
- Specialist agent coordination.
- Proposed task and project creation.

### Administration
- Organisation settings.
- Workspace management.
- Brand management.
- User management.
- Roles and permissions.
- Integrations.
- Subscription and billing.
- Usage and credits.
- Notifications.
- Audit history.
- Security and privacy.

## 5. Business Context and Onboarding

Each organisation must have a structured business profile containing:

- Business name and description.
- Industry and category.
- Website and digital properties.
- Products and services.
- Locations.
- Business model and revenue streams.
- Target audiences.
- Brand positioning and personality.
- Unique selling propositions.
- Competitors.
- Business objectives.
- Growth ambitions.
- Marketing budget.
- Team structure.

### Onboarding

1. Create organisation account.
2. Add business information.
3. Configure brands and workspaces.
4. Add products and services.
5. Define audiences and competitors.
6. Establish business goals.
7. Set objectives and KPIs.
8. Invite team members.
9. Connect existing platforms.
10. Activate Findable and/or Reel Deal.
11. Configure AI workforce.
12. Generate initial business intelligence assessment.

Onboarding should be progressive, allowing customers to use the platform without completing every optional field.

## 6. Multi-Tenant Architecture

Support:

- Single-business organisations.
- Multi-brand organisations.
- Multiple workspaces.
- Multiple locations.
- Agency accounts.
- Separate client organisations.
- Enterprise structures.

Mandatory requirements:

- Organisation-level data isolation.
- Workspace and brand permissions.
- Role-based access.
- Database-level tenant isolation.
- Secure API authorisation.
- Audit history.
- Permission-aware AI access.

## 7. Core Data Model

Core entities:

Organisation, Workspace, Brand, Location, User, Team, Role, Permission, Business Profile, Strategy, Objective, KPI, Audience, Competitor, Campaign, Initiative, Content Item, Project, Task, Milestone, Intelligence Record, Document, Agent, Agent Run, Approval, Integration, Performance Metric, Report, Notification, Subscription and Audit Event.

Every record must support appropriate ownership, scope, timestamps, status and relationships.

Core records must support creation, editing, approval, archiving, restoration, deletion and version history.

## 8. Intelligence and Knowledge Management

Intelligence sources:

- Connected platforms.
- Findable.
- Reel Deal.
- Website analytics.
- Customer feedback.
- Competitor research.
- Industry research.
- Uploaded documents.
- Team observations.
- Meetings.
- AI agent research.
- Historical reports.

Each intelligence record must identify its source, date, evidence classification, confidence where appropriate, priority, impact, recommendation, owner and related objective.

Workflow:

Finding → Assessment → Recommendation → Human review → Task or project → Execution → Measurement → Learning.

## 9. AI Workforce

Agent categories:

**Leadership and orchestration**
- Chief of Staff.
- Executive Assistant.
- Business Strategy.
- Growth and Opportunity.

**Marketing and content**
- Marketing Strategist.
- Content Strategy.
- Social Media.
- Campaign Planning.
- Email Marketing.
- Brand and Creative.

**Discoverability and digital**
- SEO.
- AI Search Visibility.
- Website Optimisation.
- Competitor Intelligence.
- Digital Performance.

**Analytics and intelligence**
- Business Intelligence.
- Marketing Performance.
- Customer Intelligence.
- Results and Learning.

**Operations and productivity**
- Project Management.
- Task and Workflow.
- Meeting and Action.
- Reporting.

Agents must be configurable, with instructions, knowledge sources, tools, permissions, schedules, triggers, autonomy settings and execution histories.

Autonomy levels:

1. Recommend.
2. Prepare.
3. Execute with approval.
4. Execute explicitly authorised low-risk workflows autonomously.

Agents must collaborate and share authorised context.

## 10. Findable and Reel Deal Integrations

Findable provides specialist search and discoverability functionality.

Command Centre receives authorised:
- Search findings.
- SEO and AI visibility.
- Keyword opportunities.
- Competitor findings.
- Website optimisation recommendations.
- Performance information.

Reel Deal provides specialist creative and video production functionality.

Command Centre exchanges:
- Brand guidelines.
- Campaign briefs.
- Creative requirements.
- Production requests.
- Video outputs.
- Production status.
- Performance information.

Both integrations must use documented APIs and shared business context.

## 11. Projects and Workflow Management

Projects must support objectives, owners, teams, milestones, tasks, dependencies, budgets, status, progress, documents and related campaigns.

Tasks must support descriptions, priority, owner, due dates, status, related projects, objectives, intelligence, dependencies and approval.

Workload management should identify overdue work, blocked tasks, uneven workloads and project risks.

## 12. Performance and Reporting

Reporting categories:

- Business performance.
- Website.
- Discoverability.
- Social and content.
- Email.
- Paid advertising.
- Campaigns.
- Revenue and conversion.

Every metric must identify its source, reporting period, update timestamp and evidence classification.

Evidence classifications:
- Measured.
- Platform-reported.
- Estimated.
- AI interpretation.

Reporting outputs include executive dashboards, business reports, marketing reports, channel reports, campaign reports and monthly, quarterly and annual reviews.

## 13. Knowledge Hub and Integrations

The knowledge hub must support strategy documents, brand guidelines, marketing plans, product information, customer research, historical reports, competitor research, meeting notes and approved messaging.

The integrations hub should support Google Analytics 4, Search Console, Google Ads, Meta, Google Business Profile, Microsoft 365, Google Workspace, email platforms, CRM platforms, booking systems and other business services.

## 14. Governance and Approvals

Central approval workflows must cover content, campaigns, creative assets, communications, strategic changes, AI recommendations, budgets and automated actions.

Every decision must record the requesting user or agent, approver, submission date, decision, decision date, comments and related record.

## 15. Commercial Architecture

Support:
- Individual product subscriptions.
- Connected product bundles.
- Full ecosystem subscriptions.
- Feature entitlements.
- User and workspace limits.
- Brand limits.
- AI usage and credits.
- Storage allowances.
- Integration limits.
- Add-ons.
- Upgrades and downgrades.

---

# PART THREE — VISUAL IDENTITY AND DESIGN SYSTEM

## 16. Design Vision

### Design direction: Premium Editorial

Command Centre must feel like a sophisticated, intelligent and premium business platform.

The visual experience should combine:

- Editorial design.
- Contemporary SaaS functionality.
- Natural and muted colours.
- Strong typography.
- Generous whitespace.
- Structured information hierarchy.
- Refined data visualisations.
- Subtle interaction and motion.

Avoid generic AI dashboard styling, excessive gradients, bright neon accents, unnecessary decoration and overly dense layouts.

The platform should feel considered, confident, intelligent and easy to navigate.

### Visual personality

**Premium. Modern. Intelligent. Refined. Editorial. Approachable.**

The design should balance the visual character of an editorial publication with the functionality and precision of a professional business intelligence application.

## 17. Command Centre Colour Palette

The approved starting direction is forest green, warm ivory, charcoal, stone and eucalyptus.

### Primary brand colours

| Colour | Hex | Application |
|---|---|---|
| Deep Forest | #183C35 | Primary brand colour |
| Warm Ivory | #F4F1E9 | Main light background |
| Muted Eucalyptus | #A6B5A2 | Secondary brand accent |
| Charcoal | #252B29 | Typography and dark surfaces |
| Soft Stone | #D9D2C4 | Borders and neutral surfaces |
| Deep Sage | #718777 | Secondary accent and selected states |

These are initial design tokens. Final contrast combinations must be validated before implementation.

### Colour usage

**Deep Forest**
- Primary navigation accents.
- Primary buttons.
- Selected navigation states.
- Key brand elements.
- Important visual emphasis.

**Warm Ivory**
- Main light-mode application background.
- Editorial surfaces.
- Selected content areas.

**Muted Eucalyptus**
- Secondary buttons and accents.
- Supporting highlights.
- Selected indicators.
- Visual distinction between content groups.

**Charcoal**
- Primary text.
- Dark-mode surfaces.
- Strong visual hierarchy.

**Soft Stone**
- Dividers.
- Borders.
- Neutral backgrounds.
- Supporting UI elements.

**Deep Sage**
- Secondary accents.
- Subtle chart series.
- Supporting visual indicators.

### Colour usage rules

- Forest green should anchor the visual identity.
- Ivory should create a warm, premium foundation.
- Eucalyptus should be used with restraint.
- Avoid using every colour at equal intensity.
- Maintain strong text and background contrast.
- Never use colour alone to communicate important status information.

## 18. Light and Dark Modes

Both modes are mandatory.

**Light mode is the default experience.**

Light mode:
- Warm ivory application background.
- White or subtly warm content surfaces.
- Forest green navigation and key actions.
- Charcoal typography.
- Stone borders.
- Eucalyptus supporting accents.

Dark mode:
- Deep charcoal and forest-inspired backgrounds.
- Slightly lighter charcoal surfaces.
- Warm off-white typography.
- Muted eucalyptus accents.
- Carefully controlled contrast.

Dark mode must be designed independently rather than simply inverting light-mode colours.

User preference should persist across sessions, with an option to follow the device setting.

## 19. Typography System

Proposed typography:

| Application | Typeface |
|---|---|
| Headings | Space Grotesk |
| Body text | Inter |
| Data and technical information | Geist Mono |

### Typography principles

- Strong but restrained headings.
- Clear information hierarchy.
- Readable body text.
- Compact, legible data tables.
- Consistent numeric formatting.
- Clear distinction between titles, metadata and supporting information.

Avoid excessive font sizes and decorative typography within operational interfaces.

Typography must remain accessible and responsive.

## 20. Layout and Interface Design

The application should use a consistent layout system.

### Application shell

- Refined left-hand navigation.
- Organisation and workspace selector.
- Brand selector where applicable.
- Main content area.
- Contextual page actions.
- Global search.
- Notification access.
- User profile and settings.

Navigation should support collapsed and expanded states.

### Dashboard design

Dashboards should use:
- Structured KPI cards.
- Clear information hierarchy.
- Consistent spacing.
- Modular content sections.
- Clean charts.
- Contextual recommendations.
- Useful empty states.

Avoid excessive card usage or unnecessary decorative containers.

### Component design

Develop a reusable component library covering:

- Buttons.
- Inputs.
- Dropdowns.
- Navigation.
- Cards.
- Tables.
- Charts.
- Status indicators.
- Badges.
- Modals.
- Side panels.
- Forms.
- Date selectors.
- Filters.
- Approval components.
- Notifications.
- Progress indicators.
- Empty states.
- Loading states.
- Error states.

All components must support light and dark themes.

## 21. Data Visualisation

Data visualisations are a core part of Command Centre.

Charts must be:
- Clean.
- Readable.
- Consistent.
- Accessible.
- Responsive.
- Clearly labelled.

Use the brand palette as the foundation, with additional accessible categorical colours where required.

Support:
- Line charts.
- Bar charts.
- Stacked charts.
- Trend indicators.
- Progress charts.
- Comparison charts.
- KPI summaries.

Charts must include appropriate labels, legends, units, dates and tooltips.

Do not use colour as the only way to distinguish data.

## 22. Product Ecosystem Design Language

Command Centre, Findable and Reel Deal must have distinct identities while sharing a common design system.

### Shared foundations

All three products should share:
- Typography principles.
- Spacing system.
- Grid and layout foundations.
- Component behaviour.
- Form design.
- Accessibility standards.
- Interaction patterns.
- Iconography principles.
- Responsive behaviour.
- Design token architecture.

### Individual identities

**Command Centre**
- Forest green.
- Warm ivory.
- Eucalyptus.
- Premium editorial styling.
- Intelligence and business growth positioning.

**Findable**
- Retain its own established brand identity.
- Use shared typography, spacing, components and accessibility standards.
- Maintain its own distinctive product character.

**Reel Deal**
- Retain its own established brand identity.
- Use shared typography, spacing, components and accessibility standards.
- Maintain its own distinctive creative and video-production character.

Do not force Findable or Reel Deal to adopt the Command Centre colour palette.

The three products should feel like members of the same family, not duplicate applications.

## 23. Design System and Component Governance

Create a central design token architecture.

Tokens must cover:

- Brand colours.
- Semantic colours.
- Light and dark themes.
- Typography.
- Font weights.
- Font sizes.
- Spacing.
- Borders.
- Radius.
- Shadows.
- Elevation.
- Focus states.
- Interactive states.
- Motion.
- Chart colours.

The shared foundation should support product-specific themes.

This allows updates to shared components without forcing all three products to adopt identical visual identities.

## 24. Accessibility and Responsive Design

Target WCAG 2.2 AA.

Requirements:
- Appropriate colour contrast.
- Keyboard navigation.
- Visible focus states.
- Accessible forms.
- Screen-reader support.
- Clear error messaging.
- Responsive layouts.
- Accessible data visualisations.
- Reduced-motion support.

The application must work across desktop, tablet and mobile.

Desktop should be the primary experience for complex business management, with mobile optimised for reviewing dashboards, approvals, tasks and notifications.

## 25. Interaction and Motion

Use subtle and purposeful interaction.

Examples:
- Smooth navigation transitions.
- Refined hover states.
- Clear selection feedback.
- Contextual side panels.
- Subtle loading animations.
- Responsive dashboard interactions.

Avoid excessive animation, distracting transitions and unnecessary visual effects.

The interface should feel fast and precise.

---

# PART FOUR — TECHNICAL ARCHITECTURE

## 26. Recommended Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Database | Supabase / PostgreSQL |
| Authentication | Supabase Auth |
| Storage | Cloudflare R2 or equivalent |
| AI | Claude initially |
| Orchestration | Central agent and workflow service |
| Background jobs | Scheduled and event-driven processing |
| Hosting | Vercel |
| Integrations | API and connector framework |

## 27. Technical Requirements

- Multi-tenant database.
- Database-level tenant isolation.
- Row-level security.
- Role-based permissions.
- Secure authentication.
- API authorisation.
- Shared integration framework.
- AI service layer.
- Background job processing.
- Real-time updates where appropriate.
- Version history.
- Audit logging.
- Backups and recovery.
- Data export and deletion.
- Monitoring and error reporting.
- Usage metering.

### AI infrastructure

The Outside In must manage AI infrastructure and provider credentials.

Support:
- Central model management.
- Customer-level usage tracking.
- Usage limits.
- Cost monitoring.
- Agent orchestration.
- Knowledge retrieval.
- Permission-aware context.
- Execution history.
- Additional model providers.

## 28. Security and Privacy

Production requirements:

- Secure authentication.
- Organisation-level isolation.
- Role and permission management.
- Encryption in transit and at rest.
- Audit history.
- Backup and recovery.
- Data retention.
- Customer privacy controls.
- Data export and deletion.
- AI usage transparency.
- Third-party integration permissions.

---

# PART FIVE — DEVELOPMENT ROADMAP

## 29. Phase 1 – Core Command Centre

- Multi-tenant architecture.
- Authentication.
- Organisation management.
- Workspace and brand management.
- Onboarding.
- Business profiles.
- Knowledge hub foundation.
- Home dashboard.
- Strategy and growth.
- Projects and tasks.
- Team management.
- Permissions.
- Basic reporting.
- Core design system.
- Light and dark themes.

## 30. Phase 2 – AI Intelligence and Workforce

- AI service architecture.
- Strategy assistant.
- Chief of Staff.
- Specialist agent templates.
- Agent management.
- Agent schedules.
- Agent collaboration.
- Intelligence register.
- Recommendations.
- Approval centre.
- Usage tracking.

## 31. Phase 3 – Connected Product Ecosystem

- Findable integration.
- Reel Deal integration.
- Shared business and brand context.
- Cross-product intelligence.
- Shared content workflows.
- Product status synchronisation.
- Unified performance reporting.
- Subscription entitlements.

## 32. Phase 4 – Commercial Scale

- Subscription and billing.
- Usage metering.
- Agency and client management.
- Advanced permissions.
- Advanced reporting.
- Forecasting.
- Additional integrations.
- White-label capabilities.
- Advanced workflow automation.
- Customer administration and support.

---

# PART SIX — ACCEPTANCE CRITERIA

## 33. Product Acceptance

The platform must support:

- Independent customer organisations.
- Single and multi-brand structures.
- Secure user management.
- Editable business profiles.
- Strategic planning.
- Objectives and KPIs.
- Projects and tasks.
- Connected intelligence records.
- Performance reporting.
- Agent configuration.
- Agent execution history.
- Findable integration.
- Reel Deal integration.
- Subscription entitlements.

## 34. Design Acceptance

The design system must:

- Implement the approved premium editorial direction.
- Use forest green, warm ivory, charcoal and eucalyptus as its core palette.
- Provide light and dark modes.
- Default to light mode.
- Support distinct product identities.
- Use shared design foundations.
- Provide reusable components.
- Meet WCAG 2.2 AA accessibility requirements.
- Support desktop, tablet and mobile.
- Maintain consistent visual hierarchy.
- Provide accessible data visualisations.
- Include loading, error, empty and success states.

## 35. Technical Acceptance

- Tenant isolation is tested.
- Permissions are enforced at database and API level.
- AI agents respect permissions.
- Concurrent edits are handled safely.
- Integrations have error handling.
- Audit records are generated.
- Backups are tested.
- Automated tests cover critical workflows.
- Security and performance testing is completed.

---

# PART SEVEN — PRODUCT DIRECTION

## 36. Final Product Definition

Command Centre is the central intelligence and orchestration platform within The Outside In ecosystem.

It helps businesses:

**Understand** – Their business, customers, market, competitors and performance.

**Plan** – Their strategy, objectives, marketing and growth priorities.

**Coordinate** – Their people, projects, tasks, campaigns and connected products.

**Execute** – Through their team, AI workforce, Findable and Reel Deal.

**Measure** – Their results, performance, progress and return on investment.

**Improve** – Through intelligence, results and ongoing recommendations.

### The Outside In

**An intelligent growth ecosystem.**

Command Centre thinks and coordinates.

Findable improves discoverability.

Reel Deal powers creative production.

Together, they provide businesses with the intelligence and tools to understand, plan, execute and grow.

---

# PART EIGHT — IMPLEMENTATION INSTRUCTIONS

## 37. Master Development Instruction

Use this document as the master product requirements, architecture and design system reference.

Do not simply reproduce the Te Puia pilot.

Before implementation, produce:

1. Validated technical specification.
2. Database schema and entity relationships.
3. Multi-tenant architecture.
4. User journeys and screen specifications.
5. Module-by-module functional requirements.
6. Shared authentication and permission model.
7. Findable and Reel Deal API contracts.
8. AI orchestration architecture.
9. Design token and component specifications.
10. Subscription and billing architecture.
11. Development milestones.
12. Testing and acceptance criteria.

Preserve the product boundaries between Command Centre, Findable and Reel Deal.

Do not duplicate specialist functionality.

Do not begin by building a collection of disconnected screens. Establish the architecture, data relationships, design system and shared foundations first.

All functionality must be designed for commercial use, multiple customer organisations and future product expansion.

The final implementation must deliver a cohesive, premium and accessible user experience consistent with The Outside In's product ecosystem.
