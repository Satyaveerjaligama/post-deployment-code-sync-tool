import React from 'react';
import {
  GitMerge,
  Key,
  BookOpen,
  AlertCircle,
  GitFork,
} from 'lucide-react';
import type { GitHubUser } from '../types/github';
import { REPO_URL } from '../constants';

interface HeaderProps {
  user: GitHubUser | null;
  hasRepoScope: boolean;
  onOpenTokenModal: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  hasRepoScope,
  onOpenTokenModal,
  onOpenGuide,
}) => {
  return (
    <header className="header-container">
      <div className="header-inner">
        <div className="brand-group">
          <div className="brand-logo-glow" title="Post-Deployment Code Sync">
            <GitMerge className="brand-logo-icon" size={20} />
          </div>
          <div className="brand-text-block">
            <h1 className="brand-title">
              <span className="brand-title-full">Post-Deployment Code Sync</span>
              <span className="brand-title-compact">Post-Deployment Sync</span>
            </h1>
            <p className="brand-subtitle">
              GitHub Branch &amp; PR Post-Deployment Synchronization
            </p>
          </div>
        </div>

        <div className="header-actions">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm header-action-btn"
            style={{ textDecoration: 'none' }}
            title="Clone repository on GitHub"
            aria-label="Clone repository on GitHub"
          >
            <GitFork size={14} className="header-btn-icon" />
            <span className="header-btn-text">Clone Repo</span>
          </a>

          <button
            type="button"
            className="btn btn-outline btn-sm header-action-btn"
            onClick={onOpenGuide}
            title="How this workflow works"
            aria-label="Workflow Guide"
          >
            <BookOpen size={14} className="header-btn-icon" />
            <span className="header-btn-text">Guide</span>
          </button>

          {user ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm header-user-btn"
              onClick={onOpenTokenModal}
              title={`Authenticated as @${user.login}${!hasRepoScope ? ' (Warning: token missing repo scope)' : ''}`}
              aria-label={`GitHub profile @${user.login}`}
            >
              <div className="user-avatar-container">
                <img src={user.avatar_url} alt={user.login} className="user-avatar" />
                {!hasRepoScope && (
                  <span className="avatar-warning-badge" title="Token missing repo scope">
                    <AlertCircle size={10} />
                  </span>
                )}
              </div>
              <span className="header-username">@{user.login}</span>
              {!hasRepoScope && (
                <span className="header-user-warning-icon" title="Token missing repo scope">
                  <AlertCircle size={14} style={{ color: '#fbbf24' }} />
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm header-connect-btn"
              onClick={onOpenTokenModal}
              title="Connect GitHub Personal Access Token"
              aria-label="Connect GitHub"
            >
              <Key size={14} className="header-btn-icon" />
              <span className="header-connect-text-full">Connect GitHub</span>
              <span className="header-connect-text-short">Connect</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
