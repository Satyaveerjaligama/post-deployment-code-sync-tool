import type {
  GitHubBranch,
  GitHubMergeResponse,
  GitHubPullRequest,
  GitHubRepo,
  GitHubUser,
} from '../types/github';

const GITHUB_API_BASE = 'https://api.github.com';

export class GitHubApiError extends Error {
  status: number;
  data: any;
  documentation_url?: string;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.data = data;
    if (data && data.documentation_url) {
      this.documentation_url = data.documentation_url;
    }
  }
}

async function githubFetch<T>(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<{ data: T; headers: Headers; status: number }> {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/vnd.github.v3+json');
  if (token) {
    headers.set('Authorization', `Bearer ${token.trim()}`);
  }
  headers.set('X-GitHub-Api-Version', '2022-11-28');

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const responseHeaders = response.headers;
  const status = response.status;

  if (status === 204) {
    return { data: {} as T, headers: responseHeaders, status };
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let errorMessage = (data && data.message) || `GitHub API request failed with HTTP ${status}`;
    
    // Provide user-friendly descriptions for common GitHub errors
    if (status === 401) {
      errorMessage = 'Bad credentials. Please verify that your GitHub Personal Access Token is valid and not expired.';
    } else if (status === 403) {
      if (responseHeaders.get('x-ratelimit-remaining') === '0') {
        const resetTime = new Date(Number(responseHeaders.get('x-ratelimit-reset')) * 1000).toLocaleTimeString();
        errorMessage = `GitHub API rate limit exceeded. Resets at ${resetTime}.`;
      } else {
        errorMessage = 'Forbidden. Your token may lack required permissions (e.g. "repo" scope) or SSO authorization for this organization.';
      }
    } else if (status === 404) {
      errorMessage = (data && data.message) || 'Resource not found. Check repository or branch name.';
    } else if (status === 409) {
      errorMessage = (data && data.message) || 'Merge conflict. The release branch cannot be cleanly merged automatically.';
    } else if (status === 422) {
      if (data && data.errors && data.errors.length > 0) {
        errorMessage = `${data.message}: ${data.errors.map((e: any) => e.message || e.code).join(', ')}`;
      } else {
        errorMessage = (data && data.message) || 'Validation failed. The requested branch or PR could not be created.';
      }
    }

    throw new GitHubApiError(errorMessage, status, data);
  }

  return { data: data as T, headers: responseHeaders, status };
}

export const githubApi = {
  /**
   * Validate token and fetch user details & OAuth scopes
   */
  async validateToken(token: string): Promise<GitHubUser> {
    const { data, headers } = await githubFetch<GitHubUser>(`${GITHUB_API_BASE}/user`, token);
    const rawScopes = headers.get('x-oauth-scopes');
    const scopes = rawScopes ? rawScopes.split(',').map((s) => s.trim()) : [];
    return {
      ...data,
      scopes,
    };
  },

  /**
   * Fetch authenticated user's repositories (public + private)
   */
  async fetchRepositories(token: string): Promise<GitHubRepo[]> {
    const repos: GitHubRepo[] = [];
    let page = 1;
    const perPage = 100;

    while (page <= 2) {
      const url = `${GITHUB_API_BASE}/user/repos?sort=updated&per_page=${perPage}&page=${page}&affiliation=owner,collaborator,organization_member`;
      const { data } = await githubFetch<GitHubRepo[]>(url, token);
      if (!data || data.length === 0) break;
      repos.push(...data);
      if (data.length < perPage) break;
      page++;
    }

    return repos;
  },

  /**
   * Fetch a specific repository by full_name (owner/repo)
   */
  async fetchRepository(token: string, owner: string, repo: string): Promise<GitHubRepo> {
    const { data } = await githubFetch<GitHubRepo>(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, token);
    return data;
  },

  /**
   * Fetch branches for a repository
   */
  async fetchBranches(token: string, owner: string, repo: string): Promise<GitHubBranch[]> {
    const branches: GitHubBranch[] = [];
    let page = 1;
    const perPage = 100;

    while (page <= 3) {
      const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/branches?per_page=${perPage}&page=${page}`;
      const { data } = await githubFetch<GitHubBranch[]>(url, token);
      if (!data || data.length === 0) break;
      branches.push(...data);
      if (data.length < perPage) break;
      page++;
    }

    return branches;
  },

  /**
   * Get reference SHA for a specific branch
   */
  async getBranchSha(token: string, owner: string, repo: string, branchName: string): Promise<string> {
    const { data } = await githubFetch<{ object: { sha: string } }>(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branchName)}`,
      token
    );
    return data.object.sha;
  },

  /**
   * Check if a branch reference already exists in the repository
   */
  async checkBranchExists(
    token: string,
    owner: string,
    repo: string,
    branchName: string
  ): Promise<{ exists: boolean; sha?: string }> {
    try {
      const sha = await this.getBranchSha(token, owner, repo, branchName);
      return { exists: true, sha };
    } catch (err: any) {
      if (err.status === 404) {
        return { exists: false };
      }
      return { exists: false };
    }
  },


  /**
   * Step 1: Create a new branch from a specific commit SHA
   */
  async createBranch(
    token: string,
    owner: string,
    repo: string,
    newBranchName: string,
    fromSha: string
  ): Promise<{ ref: string; sha: string; url: string }> {
    const { data } = await githubFetch<any>(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${newBranchName}`,
          sha: fromSha,
        }),
      }
    );

    return {
      ref: data.ref,
      sha: data.object?.sha || fromSha,
      url: data.url,
    };
  },

  /**
   * Step 2: Merge release branch into the new branch
   */
  async mergeBranch(
    token: string,
    owner: string,
    repo: string,
    baseBranch: string,
    headBranch: string,
    commitMessage?: string
  ): Promise<{ status: 'merged' | 'already_up_to_date'; data: GitHubMergeResponse | null }> {
    const message =
      commitMessage ||
      `Merge branch '${headBranch}' into '${baseBranch}' (Post-Deployment Sync)`;

    const result = await githubFetch<GitHubMergeResponse>(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/merges`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          base: baseBranch,
          head: headBranch,
          commit_message: message,
        }),
      }
    );

    if (result.status === 204) {
      return { status: 'already_up_to_date', data: null };
    }

    return { status: 'merged', data: result.data };
  },

  /**
   * Check if a Pull Request already exists for the given head and base branches
   */
  async findExistingPullRequest(
    token: string,
    owner: string,
    repo: string,
    headBranch: string,
    baseBranch: string
  ): Promise<GitHubPullRequest | null> {
    try {
      let prs: GitHubPullRequest[] = [];
      const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?head=${encodeURIComponent(`${owner}:${headBranch}`)}&base=${encodeURIComponent(baseBranch)}&state=all&sort=updated&direction=desc`;
      const { data } = await githubFetch<GitHubPullRequest[]>(url, token);
      if (data && data.length > 0) {
        prs = data;
      } else {
        const fallbackUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?head=${encodeURIComponent(headBranch)}&base=${encodeURIComponent(baseBranch)}&state=all&sort=updated&direction=desc`;
        const fallbackRes = await githubFetch<GitHubPullRequest[]>(fallbackUrl, token);
        if (fallbackRes.data && fallbackRes.data.length > 0) {
          prs = fallbackRes.data;
        }
      }

      if (prs.length === 0) return null;

      // Priority: 1. open PR, 2. merged PR, 3. closed unmerged PR
      const openPR = prs.find((p) => p.state === 'open');
      if (openPR) return openPR;

      const mergedPR = prs.find((p) => p.state === 'closed' && p.merged_at);
      if (mergedPR) return mergedPR;

      return prs[0];
    } catch {
      return null;
    }
  },


  /**
   * Step 3: Create Pull Request from new branch back into source branch
   */

  async createPullRequest(
    token: string,
    owner: string,
    repo: string,
    params: {
      title: string;
      head: string;
      base: string;
      body: string;
      draft?: boolean;
    }
  ): Promise<GitHubPullRequest> {
    const { data } = await githubFetch<GitHubPullRequest>(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          title: params.title,
          head: params.head,
          base: params.base,
          body: params.body,
          draft: params.draft || false,
        }),
      }
    );

    return data;
  },

  /**
   * Self-assign pull request (issue) to users
   */
  async addAssignees(
    token: string,
    owner: string,
    repo: string,
    issueNumber: number,
    assignees: string[]
  ): Promise<any> {
    const { data } = await githubFetch<any>(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}/assignees`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          assignees,
        }),
      }
    );
    return data;
  },

  /**
   * Add labels to a pull request (issue)
   */
  async addLabels(
    token: string,
    owner: string,
    repo: string,
    issueNumber: number,
    labels: string[]
  ): Promise<any> {
    const { data } = await githubFetch<any>(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}/labels`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          labels,
        }),
      }
    );
    return data;
  },
};

