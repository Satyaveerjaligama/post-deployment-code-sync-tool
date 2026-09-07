import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface WorkflowGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowGuideModal: React.FC<WorkflowGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-secondary)',
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Post-Deployment Sync Workflow Guide
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                How this automated 4-step synchronization works
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '0.4rem', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
          <div
            style={{
              padding: '1rem',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              Why use an intermediate sync branch?
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
              Merging a release branch directly into the main or source branch can bypass CI/CD checks, code review policies, or cause unreviewed merge conflicts. By creating an isolated intermediate branch and opening a Pull Request, your team can review the changes, run automated tests, and merge safely.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                1
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Create New Branch from Source</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  The tool resolves the latest commit SHA of your <code>Source branch</code> (e.g. <code>main</code> or <code>develop</code>) and creates the new sync branch via GitHub Git References API.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(6, 182, 212, 0.2)', color: '#67e8f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                2
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Merge Release Branch into New Branch</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  The tool calls GitHub's Merges API to merge the deployed <code>Release branch</code> into the new sync branch.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                3
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Create Pull Request</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  An official Pull Request is opened with <code>head: new branch</code> and <code>base: source branch</code>.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', color: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                4
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Return PR Link &amp; Details</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  You receive the clickable PR link, one-click copy button, and complete API execution logs.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
