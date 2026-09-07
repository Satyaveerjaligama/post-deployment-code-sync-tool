import React, { useState, useRef, useEffect } from 'react';
import {
  GitBranch,
  GitMerge,
  GitPullRequest,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import type { WorkflowLog, WorkflowStep } from '../types/github';

interface ExecutionTimelineProps {
  steps: WorkflowStep[];
  logs: WorkflowLog[];
  isRunning: boolean;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({
  steps,
  logs,
  isRunning,
}) => {
  const [showTerminal, setShowTerminal] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.status) {
      case 'running':
        return <Loader2 size={16} className="animate-spin" />;
      case 'success':
        return <Check size={16} />;
      case 'warning':
        return <AlertTriangle size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      case 'pending':
        return <Clock size={15} />;
      default:
        if (step.id === 'create-branch') return <GitBranch size={15} />;
        if (step.id === 'merge-release') return <GitMerge size={15} />;
        if (step.id === 'create-pr') return <GitPullRequest size={15} />;
        return <CheckCircle2 size={15} />;
    }
  };

  return (
    <div className="glass-panel timeline-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={18} style={{ color: 'var(--accent-secondary)' }} />
          Execution Pipeline
        </h3>
        {isRunning && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '2px 8px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc',
              borderRadius: '999px',
            }}
          >
            <Loader2 size={12} className="animate-spin" /> In Progress
          </span>
        )}
      </div>

      <div className="step-list">
        {steps.map((step) => (
          <div key={step.id} className={`step-item ${step.status}`}>
            <div className={`step-icon-wrapper step-icon-${step.status}`}>
              {getStepIcon(step)}
            </div>

            <div className="step-content">
              <div className="step-header">
                <span className="step-title">{step.title}</span>
                {step.durationMs !== undefined && (
                  <span className="step-duration">{(step.durationMs / 1000).toFixed(2)}s</span>
                )}
              </div>
              <div className="step-desc">{step.description}</div>

              {step.detail && <div className="step-detail">{step.detail}</div>}

              {step.error && <div className="step-error-msg">{step.error}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* TERMINAL / LOGS CONSOLE */}
      <div className="terminal-panel" style={{ marginTop: '0.5rem' }}>
        <div
          className="terminal-header"
          onClick={() => setShowTerminal(!showTerminal)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Terminal size={14} style={{ color: 'var(--accent-secondary)' }} />
            <span>Workflow Logs &amp; API Trace ({logs.length})</span>
          </div>
          {showTerminal ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>

        {showTerminal && (
          <div className="terminal-logs" ref={logContainerRef}>
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="terminal-log-row">
                  <span className="log-time">[{log.timestamp}]</span>
                  <span className={`log-msg-${log.level}`}>{log.message}</span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem', padding: '0.5rem 0' }}>
                Pipeline waiting for trigger... Logs will appear here during execution.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
