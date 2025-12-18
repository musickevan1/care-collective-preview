# Messaging Platform Rebuild – Claude Code Subagent Plan

This document decomposes the messaging platform rebuild into delegable units for Claude Code subagents. Each phase includes context, objectives, dependencies, deliverables, and a ready-to-send prompt tailored for the subagent responsible for that phase. When delegating, prepend any phase-specific updates or decisions to the provided prompt.

---

## Phase 1 – Forensic Discovery & Alignment

**Goal:** Establish an authoritative understanding of the currently deployed messaging system, including schema drift, RLS policies, API usage, and telemetry. The outcome should be a verified snapshot of the production/staging state and a dependency matrix for downstream work.

**Inputs & References:**
- Supabase production and staging instances.
- Repository migrations under `supabase/migrations/`.
- Messaging-related code paths (`app/api/messaging/`, `components/messaging/`, `lib/messaging/`).
- Historical debugging docs (`DEBUG_MESSAGING_500_ERROR.md`, `MESSAGING_FIX_SESSION_OCT27_SUMMARY.md`).

**Key Tasks:**
1. Pull Supabase logs (API, auth, database) covering messaging tables and correlate error patterns, especially circular RLS failures.
2. Run `supabase db pull` or `supabase db diff` against production and staging to detect schema/policy drift relative to the repo.
3. Trace all application code paths that interact with messaging, documenting execution environment (edge/server/client), auth context, and credentials.
4. Compile an inventory of external dependencies (moderation RPCs, verification gating, analytics events) tied to messaging flows.

**Deliverables:**
- Annotated log summary highlighting recurring failure modes.
- Schema/policy diff report with prioritized remediation notes.
- Sequence diagrams or tables mapping request flow per messaging action.
- Dependency matrix outlining integrations to carry through the rebuild.

**Subagent Prompt:**
> You are assisting with Phase 1 (Forensic Discovery & Alignment) of the messaging platform rebuild. Produce a forensic dossier that establishes the real-world state of the messaging system. Follow these steps:
> 1. Collect Supabase API/auth/database logs for the messaging tables and document recurring error signatures, request IDs, and timestamps.
> 2. Compare live schemas/policies to the repo migrations using `supabase db pull`/`supabase db diff`, calling out drift and hypothesized causes.
> 3. Trace every server, edge, and client code path interacting with messaging modules and specify runtime context, credentials, and dependent modules.
> 4. Identify auxiliary dependencies (moderation RPCs, verification, analytics) and describe their contract with messaging.
> Output a markdown report with sections for Logs, Schema Drift, Code Path Mapping, and Dependency Inventory. End with open questions or data gaps that need product/infra confirmation.

---

## Phase 2 – Database Redesign & Migration Plan

**Goal:** Define a resilient database schema and RLS policy architecture that avoids recursive dependencies, clarifies ownership, and is migration-ready.

**Prerequisites:** Completed Phase 1 dossier.

**Key Tasks:**
1. Model essential domain entities (conversations, participants, messages, preferences, audit events) with minimal coupling.
2. Draft forward and backward migrations in `supabase/migrations/` that reflect the new schema and supportive helper functions.
3. Design a versioned RLS strategy, preferring read-only views and service-role RPCs for writes.
4. Prototype the schema in staging with anonymized seed data and validate CRUD flows via SQL tests.

**Deliverables:**
- ER diagram or textual schema specification.
- Proposed migration scripts outline (filenames, operations, dependency order).
- Policy specification document (per table/view/RPC).
- Validation plan covering staging prototyping steps.

**Subagent Prompt:**
> You own Phase 2 (Database Redesign & Migration Plan) for the messaging rebuild. Using the Phase 1 findings, architect a replacement schema and migration approach. Deliver the following in markdown:
> - **Domain Model:** Tables, columns, relationships, and rationale for each entity.
> - **Migration Blueprint:** Ordered list of migration files with summary of operations (create/alter/drop), including reversible down strategies.
> - **RLS & Access Strategy:** Policy definitions per table/view, clarifying which actors (service role, authenticated users) can perform which operations and via which RPCs.
> - **Prototype Validation Plan:** Step-by-step procedure to stand up the schema in staging, seed data, and run SQL smoke tests.
> Highlight how the design eliminates the circular RLS issues observed previously. List assumptions and open questions at the end.

---

## Phase 3 – Server/Service Layer Rebuild

**Goal:** Implement a cohesive server-side messaging service that centralizes Supabase interactions, validation, and error handling for all messaging workflows.

**Prerequisites:** Approved schema/RLS plan from Phase 2.

**Key Tasks:**
1. Design a `lib/messaging/service.ts` module encapsulating service-role Supabase access and domain logic (conversation lifecycle, moderation checks, duplicate detection).
2. Refactor API routes under `app/api/messaging/` to depend on the service module with consistent error translation and runtime compatibility (edge vs server).
3. Replace ad-hoc fallbacks with structured feature flags or preflight checks.
4. Document the service contract, including DTOs, error codes, and side effects.

**Deliverables:**
- Module architecture plan with function signatures and control flow diagrams.
- API route refactor map enumerating required changes per endpoint.
- Error handling/observability strategy (logging, metrics, alerts).
- Service contract document for internal consumers.

**Subagent Prompt:**
> Phase 3 is yours: design the server/service layer rebuild for messaging. Produce a detailed implementation blueprint covering:
> 1. **Service Module Design:** Proposed folder/file structure, TypeScript interfaces, method signatures, and how Supabase service-role clients are managed.
> 2. **API Refactor Plan:** For each endpoint in `app/api/messaging/`, describe the new call flow, dependencies on the service module, and runtime considerations (edge/server, caching, rate limits).
> 3. **Error & Observability Strategy:** Define how errors are categorized, logged, surfaced to clients, and monitored; include metrics and tracing hooks.
> 4. **Service Contract:** Document the DTOs, validation rules, and error codes exposed to front-end or other services.
> Ensure the plan addresses the failure modes uncovered earlier (circular RLS errors, fail-open fallbacks). Conclude with a readiness checklist to confirm before coding begins.

---

## Phase 4 – Front-End Integration & UX Hardening

**Goal:** Adapt the React application to consume the rebuilt messaging APIs, removing direct Supabase access from client components and improving UX resilience.

**Prerequisites:** Server/service layer blueprint from Phase 3.

**Key Tasks:**
1. Update `app/messages/page.tsx` to fetch data via server-side methods/API endpoints, providing serialized props to UI components.
2. Refactor `components/messaging/` (e.g., `MessagingDashboard`, `MessageInput`, `ConversationList`) to rely on server-provided DTOs and handle loading/error states.
3. Replace or wrap real-time subscriptions with abstractions supplied by the new service layer.
4. Align UX copy, analytics, and state management with the revised backend contract.

**Deliverables:**
- Component refactor map detailing required code changes and their sequencing.
- State management strategy (server components, React Query, Zustand, etc.) aligned with new data flow.
- UX resilience plan covering optimistic updates, error toasts, offline handling.
- Analytics/telemetry adjustment checklist.

**Subagent Prompt:**
> You are responsible for Phase 4 (Front-End Integration & UX Hardening). Draft a comprehensive plan that:
> - Audits current messaging-related pages/components and identifies direct Supabase usage to be removed.
> - Specifies how data flows will transition to the new API/service layer (include SSR/ISR considerations, caching strategies, and state management choices).
> - Details component-level refactors, including props, hooks, and UI states (loading, empty, error, optimistic updates).
> - Outlines how real-time updates will be handled post-refactor and how analytics/telemetry events will be preserved or updated.
> Present the plan in markdown with sections for Component Inventory, Data Flow Strategy, UX Resilience, Real-Time & Analytics, and Risks/Mitigations.

---

## Phase 5 – Data Migration, Testing, and Rollout

**Goal:** Safely migrate existing messaging data into the new schema, ensure coverage through testing, and plan a controlled rollout with monitoring and rollback paths.

**Prerequisites:** Completion of Phases 1–4 planning artifacts.

**Key Tasks:**
1. Design migration scripts for data backfill, validation queries, and rollback procedures.
2. Expand automated test coverage (unit, integration, end-to-end) reflecting new service contracts and known failure modes.
3. Prepare monitoring dashboards and alert thresholds for Supabase, API, and front-end telemetry.
4. Define rollout plan with feature flags/cohorts, success metrics, and communication strategy.

**Deliverables:**
- Data migration playbook (scripts outline, verification steps, rollback triggers).
- Testing matrix mapping scenarios to test types and tools.
- Monitoring/alerting setup plan (dashboards, metrics, owners).
- Deployment & rollback runbook with timeline and responsibilities.

**Subagent Prompt:**
> Lead Phase 5 (Data Migration, Testing, and Rollout). Produce a markdown playbook containing:
> 1. **Data Migration Strategy:** Step-by-step migration workflow, including scripts to run (with filenames/locations), validation queries, and rollback mechanics.
> 2. **Testing Matrix:** Enumerate required unit, integration, and end-to-end tests, mapping them to code areas and failure modes; include tooling and environments.
> 3. **Monitoring & Alerting:** Define dashboards, metrics, log streams, and alert thresholds required before launch.
> 4. **Rollout Plan:** Detail feature flag strategy, cohort rollout, success metrics, communication cadence, and rollback triggers.
> Close with risks, contingencies, and decision points that need stakeholder approval.

---

## Delegation Guidelines

- Always review upstream phase outputs before starting a dependent phase.
- Keep prompts synchronized with the latest discoveries; append phase-specific context when delegating.
- Store completed artifacts in the repository under appropriate directories (`docs/`, `supabase/migrations/`, etc.).
- Encourage subagents to document assumptions and unresolved questions to feed back into coordination sessions.

