import { useState } from 'react';
import { useGitHubAuth } from './hooks/useGitHubAuth';
import { useGitHubWorkflow } from './hooks/useGitHubWorkflow';
import { Header } from './components/Header';
import { TokenModal } from './components/TokenModal';
import { DeploymentForm } from './components/DeploymentForm';
import { ExecutionTimeline } from './components/ExecutionTimeline';
import { PRResultCard } from './components/PRResultCard';
import { WorkflowGuideModal } from './components/WorkflowGuideModal';
import { BranchExistsModal } from './components/BranchExistsModal';
import { PRExistsModal } from './components/PRExistsModal';
import { GitBranch, Sparkles } from 'lucide-react';
import type { PostDeployFormData } from './types/github';

export function App() {
  const {
    token,
    user,
    isValidating,
    authError,
    hasRepoScope,
    isEnvToken,
    saveToken,
    clearToken,
  } = useGitHubAuth();

  const {
    isRunning,
    steps,
    logs,
    createdPR,
    hasMergeConflict,
    branchConfirmation,
    handleProceedWithExistingBranch,
    handleCancelExistingBranch,
    prExistsModal,
    handleProceedExistingPR,
    handleCloseExistingPR,
    runWorkflow,
    resetWorkflow,
  } = useGitHubWorkflow(token, user?.login);





  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleFormSubmit = (formData: PostDeployFormData) => {
    runWorkflow(formData);
  };

  return (
    <div className="app-layout">
      {/* Top Navigation */}
      <Header
        user={user}
        hasRepoScope={hasRepoScope}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Banner if token is missing */}
        {!token && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} style={{ color: 'var(--accent-secondary)' }} />
                Automate your GitHub Post-Deployment Back-Merges in Seconds
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Connect your GitHub account to dynamically load your repositories &amp; branches, create a sync branch, merge release changes, and create back-merge PRs.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsTokenModalOpen(true)}
            >
              Get Started with GitHub PAT
            </button>
          </div>
        )}

        {/* Workflow & Execution Grid */}
        <div className="workflow-layout">
          {/* Left Column: Form & PR Result */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {createdPR ? (
              <PRResultCard
                pr={createdPR}
                hasMergeConflict={hasMergeConflict}
                onReset={resetWorkflow}
              />
            ) : null}

            <DeploymentForm
              token={token}
              onOpenTokenModal={() => setIsTokenModalOpen(true)}
              onSubmit={handleFormSubmit}
              isRunning={isRunning}
            />
          </div>

          {/* Right Column: Execution Timeline & Live Logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ExecutionTimeline
              steps={steps}
              logs={logs}
              isRunning={isRunning}
            />

            {/* Quick Workflow Overview Card */}
            <div
              className="glass-panel"
              style={{
                padding: '1.25rem',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <GitBranch size={15} style={{ color: 'var(--text-secondary)' }} />
                What happens when you submit?
              </div>
              <ol type='a' style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>
                  <strong>New branch created:</strong> Forks from the latest commit of your <span className="branch-pill branch-pill-source">Source branch</span>.
                </li>
                <li>
                  <strong>Release branch merged:</strong> Merges latest changes from <span className="branch-pill branch-pill-release">Release branch</span> into the new branch.
                </li>
                <li>
                  <strong>Pull Request opened:</strong> Creates a PR from <span className="branch-pill branch-pill-new">New branch</span> &rarr; <span className="branch-pill branch-pill-source">Source branch</span>.
                </li>
                <li>
                  <strong>Direct PR link returned:</strong> Immediate URL, summary card, and copy action ready for review.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>

      {/* GitHub Token Modal */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        token={token}
        user={user}
        isValidating={isValidating}
        authError={authError}
        hasRepoScope={hasRepoScope}
        isEnvToken={isEnvToken}
        onSaveToken={saveToken}
        onClearToken={clearToken}
      />


      {/* Workflow Documentation Guide Modal */}
      <WorkflowGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Branch Already Exists Confirmation Modal */}
      <BranchExistsModal
        data={branchConfirmation?.data || null}
        isOpen={!!branchConfirmation}
        onProceed={handleProceedWithExistingBranch}
        onCancel={handleCancelExistingBranch}
      />

      {/* Pull Request Already Exists Error / Confirmation Modal */}
      <PRExistsModal
        data={prExistsModal}
        isOpen={!!prExistsModal}
        onProceed={handleProceedExistingPR}
        onClose={handleCloseExistingPR}
      />
    </div>
  );
}

export default App;



