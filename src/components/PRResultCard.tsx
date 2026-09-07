import React, { useState } from 'react';
import {
  GitPullRequest,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Tag,
  UserCheck,
} from 'lucide-react';
import type { GitHubPullRequest } from '../types/github';

interface PRResultCardProps {
  pr: GitHubPullRequest;
  hasMergeConflict: boolean;
  onReset: () => void;
}

export const PRResultCard: React.FC<PRResultCardProps> = ({
  pr,
  hasMergeConflict,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pr.html_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = pr.html_url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="pr-card">
      <div className="pr-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span className="pr-badge">
            <Sparkles size={14} /> Pull Request #{pr.number} Created
          </span>
          <span
            style={{
              fontSize: '0.725rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: '#67e8f9',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <Tag size={11} /> test_deployment_tool
          </span>
          <span
            style={{
              fontSize: '0.725rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6ee7b7',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <UserCheck size={11} /> Self-Assigned
          </span>
          {pr.draft && (
            <span
              style={{
                fontSize: '0.725rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-secondary)',
              }}
            >
              Draft
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onReset}
          className="btn btn-outline btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <RotateCcw size={13} />
          New Sync
        </button>
      </div>

      <div>
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: '0.35rem',
          }}
        >
          {pr.title}
        </h3>

        {/* Branch Flow Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginTop: '0.5rem',
            fontSize: '0.85rem',
          }}
        >
          <span
            style={{
              padding: '2px 10px',
              borderRadius: '6px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
            }}
          >
            {pr.head.ref}
          </span>
          <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
          <span
            style={{
              padding: '2px 10px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6ee7b7',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
            }}
          >
            {pr.base.ref}
          </span>
        </div>
      </div>


      {hasMergeConflict && (
        <div className="alert-banner alert-banner-warning">
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Merge Conflict Warning:</strong> Git reported conflicts while merging the release branch into the new sync branch. The PR has been created so your team can resolve and review the conflicts directly in GitHub or locally on branch <code>{pr.head.ref}</code>.
          </div>
        </div>
      )}

      {/* Direct PR URL Box */}
      <div className="pr-link-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
          <GitPullRequest size={18} style={{ color: 'var(--accent-secondary)', flexShrink: 0 }} />
          <a
            href={pr.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="pr-url-text"
            title={pr.html_url}
          >
            {pr.html_url}
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopyLink}
            title="Copy PR link to clipboard"
          >
            {copied ? (
              <>
                <Check size={14} style={{ color: 'var(--success)' }} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy Link
              </>
            )}
          </button>

          <a
            href={pr.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            Open in GitHub
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};
