import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitPullRequest,
  GitMerge,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lock,
  Globe,
  Loader2,
  Send,
  AlertTriangle,
  Tag,
} from 'lucide-react';
import type { GitHubRepo, GitHubBranch, PostDeployFormData } from '../types/github';
import { githubApi } from '../services/githubApi';
import { SearchableSelect } from './SearchableSelect';
import type { SelectOption } from './SearchableSelect';


interface DeploymentFormProps {
  token: string;
  onOpenTokenModal: () => void;
  onSubmit: (data: PostDeployFormData) => void;
  isRunning: boolean;
  initialValues?: Partial<PostDeployFormData>;
}

export const DeploymentForm: React.FC<DeploymentFormProps> = ({
  token,
  onOpenTokenModal,
  onSubmit,
  isRunning,
  initialValues,
}) => {
  // Repositories state
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);

  // Selected values
  const [selectedRepoFullName, setSelectedRepoFullName] = useState<string>(
    initialValues?.repoFullName || ''
  );
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);

  const [releaseBranch, setReleaseBranch] = useState<string>(initialValues?.releaseBranch || '');
  const [sourceBranch, setSourceBranch] = useState<string>(initialValues?.sourceBranch || '');
  const [newBranchName, setNewBranchName] = useState<string>(initialValues?.newBranchName || '');
  const [jiraId, setJiraId] = useState<string>(initialValues?.jiraId || '');

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [prTitle, setPrTitle] = useState<string>(initialValues?.prTitle || '');
  const [prBody, setPrBody] = useState<string>(initialValues?.prBody || '');
  const [isDraft, setIsDraft] = useState<boolean>(initialValues?.isDraft || false);

  // Auto-fetch repos on token change
  const loadRepos = async () => {
    if (!token) return;
    setIsLoadingRepos(true);
    setRepoError(null);
    try {
      const data = await githubApi.fetchRepositories(token);
      setRepos(data);
      if (data.length > 0 && !selectedRepoFullName) {
        setSelectedRepoFullName(data[0].full_name);
      }
    } catch (err: any) {
      setRepoError(err.message || 'Failed to load repositories');
    } finally {
      setIsLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadRepos();
    } else {
      setRepos([]);
      setSelectedRepoFullName('');
      setBranches([]);
    }
  }, [token]);

  // Fetch branches when selected repo changes
  useEffect(() => {
    if (!token || !selectedRepoFullName) {
      setBranches([]);
      return;
    }

    const [owner, repo] = selectedRepoFullName.split('/');
    if (!owner || !repo) return;

    let isMounted = true;
    const loadBranches = async () => {
      setIsLoadingBranches(true);
      setBranchError(null);
      try {
        const branchList = await githubApi.fetchBranches(token, owner, repo);
        if (!isMounted) return;
        setBranches(branchList);

        const currentRepo = repos.find((r) => r.full_name === selectedRepoFullName);
        const defaultBranch = currentRepo?.default_branch || 'main';

        // Auto-select source branch to default branch (main/master)
        if (!sourceBranch || !branchList.some((b) => b.name === sourceBranch)) {
          const matchDefault = branchList.find((b) => b.name === defaultBranch);
          if (matchDefault) {
            setSourceBranch(matchDefault.name);
          } else if (branchList.length > 0) {
            setSourceBranch(branchList[0].name);
          }
        }

        // Auto-select release branch if one looks like a release
        if (!releaseBranch || !branchList.some((b) => b.name === releaseBranch)) {
          const releaseCandidate = branchList.find(
            (b) =>
              b.name !== defaultBranch &&
              (b.name.startsWith('release') ||
                b.name.startsWith('rel/') ||
                b.name.startsWith('v') ||
                b.name.includes('staging'))
          );
          if (releaseCandidate) {
            setReleaseBranch(releaseCandidate.name);
          } else if (branchList.length > 1) {
            const nonDefault = branchList.find((b) => b.name !== defaultBranch);
            if (nonDefault) setReleaseBranch(nonDefault.name);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setBranchError(err.message || 'Failed to fetch branches for repository');
        }
      } finally {
        if (isMounted) setIsLoadingBranches(false);
      }
    };

    loadBranches();

    return () => {
      isMounted = false;
    };
  }, [token, selectedRepoFullName, repos]);

  // Auto-generate suggested new branch name
  const generateSuggestedBranchName = () => {
    const cleanRel = releaseBranch ? releaseBranch.replace(/[\/\\]/g, '-') : 'release';
    const cleanSrc = sourceBranch ? sourceBranch.replace(/[\/\\]/g, '-') : 'main';
    const cleanJira = jiraId ? `${jiraId.trim().toUpperCase().replace(/[\/\\]/g, '-')}-` : '';
    const dateStr = new Date().toISOString().slice(0, 10);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const suggested = `sync/${cleanJira}${cleanRel}-into-${cleanSrc}-${dateStr}-${randomSuffix}`;
    setNewBranchName(suggested);
  };

  // Set default suggestion if empty and branches are chosen
  useEffect(() => {
    if (releaseBranch && sourceBranch && !newBranchName) {
      generateSuggestedBranchName();
    }
  }, [releaseBranch, sourceBranch]);

  // Update default PR title when branches or JIRA ID change
  useEffect(() => {
    if (releaseBranch && sourceBranch && newBranchName) {
      const cleanJira = jiraId.trim().toUpperCase();
      const baseTitle = `Sync: Merge '${releaseBranch}' into '${sourceBranch}' via '${newBranchName}'`;
      const expectedTitle = cleanJira ? `${cleanJira} ${baseTitle}` : baseTitle;

      // Update if prTitle is empty or matches auto-generated pattern
      if (!prTitle || prTitle.includes("Sync: Merge '")) {
        setPrTitle(expectedTitle);
      }
    }
  }, [releaseBranch, sourceBranch, newBranchName, jiraId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      onOpenTokenModal();
      return;
    }

    if (!selectedRepoFullName || !releaseBranch || !sourceBranch || !newBranchName.trim()) {
      return;
    }

    onSubmit({
      repoFullName: selectedRepoFullName,
      releaseBranch,
      sourceBranch,
      newBranchName: newBranchName.trim(),
      jiraId: jiraId.trim().toUpperCase(),
      prTitle: prTitle.trim(),
      prBody: prBody.trim(),
      isDraft,
    });
  };


  // Format repo options for SearchableSelect
  const repoOptions: SelectOption[] = repos.map((repo) => ({
    value: repo.full_name,
    label: repo.full_name,
    sublabel: repo.description || undefined,
    badge: repo.private ? 'Private' : 'Public',
    badgeType: repo.private ? 'private' : 'public',
    icon: repo.private ? (
      <Lock size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
    ) : (
      <Globe size={14} style={{ color: '#38bdf8', flexShrink: 0 }} />
    ),
  }));

  // Format branch options for SearchableSelect
  const currentRepo = repos.find((r) => r.full_name === selectedRepoFullName);
  const defaultBranchName = currentRepo?.default_branch || 'main';

  const branchOptions: SelectOption[] = branches.map((branch) => ({
    value: branch.name,
    label: branch.name,
    badge: branch.name === defaultBranchName ? 'default' : undefined,
    badgeType: branch.name === defaultBranchName ? 'default' : 'branch',
    icon: <GitBranch size={14} style={{ color: 'var(--accent-secondary)', flexShrink: 0 }} />,
  }));

  const isFormValid =
    Boolean(selectedRepoFullName) &&
    Boolean(releaseBranch) &&
    Boolean(sourceBranch) &&
    Boolean(newBranchName.trim()) &&
    releaseBranch !== newBranchName &&
    sourceBranch !== newBranchName;

  return (
    <div className="glass-panel form-card">
      <div className="card-header-title">
        <div>
          <h2 className="card-title">
            <GitMerge size={22} style={{ color: 'var(--accent-primary)' }} />
            Post-Deployment Sync Configuration
          </h2>
        </div>

        {token && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadRepos}
            disabled={isLoadingRepos || isRunning}
            title="Refresh repositories"
          >
            <RefreshCw size={13} className={isLoadingRepos ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      </div>

      {!token ? (
        <div className="alert-banner alert-banner-info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <strong>GitHub Token Required:</strong> Connect your GitHub Personal Access Token to select your repositories and automate the branch/PR workflow.
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenTokenModal}
            style={{ flexShrink: 0 }}
          >
            Connect GitHub
          </button>
        </div>
      ) : null}

      {repoError && (
        <div className="alert-banner alert-banner-error">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>{repoError}</div>
        </div>
      )}

      {branchError && (
        <div className="alert-banner alert-banner-error">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>{branchError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-grid">
        {/* 1. REPOSITORY DROPDOWN */}
        <div className="form-group">
          <label className="form-label" htmlFor="repo-select">
            <span>1. Repository</span>
          </label>
          <SearchableSelect
            id="repo-select"
            options={repoOptions}
            value={selectedRepoFullName}
            onChange={(val) => {
              setSelectedRepoFullName(val);
              setReleaseBranch('');
              setSourceBranch('');
              setNewBranchName('');
            }}
            placeholder="Select a repository..."
            searchPlaceholder="Search repositories (e.g. owner/repo)..."
            isLoading={isLoadingRepos}
            disabled={isRunning || !token}
            allowCustomInput={true}
            emptyText="No repositories found. Type 'owner/repo' to enter manually."
          />
        </div>

        {/* JIRA TICKET / ID */}
        <div className="form-group">
          <label className="form-label" htmlFor="jira-id-input">
            <span>JIRA Ticket ID</span>
          </label>
          <div className="input-with-action">
            <input
              id="jira-id-input"
              type="text"
              className="form-input form-input-mono"
              placeholder="e.g. ABCD-1234"
              value={jiraId}
              onChange={(e) => setJiraId(e.target.value.toUpperCase())}
              disabled={isRunning}
            />
            {jiraId && (
              <span
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#a5b4fc',
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Tag size={12} /> {jiraId.trim().toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* 2. SOURCE & RELEASE BRANCHES ROW */}
        {/* SOURCE BRANCH (Base from which new branch is created & PR target) */}

        <div className="form-group">
          <label className="form-label" htmlFor="source-branch-select">
            <span>2. Source Branch (Target)</span>
          </label>
          <SearchableSelect
            id="source-branch-select"
            options={branchOptions}
            value={sourceBranch}
            onChange={setSourceBranch}
            placeholder="Select source branch..."
            searchPlaceholder="Search source branches..."
            isLoading={isLoadingBranches}
            disabled={isRunning || !selectedRepoFullName || !token}
            allowCustomInput={true}
            emptyText="No branches found. Type branch name to enter."
          />
          <div className="form-helper">
            New branch will fork from this branch, and the final PR will target it.
          </div>
        </div>

        {/* RELEASE BRANCH (Head to be merged) */}
        <div className="form-group">
          <label className="form-label" htmlFor="release-branch-select">
            <span>3. Release Branch</span>
          </label>
          <SearchableSelect
            id="release-branch-select"
            options={branchOptions}
            value={releaseBranch}
            onChange={setReleaseBranch}
            placeholder="Select release branch..."
            searchPlaceholder="Search release branches..."
            isLoading={isLoadingBranches}
            disabled={isRunning || !selectedRepoFullName || !token}
            allowCustomInput={true}
            emptyText="No branches found. Type branch name to enter."
          />
          <div className="form-helper">
            Contains the deployed code that will be merged into the new branch.
          </div>
        </div>

        {/* 4. NEW BRANCH NAME */}
        <div className="form-group">
          <label className="form-label" htmlFor="new-branch-input">
            <span>4. New Branch Name</span>
            <span className="form-label-tag">Created from source</span>
          </label>
          <div className="input-with-action">
            <input
              id="new-branch-input"
              type="text"
              className="form-input form-input-mono"
              placeholder="e.g. sync/release-v1.4.0-to-main"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value.trim())}
              disabled={isRunning || !selectedRepoFullName}
              required
            />
          </div>
          <div className="form-helper">
            This intermediate branch isolates the merge so it can be safely reviewed via Pull Request.
          </div>
        </div>

        {/* ADVANCED PR OPTIONS TOGGLE */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1rem',
            marginTop: '0.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn btn-outline btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GitPullRequest size={14} style={{ color: 'var(--accent-secondary)' }} />
              PR Customization & Details (Optional)
            </span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAdvanced && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginTop: '1rem',
                padding: '1rem',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="pr-title-input">
                  PR Title
                </label>
                <input
                  id="pr-title-input"
                  type="text"
                  className="form-input"
                  placeholder="Pull request title..."
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                  disabled={isRunning}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pr-body-input">
                  PR Description (Markdown)
                </label>
                <textarea
                  id="pr-body-input"
                  className="form-input form-input-mono"
                  rows={4}
                  placeholder="Provide PR description and checklist..."
                  value={prBody}
                  onChange={(e) => setPrBody(e.target.value)}
                  disabled={isRunning}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <input
                  type="checkbox"
                  id="is-draft-checkbox"
                  checked={isDraft}
                  onChange={(e) => setIsDraft(e.target.checked)}
                  disabled={isRunning}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <label
                  htmlFor="is-draft-checkbox"
                  style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Create as Draft Pull Request
                </label>
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div style={{ marginTop: '0.5rem' }}>
          <button
            type="submit"
            id="submit-workflow-btn"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={!isFormValid || isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Executing Post-Deployment Workflow...
              </>
            ) : (
              <>
                <Send size={18} />
                Submit &amp; Run Post-Deployment Workflow
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
