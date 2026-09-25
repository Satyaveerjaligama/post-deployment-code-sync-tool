import { useState, useCallback } from 'react';
import { githubApi } from '../services/githubApi';
import type {
  GitHubPullRequest,
  PostDeployFormData,
  WorkflowHistoryItem,
  WorkflowLog,
  WorkflowStep,
} from '../types/github';
import type { BranchExistsConfirmationData } from '../components/BranchExistsModal';
import type { PRExistsModalData } from '../components/PRExistsModal';

const HISTORY_STORAGE_KEY = 'pdt_workflow_history';

const INITIAL_STEPS: WorkflowStep[] = [
  {
    id: 'create-branch',
    title: '1. Create New Branch',
    description: 'Fetch source branch SHA and initialize the new branch',
    status: 'idle',
  },
  {
    id: 'merge-release',
    title: '2. Merge Release Branch',
    description: 'Merge release branch changes into the new branch',
    status: 'idle',
  },
  {
    id: 'create-pr',
    title: '3. Create Pull Request',
    description: 'Open PR from new branch back into source branch',
    status: 'idle',
  },
  {
    id: 'complete',
    title: '4. Pull Request Ready',
    description: 'Provide PR link and synchronization details',
    status: 'idle',
  },
];

export function useGitHubWorkflow(token: string, currentUserLogin?: string) {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [steps, setSteps] = useState<WorkflowStep[]>(INITIAL_STEPS);
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [createdPR, setCreatedPR] = useState<GitHubPullRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMergeConflict, setHasMergeConflict] = useState<boolean>(false);

  // Branch confirmation modal state
  const [branchConfirmation, setBranchConfirmation] = useState<{
    data: BranchExistsConfirmationData;
    resolve: (proceed: boolean) => void;
  } | null>(null);

  // Existing PR error / confirmation modal state
  const [prExistsModal, setPrExistsModal] = useState<{
    data: PRExistsModalData;
    resolve?: (proceed: boolean) => void;
  } | null>(null);

  // History state
  const [history, setHistory] = useState<WorkflowHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addLog = useCallback((level: WorkflowLog['level'], message: string, details?: any) => {
    const newLog: WorkflowLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details,
    };
    setLogs((prev) => [...prev, newLog]);
  }, []);

  const updateStep = useCallback(
    (id: WorkflowStep['id'], patch: Partial<WorkflowStep>) => {
      setSteps((prev) =>
        prev.map((step) => (step.id === id ? { ...step, ...patch } : step))
      );
    },
    []
  );

  const resetWorkflow = useCallback(() => {
    setSteps(INITIAL_STEPS);
    setLogs([]);
    setCreatedPR(null);
    setError(null);
    setHasMergeConflict(false);
    setBranchConfirmation(null);
    setPrExistsModal(null);
    setIsRunning(false);
  }, []);

  const handleProceedExistingPR = useCallback(() => {
    if (prExistsModal && prExistsModal.resolve) {
      prExistsModal.resolve(true);
    }
  }, [prExistsModal]);

  const handleCloseExistingPR = useCallback(() => {
    if (prExistsModal && prExistsModal.resolve) {
      prExistsModal.resolve(false);
    } else {
      setPrExistsModal(null);
      resetWorkflow();
    }
  }, [prExistsModal, resetWorkflow]);

  const handleProceedWithExistingBranch = useCallback(() => {
    if (branchConfirmation) {
      branchConfirmation.resolve(true);
    }
  }, [branchConfirmation]);

  const handleCancelExistingBranch = useCallback(() => {
    if (branchConfirmation) {
      branchConfirmation.resolve(false);
    }
  }, [branchConfirmation]);



  const runWorkflow = useCallback(
    async (formData: PostDeployFormData) => {
      if (!token) {
        setError('GitHub Personal Access Token is required to execute workflow.');
        return;
      }

      const {
        repoFullName,
        releaseBranch,
        sourceBranch,
        newBranchName,
        prTitle,
        prBody,
        isDraft,
      } = formData;
      const [owner, repo] = repoFullName.split('/');

      if (!owner || !repo) {
        setError('Invalid repository format. Must be "owner/repository".');
        return;
      }

      setIsRunning(true);
      setError(null);
      setHasMergeConflict(false);
      setCreatedPR(null);
      setLogs([]);
      setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'pending' })));

      addLog('cmd', `🚀 Starting post-deployment synchronization workflow for ${repoFullName}...`);
      addLog('info', `Source Branch: ${sourceBranch} | Release Branch: ${releaseBranch} | New Branch: ${newBranchName}`);

      let branchSha = '';
      let prResult: GitHubPullRequest | null = null;

      try {
        // ==========================================
        // STEP 1: Check & Create new branch
        // ==========================================
        const step1Start = Date.now();
        updateStep('create-branch', { status: 'running', startedAt: step1Start });
        addLog('info', `[Step 1] Checking if branch '${newBranchName}' already exists in ${repoFullName}...`);

        const existingBranchCheck = await githubApi.checkBranchExists(token, owner, repo, newBranchName);

        if (existingBranchCheck.exists) {
          addLog('warn', `⚠️ [Step 1] Branch '${newBranchName}' already exists (SHA: ${existingBranchCheck.sha?.substring(0, 7) || 'HEAD'}). Waiting for user confirmation...`);
          updateStep('create-branch', {
            status: 'warning',
            detail: `Branch '${newBranchName}' already exists. Awaiting your decision in the popup...`,
          });

          const shouldProceed = await new Promise<boolean>((resolve) => {
            setBranchConfirmation({
              data: {
                repoFullName,
                branchName: newBranchName,
                sourceBranch,
                releaseBranch,
                existingSha: existingBranchCheck.sha,
              },
              resolve: (choice: boolean) => {
                setBranchConfirmation(null);
                resolve(choice);
              },
            });
          });

          if (!shouldProceed) {
            updateStep('create-branch', {
              status: 'warning',
              detail: `Workflow stopped by user: Branch '${newBranchName}' already exists.`,
            });
            addLog('warn', `🛑 [Step 1] Workflow cancelled by user. No modifications were made.`);
            setIsRunning(false);
            return;
          }

          const step1End = Date.now();
          updateStep('create-branch', {
            status: 'success',
            completedAt: step1End,
            durationMs: step1End - step1Start,
            detail: `User confirmed: Reusing existing branch '${newBranchName}' (${existingBranchCheck.sha?.substring(0, 7) || 'HEAD'})`,
          });
          addLog('success', `▶️ [Step 1] Proceeding with existing branch: refs/heads/${newBranchName}`);
        } else {
          addLog('info', `[Step 1] Fetching HEAD commit SHA of source branch '${sourceBranch}'...`);
          branchSha = await githubApi.getBranchSha(token, owner, repo, sourceBranch);
          addLog('success', `Resolved '${sourceBranch}' SHA: ${branchSha.substring(0, 7)}`);

          addLog('info', `[Step 1] Creating new branch '${newBranchName}' from SHA ${branchSha.substring(0, 7)}...`);
          await githubApi.createBranch(token, owner, repo, newBranchName, branchSha);

          const step1End = Date.now();
          updateStep('create-branch', {
            status: 'success',
            completedAt: step1End,
            durationMs: step1End - step1Start,
            detail: `Branch '${newBranchName}' created from '${sourceBranch}' (${branchSha.substring(0, 7)})`,
          });
          addLog('success', `[Step 1] Branch created successfully: refs/heads/${newBranchName}`);
        }


        // ==========================================
        // STEP 2: Merge release branch into new branch
        // ==========================================
        const step2Start = Date.now();
        updateStep('merge-release', { status: 'running', startedAt: step2Start });
        addLog('info', `[Step 2] Merging release branch '${releaseBranch}' into '${newBranchName}'...`);

        try {
          const mergeResult = await githubApi.mergeBranch(
            token,
            owner,
            repo,
            newBranchName,
            releaseBranch,
            `Merge branch '${releaseBranch}' into '${newBranchName}' [Post-Deploy Back-Merge]`
          );

          const step2End = Date.now();
          if (mergeResult.status === 'already_up_to_date') {
            updateStep('merge-release', {
              status: 'success',
              completedAt: step2End,
              durationMs: step2End - step2Start,
              detail: `Branch '${newBranchName}' is already up-to-date with '${releaseBranch}'.`,
            });
            addLog('info', `[Step 2] Release branch '${releaseBranch}' has no new commits to merge (already up to date).`);
          } else {
            const mergeSha = mergeResult.data?.sha || '';
            updateStep('merge-release', {
              status: 'success',
              completedAt: step2End,
              durationMs: step2End - step2Start,
              detail: `Merged '${releaseBranch}' into '${newBranchName}' (Merge Commit: ${mergeSha.substring(0, 7)})`,
            });
            addLog('success', `[Step 2] Merge commit created: ${mergeSha.substring(0, 7)}`);
          }
        } catch (mergeErr: any) {
          if (mergeErr.status === 409) {
            setHasMergeConflict(true);
            const step2End = Date.now();
            updateStep('merge-release', {
              status: 'warning',
              completedAt: step2End,
              durationMs: step2End - step2Start,
              detail: `Merge conflict between '${releaseBranch}' and '${newBranchName}'. Manual conflict resolution is needed.`,
              error: mergeErr.message,
            });
            addLog('warn', `⚠️ [Step 2] Merge conflict detected: ${mergeErr.message}`);
            addLog('info', `Branch '${newBranchName}' was created. You can resolve the conflict locally or continue.`);
          } else {
            throw mergeErr;
          }
        }

        // ==========================================
        // STEP 3: Check PR status & Create PR
        // ==========================================
        const step3Start = Date.now();
        updateStep('create-pr', { status: 'running', startedAt: step3Start });
        addLog('info', `[Step 3] Checking if a Pull Request already exists for '${newBranchName}' -> '${sourceBranch}'...`);

        // Check if any PR (open, merged, or closed) already exists
        const existingPR = await githubApi.findExistingPullRequest(token, owner, repo, newBranchName, sourceBranch);

        if (existingPR) {
          if (existingPR.state === 'open') {
            // CASE 1: OPEN PR -> Show error popup with single "Okay" button, then stop the flow
            addLog('warn', `⚠️ [Step 3] An active open Pull Request (#${existingPR.number}) already exists for '${newBranchName}' -> '${sourceBranch}'.`);
            updateStep('create-pr', {
              status: 'error',
              detail: `Open Pull Request #${existingPR.number} already exists: "${existingPR.title}"`,
              error: `An active open pull request already exists for this branch pair. Flow stopped.`,
            });
            setPrExistsModal({
              data: {
                repoFullName,
                sourceBranch,
                newBranchName,
                prStatus: 'open',
                existingPrUrl: existingPR.html_url,
                existingPrNumber: existingPR.number,
                existingPrTitle: existingPR.title,
                message: `An open Pull Request (#${existingPR.number}) already exists from '${newBranchName}' to '${sourceBranch}'. The workflow has been stopped.`,
              },
            });
            setIsRunning(false);
            return;
          } else if (existingPR.state === 'closed' && existingPR.merged_at) {
            // CASE 2: MERGED PR -> Show message, get confirmation, then proceed
            addLog('warn', `⚠️ [Step 3] A merged Pull Request (#${existingPR.number}) exists for '${newBranchName}' -> '${sourceBranch}'. Requesting confirmation...`);
            updateStep('create-pr', {
              status: 'warning',
              detail: `Merged PR #${existingPR.number} detected. Awaiting your decision in the popup...`,
            });

            const shouldProceed = await new Promise<boolean>((resolve) => {
              setPrExistsModal({
                data: {
                  repoFullName,
                  sourceBranch,
                  newBranchName,
                  prStatus: 'merged',
                  existingPrUrl: existingPR.html_url,
                  existingPrNumber: existingPR.number,
                  existingPrTitle: existingPR.title,
                  mergedAt: existingPR.merged_at,
                  message: `A Pull Request (#${existingPR.number}) for these branches was already merged on ${new Date(existingPR.merged_at!).toLocaleDateString()}. Do you want to proceed with creating a new pull request?`,
                },
                resolve: (choice: boolean) => {
                  setPrExistsModal(null);
                  resolve(choice);
                },
              });
            });

            if (!shouldProceed) {
              updateStep('create-pr', {
                status: 'warning',
                detail: `Workflow stopped by user: Merged PR #${existingPR.number} exists.`,
              });
              addLog('warn', `🛑 [Step 3] Workflow cancelled by user after merged PR warning.`);
              setIsRunning(false);
              return;
            }

            addLog('info', `▶️ [Step 3] User confirmed: Proceeding with creating PR despite previously merged PR #${existingPR.number}...`);
          } else if (existingPR.state === 'closed' && !existingPR.merged_at) {
            // CASE 3: CLOSED UNMERGED PR -> Show message "There is a PR closed, do you want to proceed", get confirmation, then proceed
            addLog('warn', `⚠️ [Step 3] A closed Pull Request (#${existingPR.number}) exists for '${newBranchName}' -> '${sourceBranch}'. Requesting confirmation...`);
            updateStep('create-pr', {
              status: 'warning',
              detail: `Closed PR #${existingPR.number} detected. Awaiting your decision in the popup...`,
            });

            const shouldProceed = await new Promise<boolean>((resolve) => {
              setPrExistsModal({
                data: {
                  repoFullName,
                  sourceBranch,
                  newBranchName,
                  prStatus: 'closed',
                  existingPrUrl: existingPR.html_url,
                  existingPrNumber: existingPR.number,
                  existingPrTitle: existingPR.title,
                  closedAt: existingPR.closed_at,
                  message: `There is a closed Pull Request (#${existingPR.number}) for these branches. Do you want to proceed?`,
                },
                resolve: (choice: boolean) => {
                  setPrExistsModal(null);
                  resolve(choice);
                },
              });
            });

            if (!shouldProceed) {
              updateStep('create-pr', {
                status: 'warning',
                detail: `Workflow stopped by user: Closed PR #${existingPR.number} exists.`,
              });
              addLog('warn', `🛑 [Step 3] Workflow cancelled by user after closed PR warning.`);
              setIsRunning(false);
              return;
            }

            addLog('info', `▶️ [Step 3] User confirmed: Proceeding with creating PR despite previously closed PR #${existingPR.number}...`);
          }
        }

        addLog('info', `[Step 3] Opening Pull Request from '${newBranchName}' into '${sourceBranch}'...`);

        let finalTitle = prTitle.trim();
        if (!finalTitle) {
          finalTitle = `Sync: Merge '${releaseBranch}' into '${sourceBranch}' via '${newBranchName}'`;
        }

        const defaultBody = `## Post-Deployment Back-Merge\n\n- **Release Branch**: \`${releaseBranch}\`\n- **Target Source Branch**: \`${sourceBranch}\`\n- **Intermediate Sync Branch**: \`${newBranchName}\`\n- **Triggered via**: Post-Deployment Sync Tool\n\n### Verification Checklist\n- [ ] Review merge changes from release\n- [ ] Ensure automated test suites pass\n- [ ] Confirm no regressions in target branch`;

        const finalBody = prBody.trim() || defaultBody;

        try {
          prResult = await githubApi.createPullRequest(token, owner, repo, {
            title: finalTitle,
            head: newBranchName,
            base: sourceBranch,
            body: finalBody,
            draft: isDraft,
          });
        } catch (prErr: any) {
          if (
            prErr.status === 422 &&
            (prErr.message?.toLowerCase().includes('pull request already exists') ||
              prErr.message?.toLowerCase().includes('already exists for'))
          ) {
            addLog('warn', `⚠️ [Step 3] Pull request already exists on GitHub for '${newBranchName}' -> '${sourceBranch}'.`);
            updateStep('create-pr', {
              status: 'error',
              detail: `Pull Request already exists for '${newBranchName}' -> '${sourceBranch}'`,
              error: prErr.message,
            });
            const fetchedExisting = await githubApi.findExistingPullRequest(token, owner, repo, newBranchName, sourceBranch);
            setPrExistsModal({
              data: {
                repoFullName,
                sourceBranch,
                newBranchName,
                prStatus: 'open',
                existingPrUrl: fetchedExisting?.html_url,
                existingPrNumber: fetchedExisting?.number,
                existingPrTitle: fetchedExisting?.title,
                message: prErr.message || `An open pull request already exists for '${newBranchName}' targeting '${sourceBranch}'. Flow stopped.`,
              },
            });
            setIsRunning(false);
            return;
          }
          throw prErr;
        }

        // 3a. Self-assign the PR
        if (currentUserLogin) {
          try {
            addLog('info', `[Step 3] Self-assigning PR #${prResult.number} to @${currentUserLogin}...`);
            await githubApi.addAssignees(token, owner, repo, prResult.number, [currentUserLogin]);
            addLog('success', `[Step 3] Assigned PR to @${currentUserLogin}`);
          } catch (assignErr: any) {
            addLog('warn', `⚠️ [Step 3] Could not auto-assign PR: ${assignErr.message}`);
          }
        }

        // 3b. Add label 'test_deployment_tool'
        try {
          addLog('info', `[Step 3] Adding label 'test_deployment_tool' to PR #${prResult.number}...`);
          await githubApi.addLabels(token, owner, repo, prResult.number, ['test_deployment_tool']);
          addLog('success', `[Step 3] Added label 'test_deployment_tool' to PR #${prResult.number}`);
        } catch (labelErr: any) {
          addLog('warn', `⚠️ [Step 3] Could not add label: ${labelErr.message}`);
        }

        const step3End = Date.now();
        updateStep('create-pr', {
          status: 'success',
          completedAt: step3End,
          durationMs: step3End - step3Start,
          detail: `Pull Request #${prResult.number} created: "${prResult.title}" (Assigned: @${currentUserLogin || 'user'}, Label: test_deployment_tool)`,
        });
        addLog('success', `[Step 3] Pull Request #${prResult.number} successfully created!`);

        // ==========================================
        // STEP 4: Complete & return PR Link
        // ==========================================
        const step4Time = Date.now();
        updateStep('complete', {
          status: 'success',
          completedAt: step4Time,
          durationMs: 0,
          detail: `PR URL: ${prResult.html_url}`,
          data: prResult,
        });

        setCreatedPR(prResult);
        addLog('success', `🎉 Workflow complete! PR Link: ${prResult.html_url}`);

        // Save to History
        const historyItem: WorkflowHistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          repoFullName,
          releaseBranch,
          sourceBranch,
          newBranchName,
          prNumber: prResult.number,
          prUrl: prResult.html_url,
          prTitle: prResult.title,
          status: hasMergeConflict ? 'conflict_manual_needed' : 'success',
        };

        setHistory((prev) => {
          const updated = [historyItem, ...prev.slice(0, 29)];
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      } catch (err: any) {
        const errorMsg = err.message || 'An unexpected error occurred during workflow execution.';
        setError(errorMsg);
        addLog('error', `❌ Workflow failed: ${errorMsg}`);

        setSteps((prev) =>
          prev.map((step) =>
            step.status === 'running'
              ? { ...step, status: 'error', error: errorMsg }
              : step.status === 'pending'
              ? { ...step, status: 'idle' }
              : step
          )
        );
      } finally {
        setIsRunning(false);
      }
    },
    [token, currentUserLogin, addLog, updateStep, hasMergeConflict]
  );


  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    setHistory([]);
  }, []);

  return {
    isRunning,
    steps,
    logs,
    createdPR,
    error,
    hasMergeConflict,
    branchConfirmation,
    handleProceedWithExistingBranch,
    handleCancelExistingBranch,
    prExistsModal: prExistsModal?.data || null,
    handleProceedExistingPR,
    handleCloseExistingPR,
    history,
    runWorkflow,
    resetWorkflow,
    clearHistory,
  };
}



