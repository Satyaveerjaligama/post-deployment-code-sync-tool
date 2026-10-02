/**
 * Utility functions for Post Deployment Code Sync Tool.
 */

/**
 * Copy string text to the user's system clipboard with a fallback for older environments.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    throw new Error('Clipboard API not available');
  } catch {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch {
      return false;
    }
  }
}

/**
 * Sanitizes a branch name by replacing slashes and backslashes with hyphens.
 */
export function sanitizeBranchName(branchName?: string): string {
  if (!branchName) return '';
  return branchName.replace(/[/\\\s]+/g, '-');
}

/**
 * Generates an automated, timestamped intermediate sync branch name.
 * Format: sync/{cleanRel}-into-{cleanSrc}-{YYYY-MM-DD}-{randomHex}
 */
export function generateSuggestedBranchName(
  releaseBranch?: string,
  sourceBranch?: string
): string {
  const cleanRel = releaseBranch ? sanitizeBranchName(releaseBranch) : 'release';
  const cleanSrc = sourceBranch ? sanitizeBranchName(sourceBranch) : 'main';
  const dateStr = new Date().toISOString().slice(0, 10);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `sync/${cleanRel}-into-${cleanSrc}-${dateStr}-${randomSuffix}`;
}

/**
 * Generates the standard Pull Request title for synchronization.
 */
export function generateDefaultPrTitle(
  releaseBranch: string,
  sourceBranch: string,
  newBranchName: string
): string {
  return `Sync: Merge '${releaseBranch}' into '${sourceBranch}' via '${newBranchName}'`;
}

/**
 * Generates the standard Pull Request markdown body template.
 */
export function generateDefaultPrBody(
  releaseBranch: string,
  sourceBranch: string,
  newBranchName: string
): string {
  return [
    '## Post-Deployment Back-Merge',
    '',
    `- **Release Branch**: \`${releaseBranch}\``,
    `- **Target Source Branch**: \`${sourceBranch}\``,
    `- **Intermediate Sync Branch**: \`${newBranchName}\``,
    '- **Triggered via**: Post-Deployment Sync Tool',
    '',
    '### Verification Checklist',
    '- [ ] Review merge changes from release',
    '- [ ] Ensure automated test suites pass',
    '- [ ] Confirm no regressions in target branch',
  ].join('\n');
}

/**
 * Constructs a direct URL to a branch on GitHub.
 */
export function getGitHubBranchUrl(repoFullName: string, branchName: string): string {
  return `https://github.com/${repoFullName}/tree/${encodeURIComponent(branchName)}`;
}

/**
 * Constructs a direct URL to a repository on GitHub.
 */
export function getGitHubRepoUrl(repoFullName: string): string {
  return `https://github.com/${repoFullName}`;
}

/**
 * Formats an ISO date or timestamp into a localized human-readable string.
 */
export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString();
}
