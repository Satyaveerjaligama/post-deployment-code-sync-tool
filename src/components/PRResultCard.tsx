import React, { useState } from 'react';
import {
  GitPullRequest,
  GitBranch,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
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
          {pr.draft ? (
            <span className="pr-badge-draft">
              <GitPullRequest size={14} /> Draft
            </span>
          ) : (
            <span className="pr-badge-open">
              <GitPullRequest size={14} /> Open
            </span>
          )}
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Pull Request #{pr.number}
          </span>
          <span className="branch-pill branch-pill-neutral">
            <Tag size={11} /> test_deployment_tool
          </span>
          <span className="branch-pill branch-pill-neutral">
            <UserCheck size={11} /> Self-Assigned
          </span>
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
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: '0.5rem',
          }}
        >
          {pr.title}
        </h3>

        {/* GitHub Branch Flow Line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            flexWrap: 'wrap',
            fontSize: '0.825rem',
            color: 'var(--text-secondary)',
          }}
        >
          <span>wants to merge into</span>
          <span className="branch-pill branch-pill-base" title="Base branch (PR target)">
            <GitBranch size={12} />
            {pr.base.ref}
          </span>
          <span>from</span>
          <span className="branch-pill branch-pill-head" title="Head branch (Sync branch)">
            <GitBranch size={12} />
            {pr.head.ref}
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
