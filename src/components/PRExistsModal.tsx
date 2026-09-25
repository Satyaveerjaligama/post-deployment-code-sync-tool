import React from 'react';
import {
  AlertCircle,
  ExternalLink,
  ArrowRight,
  GitPullRequest,
  GitMerge,
  GitBranch,
  Play,
  XCircle,
} from 'lucide-react';


export interface PRExistsModalData {
  repoFullName: string;
  sourceBranch: string;
  newBranchName: string;
  prStatus: 'open' | 'merged' | 'closed';
  existingPrUrl?: string;
  existingPrNumber?: number;
  existingPrTitle?: string;
  mergedAt?: string | null;
  closedAt?: string | null;
  message?: string;
}

interface PRExistsModalProps {
  data: PRExistsModalData | null;
  isOpen: boolean;
  onProceed?: () => void;
  onClose: () => void;
}

export const PRExistsModal: React.FC<PRExistsModalProps> = ({
  data,
  isOpen,
  onProceed,
  onClose,
}) => {
  if (!isOpen || !data) return null;

  const {
    repoFullName,
    sourceBranch,
    newBranchName,
    prStatus,
    existingPrUrl,
    existingPrNumber,
    existingPrTitle,
    mergedAt,
    closedAt,
    message,
  } = data;

  const isOpenPR = prStatus === 'open';
  const isMergedPR = prStatus === 'merged';
  const isClosedPR = prStatus === 'closed';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              background: isOpenPR
                ? 'rgba(46, 160, 67, 0.15)'
                : isMergedPR
                ? 'rgba(163, 113, 247, 0.15)'
                : 'rgba(248, 81, 73, 0.15)',
              border: `1px solid ${
                isOpenPR
                  ? 'rgba(63, 185, 80, 0.4)'
                  : isMergedPR
                  ? 'rgba(163, 113, 247, 0.4)'
                  : 'rgba(248, 81, 73, 0.4)'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isOpenPR ? '#3fb950' : isMergedPR ? '#a371f7' : '#f85149',
              flexShrink: 0,
            }}
          >
            {isOpenPR ? (
              <GitPullRequest size={20} />
            ) : isMergedPR ? (
              <GitMerge size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isOpenPR && 'Open Pull Request Already Exists'}
              {isMergedPR && 'Merged Pull Request Detected'}
              {isClosedPR && 'Closed Pull Request Detected'}
            </h3>
            <p
              style={{
                fontSize: '0.8rem',
                color: isOpenPR ? '#7ee787' : isMergedPR ? '#d2a8ff' : '#fca5a5',
              }}
            >
              {isOpenPR && 'Flow stopped: An active open Pull Request already exists.'}
              {isMergedPR && 'A previously merged PR exists for these branches. Confirmation required.'}
              {isClosedPR && 'A closed PR exists for these branches. Confirmation required.'}
            </p>
          </div>
        </div>

        {/* Detailed Box */}
        <div
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Repository:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{repoFullName}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Branch Path:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="branch-pill branch-pill-head">
                <GitBranch size={11} />
                {newBranchName}
              </span>
              <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
              <span className="branch-pill branch-pill-base">
                <GitBranch size={11} />
                {sourceBranch}
              </span>
            </div>
          </div>

          {existingPrNumber && existingPrUrl ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {isOpenPR ? 'Active PR:' : isMergedPR ? 'Merged PR:' : 'Closed PR:'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  className={
                    isOpenPR ? 'pr-badge-open' : isMergedPR ? 'pr-badge-merged' : 'pr-badge-draft'
                  }
                  style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                >
                  {isOpenPR && <GitPullRequest size={11} />}
                  {isMergedPR && <GitMerge size={11} />}
                  {prStatus.toUpperCase()}
                </span>
                <a
                  href={existingPrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--accent-secondary)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    textDecoration: 'none',
                  }}
                  title="Open PR in GitHub"
                >
                  #{existingPrNumber}
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ) : null}

          {existingPrTitle && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>Title:</strong> "{existingPrTitle}"
            </div>
          )}

          {mergedAt && (
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Merged on: {new Date(mergedAt).toLocaleString()}
            </div>
          )}

          {closedAt && !mergedAt && (
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Closed on: {new Date(closedAt).toLocaleString()}
            </div>
          )}

          <div
            style={{
              color: isOpenPR ? '#fca5a5' : isMergedPR ? '#e9d5ff' : '#fde68a',
              fontSize: '0.825rem',
              lineHeight: 1.45,
              marginTop: '0.25rem',
            }}
          >
            {message}
          </div>
        </div>

        {/* Action Prompt / Information */}
        {isOpenPR ? (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '0.8rem',
              color: '#fecaca',
            }}
          >
            An open Pull Request already exists. Click <strong>Okay</strong> to return to the main screen without taking any action.
          </div>
        ) : isMergedPR ? (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              fontSize: '0.825rem',
              color: '#f3e8ff',
            }}
          >
            <strong>A merged PR already exists:</strong> Do you want to proceed with creating a new pull request?
          </div>
        ) : (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '0.825rem',
              color: '#fef3c7',
            }}
          >
            <strong>There is a PR closed:</strong> Do you want to proceed?
          </div>
        )}

        {/* Modal Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
          {isOpenPR ? (
            /* Case 1: Open PR -> ONLY single "Okay" button */
            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
              style={{ minWidth: 100 }}
              autoFocus
            >
              Okay
            </button>
          ) : (
            /* Case 2 & 3: Merged or Closed PR -> "Cancel" and "Proceed" buttons */
            <>
              <button
                type="button"
                className="btn btn-danger"
                onClick={onClose}
              >
                <XCircle size={16} />
                Cancel &amp; Stop
              </button>
              <button
                type="button"
                className={`btn ${isMergedPR ? 'btn-purple' : 'btn-warning'}`}
                onClick={onProceed}
                autoFocus
              >
                <Play size={16} />
                Proceed
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
