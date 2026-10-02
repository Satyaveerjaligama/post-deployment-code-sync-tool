import type { WorkflowStep } from './types/github';

/**
 * GitHub repository for the Post Deployment Code Sync Tool.
 */
export const REPO_URL = 'https://github.com/Satyaveerjaligama/post-deployment-code-sync-tool';

/**
 * GitHub REST API endpoints and versioning.
 */
export const GITHUB_API_BASE = 'https://api.github.com';
export const GITHUB_API_VERSION = '2022-11-28';
export const GITHUB_NEW_TOKEN_URL =
  'https://github.com/settings/tokens/new?scopes=repo&description=post-deployment-code-sync-tool';

/**
 * LocalStorage and Environment variable keys.
 */
export const TOKEN_STORAGE_KEY = 'pdt_github_pat';
export const ENV_GIT_TOKEN =
  (import.meta.env.VITE_GIT_TOKEN as string | undefined)?.trim() || '';


/**
 * Initial state configuration for workflow steps.
 */
export const INITIAL_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'create-branch',
    title: '1. Create New Branch',
    description: 'Fetch source branch SHA and initialize the new branch',
    status: 'idle',
  },
  {
    id: 'merge-release',
    title: '2. Merge Release Branch',
    description: 'Merge release branch changes into the new branch',
    status: 'idle',
  },
  {
    id: 'create-pr',
    title: '3. Create Pull Request',
    description: 'Open PR from new branch back into source branch',
    status: 'idle',
  },
  {
    id: 'complete',
    title: '4. Pull Request Ready',
    description: 'Provide PR link and synchronization details',
    status: 'idle',
  },
];
