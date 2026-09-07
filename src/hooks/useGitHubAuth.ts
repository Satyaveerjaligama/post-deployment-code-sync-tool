import { useCallback, useEffect, useState } from 'react';
import { githubApi } from '../services/githubApi';
import type { GitHubUser } from '../types/github';

const TOKEN_STORAGE_KEY = 'pdt_github_pat';
const ENV_GIT_TOKEN = (import.meta.env.VITE_GIT_TOKEN as string | undefined)?.trim() || '';

export function useGitHubAuth() {
  const [token, setToken] = useState<string>(() => {
    return ENV_GIT_TOKEN || localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  });
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasRepoScope, setHasRepoScope] = useState<boolean>(true);
  const isEnvToken = Boolean(ENV_GIT_TOKEN && token === ENV_GIT_TOKEN);

  const validateAndSetUser = useCallback(async (pat: string) => {
    if (!pat.trim()) {
      setUser(null);
      setAuthError(null);
      return;
    }

    setIsValidating(true);
    setAuthError(null);

    try {
      const userData = await githubApi.validateToken(pat.trim());
      setUser(userData);
      
      // Check if user has repo scope (for classic PATs) or fine-grained token
      const scopes = userData.scopes || [];
      const hasScope = scopes.length === 0 || scopes.includes('repo') || scopes.includes('public_repo');
      setHasRepoScope(hasScope);

      localStorage.setItem(TOKEN_STORAGE_KEY, pat.trim());
    } catch (err: any) {
      setUser(null);
      setAuthError(err.message || 'Failed to authenticate with GitHub');
    } finally {
      setIsValidating(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      validateAndSetUser(token);
    }
  }, [token, validateAndSetUser]);

  const saveToken = async (newToken: string) => {
    setToken(newToken.trim());
    await validateAndSetUser(newToken.trim());
  };

  const clearToken = () => {
    setToken('');
    setUser(null);
    setAuthError(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  return {
    token,
    user,
    isValidating,
    authError,
    hasRepoScope,
    isEnvToken,
    saveToken,
    clearToken,
    isAuthenticated: !!user,
  };
}
