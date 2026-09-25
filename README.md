# Post Deployment Code Sync Tool 🚀

An automated GitHub branch synchronization and back-merge tool built with **React 19**, **TypeScript**, and **Vite**. 

This application automates the post-deployment workflow: creating an intermediate sync branch from your target source branch, merging the latest changes from your deployed release branch into it, and opening a pre-configured, self-assigned, and labeled Pull Request targeting your source branch.

---

## 📑 Table of Contents

- [Why Post Deployment Code Sync?](#-why-post-deployment-code-sync)
- [Key Features](#-key-features)
- [Process Flow Diagram](#-process-flow-diagram)
- [Detailed Step-by-Step Workflow](#-detailed-step-by-step-workflow)
- [Edge Cases & Smart Modal Confirmations](#-edge-cases--smart-modal-confirmations)
  - [1. Branch Already Exists](#1-branch-already-exists-confirmation)
  - [2. Open Pull Request Exists](#2-open-pull-request-exists-error)
  - [3. Merged Pull Request Exists](#3-merged-pull-request-exists-confirmation)
  - [4. Closed Pull Request Exists](#4-closed-pull-request-exists-confirmation)
  - [5. Merge Conflict Resolution](#5-merge-conflict-detection-http-409)
- [Prerequisites](#-prerequisites)
- [Getting Started & Installation](#-getting-started--installation)
- [Configuration (.env)](#-configuration-env)
- [How to Use the Application](#-how-to-use-the-application)
- [Project Architecture](#-project-architecture)
- [Available Scripts](#-available-scripts)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 💡 Why Post Deployment Code Sync?

After deploying code from a release branch (e.g. `release/v2.5.0` or `staging`) to production, those release-specific hotfixes, configurations, or cherry-picks often need to be merged back into the base branch (`main` or `develop`).

Directly merging into `main` can:
- ❌ Bypass branch protection rules and CI/CD validation.
- ❌ Introduce silent merge conflicts without peer review.
- ❌ Result in missing audit trails or unlinked tickets.

**Post Deployment Code Sync solves this by:**
1. Isolating the merge into a dedicated intermediate sync branch (`sync/release-into-main-...`).
2. Merging the release branch into that intermediate branch.
3. Opening a formal Pull Request from the sync branch into the target source branch.
4. Self-assigning the PR to you and labeling with `test_deployment_tool`.

---

## ✨ Key Features

- **Automated 4-Step Pipeline**:
  - Step 1: Upfront branch check & creation from source.
  - Step 2: Merge release branch into sync branch.
  - Step 3: Open PR, self-assign, and apply label.
  - Step 4: Return instant clickable PR link with one-click copy.

- **Automated PR Enrichment**:
  - **Self-Assignment**: Automatically assigns the created Pull Request to your authenticated GitHub account.
  - **Auto-Labeling**: Automatically adds the `test_deployment_tool` label to the PR.
- **Intelligent Branch & PR State Confirmations**:
  - **Branch Exists**: Shows a detailed confirmation modal to either proceed with the existing branch or abort.
  - **Open PR Exists**: Displays an error modal with PR details and a single **"Okay"** button that halts the flow safely.
  - **Merged PR Exists**: Prompts user confirmation before deciding to open a new PR.
  - **Closed PR Exists**: Prompts user confirmation before proceeding with the sync.
- **Zero-Friction GitHub Authentication via `.env`**:
  - Reads your GitHub Personal Access Token (PAT) directly from `VITE_GIT_TOKEN` in `.env`.
  - Automatically validates token scopes and displays user profile information.
- **Searchable Dropdowns & Smart Suggestions**:
  - Live search filters for repositories and branches.
  - Auto-selects default branches (`main`/`master`) and detected release branches (`release/*`, `staging`).
  - Auto-generates unique, descriptive sync branch names.
- **Real-Time Execution Timeline & Terminal Console**:
  - Live progress indicators for each step with precise millisecond timings.
  - Embedded collapsible terminal console with color-coded system logs.

---

## 📊 Process Flow Diagram

```text
               +-----------------------------------+
               |  Fill Form: Repo, Source Branch,  |
               |   Release Branch, Sync Name, etc. |
               +-----------------+-----------------+
                                 |
                                 v
               +-----------------------------------+
               |  Check if New Branch Exists       |
               +-----------------+-----------------+
                                 |
                 +---------------+---------------+
                 |                               |
          [Branch Exists]              [Branch Does Not Exist]
                 |                               |
                 v                               v
   +---------------------------+    +---------------------------+
   | Branch Exists Modal       |    | Resolve Source SHA &      |
   | - Proceed with existing   |    | Create New Branch on Git  |
   | - Stop Workflow           |    +-------------+-------------+
   +-------------+-------------+                  |
                 | (if Proceed)                   |
                 +---------------+----------------+
                                 |
                                 v
               +-----------------------------------+
               | Merge Release Branch into Sync    |
               | Branch via GitHub Merges API      |
               +-----------------+-----------------+
                                 |
                 +---------------+---------------+
                 |                               |
          [Clean / Up-to-Date]           [Merge Conflict 409]
                 |                               |
                 |                     Mark Step 2 Warning &
                 |                     Log Conflict Resolution
                 +---------------+---------------+
                                 |
                                 v
               +-----------------------------------+
               | Check Existing PRs for Branches   |
               +-----------------+-----------------+
                                 |
        +------------------------+------------------------+
        |                        |                        |
    [Open PR]               [Merged PR]              [Closed PR]
        |                        |                        |
        v                        v                        v
+---------------+        +---------------+        +---------------+
| Error Modal:  |        | Modal: Merged |        | Modal: Closed |
| Single 'Okay' |        | PR Detected.  |        | PR Detected.  |
| Stop Flow     |        | Proceed?      |        | Proceed?      |
+---------------+        +-------+-------+        +-------+-------+
                                 |                        |
                        (if Proceed)             (if Proceed)
                                 +-----------+------------+
                                             |
                                             v
               +-----------------------------------+
               | 1. Create Pull Request (POST /pulls)
               | 2. Self-Assign to User             |
               | 3. Add Label 'test_deployment_tool'|
               +-----------------+-----------------+
                                 |
                                 v
               +-----------------------------------+
               | Display PR Result Card & Link     |
               +-----------------------------------+
```

---

## 🔄 Detailed Step-by-Step Workflow

### 1. Form Submission & Input Gathering
The user provides:
1. **Repository**: Selected from searchable dropdown (dynamically fetched from GitHub).
2. **Source Branch (Target)**: The base branch you want to merge into (e.g. `main` or `master`).
3. **Release Branch**: The deployed branch containing new commits (e.g. `release/v2.1.0`).
4. **New Branch Name**: The intermediate branch name (auto-generated or custom).
5. **Advanced PR Options** *(Optional)*: Custom PR title, custom description body, and Draft toggle.

### 2. Step 1: Branch Verification & Creation
- Calls `githubApi.checkBranchExists(token, owner, repo, newBranchName)`.
- If the branch does not exist:
  - Fetches the latest commit SHA of the `Source Branch` (`GET /repos/{owner}/{repo}/git/ref/heads/{sourceBranch}`).
  - Creates the new branch pointing to that SHA (`POST /repos/{owner}/{repo}/git/refs`).
- If the branch exists, triggers the **Branch Already Exists Modal** (see below).

### 3. Step 2: Merge Release into New Branch
- Initiates GitHub merge (`POST /repos/{owner}/{repo}/merges`):
  - `base`: `newBranchName`
  - `head`: `releaseBranch`
- Status handling:
  - **201 Created**: Clean merge commit created.
  - **204 No Content**: Sync branch is already up-to-date with the release branch.
  - **409 Conflict**: Merge conflict detected; logged with instructions to resolve locally, while continuing safely.

### 4. Step 3: PR Status Verification & Creation
- Prior to creating a new PR, checks existing PRs across all states (`state=all`):
  - Checks for **Open PRs**, **Merged PRs**, and **Closed PRs** (see [Edge Cases](#-edge-cases--smart-modal-confirmations)).
- When proceeding to create:
  - Formats PR Title: `Sync: Merge '${releaseBranch}' into '${sourceBranch}' via '${newBranchName}'`.
  - Creates PR via `POST /repos/{owner}/{repo}/pulls`.
  - **Self-Assigns**: Assigns PR to authenticated username (`POST /repos/{owner}/{repo}/issues/{prNumber}/assignees`).
  - **Labels PR**: Adds label `test_deployment_tool` (`POST /repos/{owner}/{repo}/issues/{prNumber}/labels`).

### 5. Step 4: Complete & Direct PR Link
- Displays `PRResultCard` with:
  - Direct PR link and PR Number.
  - One-click **Copy PR Link** button.
  - One-click **Open in GitHub** button.
  - Badges for `Self-Assigned` and `test_deployment_tool`.

---

## 🛡️ Edge Cases & Smart Modal Confirmations

### 1. Branch Already Exists Confirmation
If `newBranchName` already exists on GitHub:
- **Modal Title**: *Branch Already Exists on Remote*
- **Information Shown**: Repository name, existing branch name, commit SHA, and direct GitHub link.
- **User Choices**:
  - **Proceed with Existing Branch**: Reuses the branch, proceeds to Step 2 (merging release into it), and opens/updates the PR.
  - **Stop Workflow**: Aborts processing immediately with zero changes made so you can specify a new branch name.

### 2. Open Pull Request Exists (Error)
If an active open PR already exists between `newBranchName` and `sourceBranch`:
- **Modal Title**: *Open Pull Request Already Exists*
- **Information Shown**: Existing PR Number, PR Title, author, and direct GitHub link.
- **Button**: Single **"Okay"** button.
- **Action**: Clicking **"Okay"** closes the popup, halts execution immediately, and **returns to the main screen without taking any further action**.

### 3. Merged Pull Request Exists (Confirmation)
If a previous PR between these branches was already merged:
- **Modal Title**: *Merged Pull Request Detected*
- **Information Shown**: PR Number, title, direct GitHub link, and the date it was merged.
- **Prompt**: *"A merged PR already exists: Do you want to proceed with creating a new pull request?"*
- **User Choices**:
  - **Proceed**: Continues with creating the new Pull Request.
  - **Cancel & Stop**: Stops the workflow safely.

### 4. Closed Pull Request Exists (Confirmation)
If a previous PR between these branches was closed without merging:
- **Modal Title**: *Closed Pull Request Detected*
- **Information Shown**: PR Number, title, direct GitHub link, and closed date.
- **Prompt**: *"There is a PR closed, do you want to proceed?"*
- **User Choices**:
  - **Proceed**: Continues with opening the Pull Request.
  - **Cancel & Stop**: Stops the workflow safely.

### 5. Merge Conflict Detection (HTTP 409)
If merging the release branch into the new sync branch creates conflicts:
- The app highlights Step 2 with a warning state.
- Emits detailed guidance in the live terminal emulator.
- Allows you to resolve the conflict locally via `git merge` and push, without crashing the tool.

---

## 📋 Prerequisites

Before running the application, ensure you have:
1. **Node.js**: `v18.0.0` or higher (recommended: Node 20+).
2. **GitHub Personal Access Token (PAT)**:
   - **Classic Token**: Requires `repo` scope.
   - **Fine-grained Token**: Requires **Read and Write** permissions for:
     - `Contents` (for branch creation and merging)
     - `Pull requests` (for creating PRs and assigning)
     - `Issues` (for adding labels)

---

## 🚀 Getting Started & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Satyaveerjaligama/post-deployment-code-sync-tool.git
   cd post-deployment-tool
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Add your GitHub Personal Access Token:
   ```env
   VITE_GIT_TOKEN=ghp_your_personal_access_token_here
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at: **[http://localhost:5173/](http://localhost:5173/)** (or `http://127.0.0.1:5173/`).

---

## ⚙️ Configuration (.env)

The application automatically reads the token on startup from your environment file:

| Variable | Description | Required | Example |
| :--- | :--- | :--- | :--- |
| `VITE_GIT_TOKEN` | GitHub Personal Access Token (PAT) with `repo` scope | **Yes** | `ghp_xxxxxxxxxxxxxxxxxxxx` |

> 🔒 **Security Note**: Never commit your `.env` file to version control. `.env` is listed in `.gitignore` by default.

---

## 🖥️ How to Use the Application

1. **Verify GitHub Connection**:
   - On application load, your GitHub user avatar and username (`@username`) will appear in the top-right header if `VITE_GIT_TOKEN` is set.
   - Click your profile button to view token status, active scopes, or disconnect.
2. **Select Repository**:
   - Choose a repository from the **1. Repository** searchable dropdown.
   - Private repositories are marked with a yellow lock badge 🔒, and public repositories with a blue globe 🌐.
3. **Select Branches**:
   - **2. Source Branch (Target)**: Select your target branch (e.g. `main`).
   - **3. Release Branch**: Select the deployed release branch (e.g. `release/v2.1.0`).
4. **Review New Branch Name**:
   - The tool suggests a format like `sync/release-v2.1.0-into-main-YYYY-MM-DD-xxxx`.
   - Click the **Suggest** button to refresh the name or customize it manually.
5. **Submit & Monitor**:
   - Click **Submit & Run Post-Deployment Workflow**.
   - Watch real-time execution in the **Execution Timeline** and view live log streams in the **Terminal Console**.
6. **Access Your Pull Request**:
   - Once complete, the **Pull Request Ready** card displays the direct link.
   - Click **Open in GitHub** or **Copy Link**.
   - The PR will already have you self-assigned and include the `test_deployment_tool` label.

---

## 🏗️ Project Architecture

```text
post-deployment-tool/
├── .env                  # Local environment file containing VITE_GIT_TOKEN
├── .env.example          # Template environment file
├── index.html            # Entry HTML page
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build tool configuration
└── src/
    ├── App.tsx           # Main application layout and coordinator
    ├── index.css         # Glassmorphic dark design system & CSS variables
    ├── main.tsx          # Application entrypoint
    ├── components/
    │   ├── BranchExistsModal.tsx   # Confirmation modal for existing branches
    │   ├── DeploymentForm.tsx      # Main form with searchable dropdowns & suggestions
    │   ├── ExecutionTimeline.tsx   # Step timeline & live terminal console
    │   ├── Header.tsx              # Top navigation, brand title & user profile
    │   ├── PRExistsModal.tsx       # 3-way modal (Open/Merged/Closed PR handlers)
    │   ├── PRResultCard.tsx        # Success summary card with copyable PR link
    │   ├── SearchableSelect.tsx    # Custom accessible combobox component
    │   ├── TokenModal.tsx          # GitHub authentication status & instructions
    │   └── WorkflowGuideModal.tsx  # Interactive workflow explanation modal
    ├── hooks/
    │   ├── useGitHubAuth.ts        # Manages token, profile, and scopes
    │   └── useGitHubWorkflow.ts    # Orchestrates the 4-step pipeline & modals
    ├── services/
    │   └── githubApi.ts            # GitHub REST API client functions
    └── types/
        └── github.ts               # TypeScript interfaces & domain types
```

---

## 📜 Available Scripts

In the project directory, you can run:

- `npm run dev`: Starts the local Vite development server with Hot Module Replacement (HMR).
- `npm run build`: Runs TypeScript compiler check (`tsc -b`) and bundles production assets with Vite.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs Oxlint for fast code quality checks.

---

## ❓ Troubleshooting & FAQs

#### Q1: "Authentication Failed: Bad credentials"
- **Cause**: The token in `.env` (`VITE_GIT_TOKEN`) is invalid or expired.
- **Fix**: Generate a new token in GitHub Settings > Developer Settings > Personal Access Tokens and update `.env`. Restart the dev server (`npm run dev`).

#### Q2: "Missing 'repo' Scope" warning appears
- **Cause**: Your token was created without full access to repositories.
- **Fix**: When creating your token, check the `repo` scope (or grant Read/Write access to *Contents* and *Pull Requests* for Fine-grained tokens).

#### Q3: "Merge Conflict detected (HTTP 409)"
- **Cause**: The release branch and source branch have diverged with conflicting line edits.
- **Fix**: The tool safely marks Step 2 with a warning. You can checkout the newly created sync branch locally, resolve conflicts via `git merge <release-branch>`, push, and continue.

#### Q4: Why did the flow stop when an Open PR was detected?
- **Cause**: GitHub does not permit duplicate open Pull Requests for the identical head and base branch pair.
- **Fix**: The tool shows the existing PR link and provides an **"Okay"** button to dismiss and review the existing PR or specify a new branch name.
