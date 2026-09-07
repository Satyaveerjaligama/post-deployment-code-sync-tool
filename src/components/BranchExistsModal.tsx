import React from 'react';
import {
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  Play,
  XCircle,
} from 'lucide-react';


export interface BranchExistsConfirmationData {
  repoFullName: string;
  branchName: string;
  sourceBranch: string;
  releaseBranch: string;
  existingSha?: string;
}

interface BranchExistsModalProps {
  data: BranchExistsConfirmationData | null;
  isOpen: boolean;
  onProceed: () => void;
  onCancel: () => void;
}

export const BranchExistsModal: React.FC<BranchExistsModalProps> = ({
  data,
  isOpen,
  onProceed,
  onCancel,
}) => {
  if (!isOpen || !data) return null;

  const { repoFullName, branchName, sourceBranch, releaseBranch, existingSha } = data;
  const githubBranchUrl = `https://github.com/${repoFullName}/tree/${encodeURIComponent(branchName)}`;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Branch Already Exists
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#fde68a' }}>
              Action required: A branch with this name is already present in this repository.
            </p>
          </div>
        </div>

        {/* Detailed Information Box */}
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
            <span style={{ color: 'var(--text-secondary)' }}>Target New Branch:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fbbf24' }}>
                {branchName}
              </span>
              <a
                href={githubBranchUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="View existing branch on GitHub"
                style={{ color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center' }}
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {existingSha && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Existing Commit SHA:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {existingSha.substring(0, 10)}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Planned Workflow:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
              <span style={{ color: '#a5b4fc' }}>{releaseBranch}</span>
              <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: '#fbbf24' }}>{branchName}</span>
              <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: '#6ee7b7' }}>{sourceBranch}</span>
            </div>
          </div>
        </div>

        {/* Details & Consequence Explanations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem', lineHeight: 1.45 }}>
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#fef3c7',
            }}
          >
            <strong>If you choose to Proceed:</strong>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.35rem', color: '#fde68a' }}>
              <li>The tool will <strong>use the existing branch</strong> without overwriting its history.</li>
              <li>It will merge <code>{releaseBranch}</code> into <code>{branchName}</code>.</li>
              <li>It will open/link the Pull Request into <code>{sourceBranch}</code>.</li>
            </ul>
          </div>

          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fecaca',
            }}
          >
            <strong>If you choose to Stop:</strong>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.35rem', color: '#fca5a5' }}>
              <li>The workflow will <strong>stop immediately</strong> without making any merges or PRs.</li>
              <li>You can pick a different branch name or delete the remote branch on GitHub.</li>
            </ul>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
          >
            <XCircle size={16} />
            Stop Workflow
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onProceed}
            style={{
              background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
              color: '#ffffff',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Play size={16} />
            Proceed with Existing Branch
          </button>
        </div>
      </div>
    </div>
  );
};
