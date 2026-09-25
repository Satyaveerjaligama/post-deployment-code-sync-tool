import React from 'react';
import {
  X,
  History,
  GitPullRequest,
  ExternalLink,
  Trash2,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { WorkflowHistoryItem } from '../types/github';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: WorkflowHistoryItem[];
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <History size={20} style={{ color: 'var(--accent-secondary)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Sync History ({history.length})
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {history.length > 0 && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={onClearHistory}
                title="Clear history"
              >
                <Trash2 size={13} />
              </button>
            )}
            <button
              type="button"
              className="btn btn-outline btn-icon"
              onClick={onClose}
              title="Close drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="history-item-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.repoFullName}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>


                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#a5b4fc' }}>{item.releaseBranch}</span>
                  <ArrowRight size={11} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: '#6ee7b7' }}>{item.sourceBranch}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
                    {item.status === 'success' ? (
                      <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={12} /> PR #{item.prNumber}
                      </span>
                    ) : (
                      <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertTriangle size={12} /> Conflict PR #{item.prNumber}
                      </span>
                    )}
                  </div>

                  <a
                    href={item.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.725rem', padding: '0.25rem 0.5rem' }}
                  >
                    View PR <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <GitPullRequest size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              No post-deployment syncs recorded yet. Run a workflow to see past pull requests here.
            </div>
          )}
        </div>
      </div>
    </>
  );
};
