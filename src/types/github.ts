export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  html_url: string;
  public_repos: number;
  total_private_repos?: number;
  scopes?: string[];
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  updated_at: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubMergeResponse {
  sha: string;
  node_id: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  merged_at?: string | null;
  closed_at?: string | null;
  draft: boolean;
  user: {
    login: string;
    avatar_url: string;
  };
  body: string | null;
  created_at: string;
  head: {
    ref: string;
    sha: string;
    label: string;
  };
  base: {
    ref: string;
    sha: string;
    label: string;
  };
}


export type StepId = 'create-branch' | 'merge-release' | 'create-pr' | 'complete';

export type StepStatus = 'idle' | 'pending' | 'running' | 'success' | 'warning' | 'error';

export interface WorkflowStep {
  id: StepId;
  title: string;
  description: string;
  status: StepStatus;
  detail?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  data?: any;
}

export interface WorkflowLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error' | 'cmd';
  message: string;
  details?: any;
}

export interface PostDeployFormData {
  repoFullName: string;
  releaseBranch: string;
  sourceBranch: string;
  newBranchName: string;
  prTitle: string;
  prBody: string;
  isDraft: boolean;
}


