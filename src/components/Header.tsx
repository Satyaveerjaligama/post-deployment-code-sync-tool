import React from 'react';
import {
  GitMerge,
  Key,
  BookOpen,
  AlertCircle,
  History,
} from 'lucide-react';
import type { GitHubUser } from '../types/github';

interface HeaderProps {
  user: GitHubUser | null;
  hasRepoScope: boolean;
  historyCount: number;
  onOpenTokenModal: () => void;
  onOpenHistory: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  hasRepoScope,
  historyCount,
  onOpenTokenModal,
  onOpenHistory,
  onOpenGuide,
}) => {
  return (
    <header className="header-container">
      <div className="header-inner">
        <div className="brand-group">
          <div className="brand-logo-glow">
            <GitMerge size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 className="brand-title">Post Deployment Code Sync</h1>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              GitHub Branch &amp; PR Post-Deployment Synchronization
            </p>
          </div>
        </div>

        <div className="header-actions">
          {/* Sync History Button */}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onOpenHistory}
            title="View sync history"
          >
            <History size={14} />
            <span>History {historyCount > 0 ? `(${historyCount})` : ''}</span>
          </button>

          {/* Workflow Guide Button */}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onOpenGuide}
            title="How this workflow works"
          >
            <BookOpen size={14} />
            <span>Guide</span>
          </button>

          {/* GitHub Auth Button */}
          {user ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenTokenModal}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <img src={user.avatar_url} alt={user.login} className="user-avatar" />
              <span style={{ fontWeight: 600 }}>@{user.login}</span>
              {!hasRepoScope && (
                <span title="Token missing repo scope" style={{ display: 'flex', alignItems: 'center' }}>
                  <AlertCircle size={14} style={{ color: '#fbbf24' }} />
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenTokenModal}
            >
              <Key size={14} />
              <span>Connect GitHub</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
