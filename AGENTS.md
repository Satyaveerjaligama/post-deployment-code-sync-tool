# AGENTS.md — Developer & AI Agent Guide

> **Target Audience**: AI coding assistants (Gemini, Antigravity, Claude Code, Cursor, Copilot, Aider, etc.) and human developers modifying, maintaining, or extending this repository.
> **Purpose**: Read this document first to understand the architecture, domain logic, workflows, UI components, data structures, and styling conventions without having to inspect all repository files individually.

---

## 1. Executive Summary & Purpose

**Post Deployment Code Sync Tool** is a single-page web application built with **React 19**, **TypeScript**, and **Vite**.

### The Problem It Solves
When a release or hotfix branch (e.g., `release/v2.5.0` or `staging`) is deployed to production, those commits often need to be merged back into the base development branch (`main` or `develop`) to avoid regression. Direct merges into `main`:
1. Bypass branch protection rules, mandatory code reviews, and CI/CD pipelines.
2. Risk silent conflicts and lack formal audit trails.

### The Solution / Core Workflow
This tool automates a 4-step GitHub back-merge workflow:
1. **Creates an intermediate sync branch** (e.g., `sync/release-v2.5.0-into-main-2026-09-28-a1b2`) forked from the latest HEAD commit of the target **Source Branch** (`main`).
2. **Merges the deployed Release Branch** into this new sync branch via the GitHub Merges API.
3. **Opens a formal Pull Request** from the new sync branch back into the target **Source Branch**.
4. **Auto-enriches the PR**:
   - Automatically self-assigns the PR to the authenticated GitHub user.
   - Automatically attaches the `test_deployment_tool` label.
5. **Presents an immediate PR dashboard** with copyable link, status badges, and direct GitHub navigation.

---

## 2. Technology Stack & Environment

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | React 19 (`^19.2.8`) | Modern hooks (`useState`, `useEffect`, `useCallback`, `useRef`). |
| **Language** | TypeScript (`~6.0.2`) | Strict typing, fully typed API responses and workflows. |
| **Build Tool** | Vite (`^8.2.0`) | Fast HMR development and rollup production bundling. |
| **Styling** | Vanilla CSS | **NO TailwindCSS**. Custom glassmorphism dark theme using CSS variables (`src/index.css`). |
| **Icons** | Lucide React (`^1.33.0`) | Consistent stroke-based icon set. |
| **Linter** | Oxlint (`^1.75.0`) | Fast Rust-based linter configured via `.oxlintrc.json`. |
| **API Client** | Native `fetch` | Direct browser-to-GitHub REST API v3 / 2022-11-28 integration. |

### Environment Configuration
- `.env` / `.env.example`:
  - `VITE_GIT_TOKEN`: GitHub Personal Access Token (PAT).
  - Can be a **Classic PAT** with `repo` scope, or a **Fine-Grained PAT** with Read & Write permissions for *Contents*, *Pull requests*, and *Issues*.
  - When present, the app automatically authenticates on load. Users can also enter or switch tokens dynamically via the in-app modal.

---

## 3. Repository Directory Structure

```text
post-deployment-code-sync-tool/
├── .env / .env.example          # Environment variables (VITE_GIT_TOKEN)
├── .oxlintrc.json               # Oxlint linter settings
├── AGENTS.md                    # THIS FILE: Primary context guide for AI assistants
├── README.md                    # Human-facing project overview & user guide
├── index.html                   # HTML entrypoint with viewport & fonts
├── package.json                 # Scripts and package dependencies
├── tsconfig.json                # Project TypeScript root configuration
├── tsconfig.app.json            # Application TS build rules
├── tsconfig.node.json           # Vite / Node environment TS rules
├── vite.config.ts               # Vite configuration (React plugin)
└── src/
    ├── main.tsx                 # React DOM mount entrypoint
    ├── App.tsx                  # Root application coordinator
    ├── App.css                  # Grid layout & responsive breakpoint rules
    ├── index.css                # Global design system, glassmorphic styles, variables
    ├── vite-env.d.ts            # Vite client type definitions
    │
    ├── types/
    │   └── github.ts            # Core TypeScript interfaces & workflow models
    │
    ├── services/
    │   └── githubApi.ts         # GitHub REST API client & HTTP error handler
    │
    ├── hooks/
    │   ├── useGitHubAuth.ts     # Auth state, token storage, scope validation
    │   └── useGitHubWorkflow.ts # 4-step workflow pipeline engine & modal resolvers
    │
    └── components/
        ├── Header.tsx           # Navigation bar, user avatar, token & guide triggers
        ├── DeploymentForm.tsx   # Repo selector, branch pickers, name generator, submit
        ├── SearchableSelect.tsx # Accessible searchable dropdown combobox
        ├── ExecutionTimeline.tsx# 4-step progress stepper & terminal log viewer
        ├── PRResultCard.tsx     # Success card with PR link, badges, copy button
        ├── BranchExistsModal.tsx# Warning modal when sync branch already exists
        ├── PRExistsModal.tsx    # Modal for Open, Merged, or Closed PR scenarios
        ├── TokenModal.tsx       # Modal to manage/inspect GitHub PAT and scopes
        └── WorkflowGuideModal.tsx# Visual guide explaining the sync workflow
```

---

## 4. Key Files & Exact Responsibilities

### `src/types/github.ts`
Defines all core domain interfaces:
- `GitHubUser`: Authenticated user profile (`login`, `avatar_url`, `scopes`, etc.).
- `GitHubRepo`: Repository details (`full_name`, `private`, `default_branch`, etc.).
- `GitHubBranch`: Branch metadata (`name`, commit `sha`, `protected`).
- `GitHubMergeResponse`: Return type for `POST /repos/{owner}/{repo}/merges`.
- `GitHubPullRequest`: PR details (`number`, `title`, `html_url`, `state`, `merged_at`, `closed_at`, `draft`).
- `StepId`: `'create-branch' | 'merge-release' | 'create-pr' | 'complete'`.
- `StepStatus`: `'idle' | 'pending' | 'running' | 'success' | 'warning' | 'error'`.
- `WorkflowStep`: State descriptor for each step in the pipeline.
- `WorkflowLog`: Log message item (`id`, `timestamp`, `level`, `message`, `details`).
- `PostDeployFormData`: Payload passed from form to workflow executor.

### `src/services/githubApi.ts`
All external communication to GitHub REST API (`https://api.github.com`):
- `githubFetch<T>(url, token, options)`: Wrapper handling auth headers, `X-GitHub-Api-Version: 2022-11-28`, HTTP error status codes (401, 403, 404, 409, 422), and rate limits.
- `GitHubApiError`: Custom error class exposing HTTP `status`, raw `data`, and GitHub `documentation_url`.
- Exposed API methods:
  - `validateToken(token)`: Validates PAT and extracts OAuth scopes from `x-oauth-scopes` header.
  - `fetchRepositories(token)`: Fetches user repos across owner, collaborator, and org affiliations (up to 200 repos).
  - `fetchRepository(token, owner, repo)`: Single repo lookup.
  - `fetchBranches(token, owner, repo)`: Fetches branches (up to 300 branches).
  - `getBranchSha(token, owner, repo, branchName)`: Retrieves commit SHA of `refs/heads/{branchName}`.
  - `checkBranchExists(token, owner, repo, branchName)`: Returns `{ exists: boolean, sha?: string }`.
  - `createBranch(token, owner, repo, newBranchName, fromSha)`: `POST /repos/{owner}/{repo}/git/refs`.
  - `mergeBranch(token, owner, repo, baseBranch, headBranch, message)`: `POST /repos/{owner}/{repo}/merges`. Returns 201 (`merged`) or 204 (`already_up_to_date`). Throws 409 on conflict.
  - `findExistingPullRequest(token, owner, repo, headBranch, baseBranch)`: Queries `pulls?state=all` to detect existing open, merged, or closed PRs.
  - `createPullRequest(token, owner, repo, params)`: `POST /repos/{owner}/{repo}/pulls`.
  - `addAssignees(token, owner, repo, issueNumber, assignees)`: `POST /repos/{owner}/{repo}/issues/{issueNumber}/assignees`.
  - `addLabels(token, owner, repo, issueNumber, labels)`: `POST /repos/{owner}/{repo}/issues/{issueNumber}/labels`.

### `src/hooks/useGitHubAuth.ts`
Encapsulates token lifecycle and authentication:
- Initialization order: `VITE_GIT_TOKEN` from env -> `localStorage('pdt_github_pat')` -> empty string.
- Validates token against GitHub `/user` on change.
- Checks if token has required `repo` scope (or fine-grained equivalents).
- Exposes `token`, `user`, `isValidating`, `authError`, `hasRepoScope`, `isEnvToken`, `saveToken(token)`, and `clearToken()`.

### `src/hooks/useGitHubWorkflow.ts`
The workflow orchestrator containing the core business logic:
- Manages `steps: WorkflowStep[]`, `logs: WorkflowLog[]`, `isRunning: boolean`, `createdPR: GitHubPullRequest | null`.
- **Interactive Promise Modals**: Uses Promise resolution handlers (`branchConfirmation`, `prExistsModal`) to pause the asynchronous workflow and wait for explicit user confirmation via dialogs before proceeding or aborting.
- Handles edge cases:
  - Existing branch on remote.
  - Clean merge vs. already-up-to-date vs. merge conflict (HTTP 409).
  - Existing open PR vs. merged PR vs. closed unmerged PR.
  - Automated PR self-assignment and tagging with `test_deployment_tool`.

### `src/App.tsx`
Top-level layout and state bridge:
- Renders `Header`, `DeploymentForm`, `ExecutionTimeline`, `PRResultCard`, and modals.
- Coordinates modal open/close states and binds the auth and workflow hooks together.

### `src/components/DeploymentForm.tsx`
The primary user interaction interface:
- Loads repositories and branches dynamically via `SearchableSelect`.
- Intelligent heuristics:
  - Automatically selects repository default branch (`main` / `master`) as the `sourceBranch`.
  - Scans for branches named `release/*`, `rel/*`, `v*`, or containing `staging` as suggested `releaseBranch`.
  - Generates unique intermediate sync branch names formatted as:
    `sync/{releaseBranch}-into-{sourceBranch}-{YYYY-MM-DD}-{randomHex}`
- Collapsible Advanced Options: custom PR title, custom PR body markdown template, and draft PR toggle.

### Modals (`BranchExistsModal.tsx`, `PRExistsModal.tsx`, `TokenModal.tsx`, `WorkflowGuideModal.tsx`)
- `BranchExistsModal`: Rendered if the intermediate sync branch already exists on GitHub. Offers two options: **"Proceed with existing branch"** or **"Stop workflow"**.
- `PRExistsModal`: Handles 3 critical PR states:
  1. **Open PR already exists**: Displays error information and **only a single "Okay" button**. Clicking "Okay" terminates the workflow cleanly without side effects.
  2. **Merged PR already exists**: Shows prior merge date and prompts user with **"Proceed"** or **"Cancel & Stop"**.
  3. **Closed unmerged PR already exists**: Shows closed date and prompts user with **"Proceed"** or **"Cancel & Stop"**.
- `TokenModal`: Shows GitHub user info, token scope validation status, token input field, and security guidelines.
- `WorkflowGuideModal`: In-app graphical reference explaining the complete synchronization pipeline.

---

## 5. Detailed Step-by-Step Execution Pipeline

```text
[User Submits Form]
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ STEP 1: Branch Verification & Creation                 │
│ 1. GET /repos/{owner}/{repo}/git/ref/heads/{newBranch} │
│                                                        │
│ ├── If Branch Exists:                                  │
│ │   └── Prompt BranchExistsModal:                      │
│ │       ├── User clicks "Stop"    ──> Cancel Workflow  │
│ │       └── User clicks "Proceed" ──> Re-use branch   │
│ └── If Branch Does Not Exist:                          │
│     ├── GET source branch HEAD SHA                     │
│     └── POST /repos/.../git/refs (create new branch)   │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ STEP 2: Merge Release into Intermediate Sync Branch    │
│ POST /repos/{owner}/{repo}/merges                      │
│ base = newBranch, head = releaseBranch                 │
│                                                        │
│ ├── 201 Created: Merge commit created successfully     │
│ ├── 204 No Content: Already up-to-date (no changes)    │
│ └── 409 Conflict: Merge conflict flagged               │
│     └── Mark step Warning, log guide, proceed safely   │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ STEP 3: Verify Existing PR & Open Pull Request         │
│ GET /repos/{owner}/{repo}/pulls?state=all              │
│                                                        │
│ ├── If Open PR Exists:                                 │
│ │   └── PRExistsModal (Single "Okay" button)           │
│ │       └── HALT WORKFLOW (No duplicate PR allowed)    │
│ ├── If Merged PR Exists:                               │
│ │   └── PRExistsModal ("Cancel" vs "Proceed")          │
│ ├── If Closed PR Exists:                               │
│ │   └── PRExistsModal ("Cancel" vs "Proceed")          │
│                                                        │
│ Once clear to create:                                  │
│ 1. POST /repos/{owner}/{repo}/pulls                    │
│ 2. POST /repos/.../issues/{prNum}/assignees (Self)     │
│ 3. POST /repos/.../issues/{prNum}/labels               │
│    (Add label 'test_deployment_tool')                  │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ STEP 4: Completion & PR Result Card                    │
│ - Set createdPR state                                  │
│ - Render PRResultCard with direct URL & copy button    │
│ - Stop runner & log completion                         │
└────────────────────────────────────────────────────────┘
```

---

## 6. Styling & UI Design System Rules

The project uses a bespoke dark glassmorphism aesthetic implemented in `src/index.css` and `src/App.css`.

### Critical Styling Guidelines for AI Assistants:
1. **NEVER inject Tailwind CSS utility classes** into components. The project uses semantic class names and CSS variables.
2. **Key Design Tokens**:
   - Backgrounds:
     - Page background: `var(--bg-primary)` (`#0d1117`) with radial gradient overlays.
     - Glass panels: `var(--bg-card)` (`rgba(22, 27, 34, 0.75)` with `backdrop-filter: blur(12px)`).
     - Input fields: `var(--bg-input)` (`#0d1117`).
   - Accents:
     - Primary: `var(--accent-primary)` (`#6366f1` / indigo) and `var(--accent-secondary)` (`#818cf8`).
     - Success: `var(--accent-success)` (`#2ea043` / GitHub green).
     - Warning: `var(--accent-warning)` (`#d29922` / GitHub amber).
     - Danger: `var(--accent-danger)` (`#f85149` / GitHub red).
     - Purple: `var(--accent-purple)` (`#a371f7`).
   - Borders:
     - Cards: `var(--border-card)` (`rgba(240, 246, 252, 0.1)`).
     - Subtle: `var(--border-subtle)` (`rgba(240, 246, 252, 0.06)`).
3. **Buttons**: Use standard classes:
   - `btn btn-primary` (indigo glow)
   - `btn btn-secondary` (neutral dark)
   - `btn btn-outline` (bordered)
   - `btn btn-danger` (red)
   - `btn btn-warning` (amber)
   - `btn btn-purple` (purple)
   - `btn-sm` (compact size)
4. **Branch Pills**:
   - `branch-pill branch-pill-source` (blue)
   - `branch-pill branch-pill-release` (purple)
   - `branch-pill branch-pill-new` (green)
   - `branch-pill branch-pill-warning` (amber)
   - `branch-pill branch-pill-neutral` (gray)

---

## 7. Crucial Invariants & Guardrails

When modifying any part of this codebase, you **must adhere to these rules**:

1. **Auto-Assignment**: All created Pull Requests must be assigned to the authenticated user (`currentUserLogin`) when available.
2. **Mandatory Label**: All created Pull Requests must have the label `test_deployment_tool` applied.
3. **Open PR Collision Protection**:
   - If an open PR already exists for the head & base pair, **NEVER** attempt to force-create another PR.
   - The user must be presented with the `PRExistsModal` containing **only a single "Okay" button** that closes the modal and terminates the workflow without further action.
4. **Intermediate Sync Branch Naming**:
   - The default generated branch name must follow the pattern:
     `sync/{cleanRel}-into-{cleanSrc}-{YYYY-MM-DD}-{randomHex}`
   - Slashes and backslashes in branch names must be sanitized to hyphens for the generated branch name.
5. **No Token Leakage**:
   - Never log GitHub Personal Access Tokens in plaintext in terminal logs, console logs, or UI elements.
   - Tokens in `.env` are prefixed with `VITE_` (`VITE_GIT_TOKEN`) so Vite makes them available at build time via `import.meta.env.VITE_GIT_TOKEN`.
6. **Graceful Merge Conflict Handling**:
   - HTTP 409 from GitHub merge API is handled non-fatally: Step 2 status is set to `'warning'`, `hasMergeConflict` is set to `true`, and guidance is output to the terminal logs.
7. **Zero Backend Requirement**:
   - This app runs entirely in the browser. Do not introduce server-side Node.js/Express dependencies for GitHub API interactions unless explicitly instructed by the user.

---

## 8. Development & Verification Workflows

```bash
# Start local development server (with HMR)
npm run dev

# Run TypeScript compilation check and Vite production bundle
npm run build

# Run fast code linting via Oxlint
npm run lint

# Preview the built production output locally
npm run preview
```

### Before Committing Changes:
Always run:
1. `npm run lint` — ensures Oxlint reports 0 errors.
2. `npm run build` — ensures `tsc -b` and Vite bundle pass with zero type errors.

---

## 9. Common Error Codes & Troubleshooting Reference

| HTTP Status | Context | Root Cause | Handling Strategy |
| :--- | :--- | :--- | :--- |
| **401 Unauthorized** | Token Validation / API | Token is invalid, expired, or malformed. | Clears user state, presents user-friendly error message, prompts reconnect. |
| **403 Forbidden** | Rate Limit or Scopes | Token lacks `repo` scope, SSO approval missing, or GitHub rate limit reached. | Checks `x-ratelimit-remaining` and surfaces exact reset time or scope deficiency warning. |
| **404 Not Found** | Branch / Repo check | Repository or branch reference does not exist. | Returns `{ exists: false }` cleanly without throwing uncaught exceptions. |
| **409 Conflict** | Merge API | Release branch cannot be automatically merged into sync branch. | Flags Step 2 with `warning`, outputs local resolution instructions, keeps pipeline safe. |
| **422 Unprocessable** | PR Creation | PR already exists or invalid ref specifications. | Checks for existing PR message, opens `PRExistsModal`, halts execution. |
