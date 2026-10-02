import React from 'react';
import { Key, ShieldCheck, AlertCircle, X, ExternalLink } from 'lucide-react';
import type { GitHubUser } from '../types/github';
import { GITHUB_NEW_TOKEN_URL } from '../constants';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
  user: GitHubUser | null;
  isValidating?: boolean;
  authError: string | null;
  hasRepoScope: boolean;
  isEnvToken?: boolean;
  onSaveToken?: (token: string) => Promise<void>;
  onClearToken?: () => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({
  isOpen,
  onClose,
  user,
  authError,
  hasRepoScope,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <Key size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                GitHub Authentication
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Connect your GitHub Personal Access Token (PAT)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline btn-icon"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={user.avatar_url} alt={user.login} className="user-avatar" style={{ width: 32, height: 32 }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.name || user.login} (@{user.login})
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={13} /> Token Authenticated &amp; Active
                </div>
              </div>
            </div>
          </div>
        )}

        {!hasRepoScope && user && (
          <div className="alert-banner alert-banner-warning">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Missing 'repo' Scope:</strong> Your current token might not have full permissions to create branches or pull requests in private repositories. Please ensure the <code>repo</code> scope is checked.
            </div>
          </div>
        )}

        {authError && (
          <div className="alert-banner alert-banner-error">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Authentication Failed:</strong> {authError}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              How to configure your Personal Access Token:
            </div>
            <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Go to GitHub Settings &gt; Developer Settings &gt; Personal access tokens.</li>
              <li>Generate a <strong>Classic Token</strong> with <code>repo</code> scope, or a <strong>Fine-grained Token</strong> with Read/Write for <em>Contents</em> and <em>Pull Requests</em>.</li>
              <li>Copy and paste the token into your <code>.env</code> file: <code>VITE_GIT_TOKEN=ghp_your_token</code></li>
              <li>Restart the dev server if needed.</li>
            </ol>
            <a
              href={GITHUB_NEW_TOKEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'var(--accent-secondary)',
                textDecoration: 'none',
                marginTop: '0.65rem',
                fontWeight: 600,
              }}
            >
              Generate Token with Pre-configured Scopes <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
