import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, AlertCircle, X, ExternalLink, Loader2, Check } from 'lucide-react';
import type { GitHubUser } from '../types/github';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  user: GitHubUser | null;
  isValidating: boolean;
  authError: string | null;
  hasRepoScope: boolean;
  isEnvToken?: boolean;
  onSaveToken: (token: string) => Promise<void>;
  onClearToken: () => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({
  isOpen,
  onClose,
  token,
  user,
  isValidating,
  authError,
  hasRepoScope,
  onSaveToken,
  onClearToken,
}) => {
  const [inputToken, setInputToken] = useState(token);
  const [saveSuccess, setSaveSuccess] = useState(false);


  useEffect(() => {
    setInputToken(token);
  }, [token, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    await onSaveToken(inputToken.trim());
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

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
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '0.4rem', borderRadius: '50%' }}
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
            <button
              type="button"
              onClick={onClearToken}
              className="btn btn-outline btn-sm"
              style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              Disconnect
            </button>
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

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

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
              How to create a Personal Access Token:
            </div>
            <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Go to GitHub Settings &gt; Developer Settings &gt; Personal access tokens.</li>
              <li>Generate a <strong>Classic Token</strong> with <code>repo</code> scope, or a <strong>Fine-grained Token</strong> with Read/Write for <em>Contents</em> and <em>Pull Requests</em>.</li>
              <li>Copy and paste the token in .env file</li>
            </ol>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=post-deployment-code-sync-tool"
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isValidating || !inputToken.trim()}
            >
              {isValidating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Validating Token...
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={16} />
                  Connected!
                </>
              ) : (
                <>
                  <Key size={16} />
                  Save &amp; Authenticate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
