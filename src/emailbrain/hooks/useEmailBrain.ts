/**
 * useEmailBrain Hook
 * Easy integration of EmailBrain into React components
 * Location: src/emailbrain/hooks/useEmailBrain.ts
 */

import { useCallback, useState, useEffect } from 'react';
import { generateEmailContext, EmailBrainContext } from '../EmailBrain';
import { EmailEngagementData } from '../services/stageDetector';

export interface UseEmailBrainParams {
  userId: string;
  companyName: string;
  userRole: string;
  companySize: string;
  industry: string;
  nicheId: string;
  engagementData: EmailEngagementData;
  autoGenerate?: boolean; // Auto-generate context on mount
}

export interface UseEmailBrainReturn {
  context: EmailBrainContext | null;
  loading: boolean;
  error: Error | null;
  regenerate: () => void;
}

/**
 * Hook to use EmailBrain in any component
 * Usage:
 * const { context, loading, error } = useEmailBrain({
 *   userId: 'user123',
 *   companyName: 'Acme Corp',
 *   userRole: 'CFO',
 *   companySize: 'mid_market',
 *   industry: 'Finance',
 *   nicheId: 'FIN_001',
 *   engagementData: {...}
 * });
 */
export function useEmailBrain(params: UseEmailBrainParams): UseEmailBrainReturn {
  const [context, setContext] = useState<EmailBrainContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const regenerate = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      const newContext = generateEmailContext({
        userId: params.userId,
        companyName: params.companyName,
        userRole: params.userRole,
        companySize: params.companySize,
        industry: params.industry,
        nicheId: params.nicheId,
        engagementData: params.engagementData
      });

      setContext(newContext);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Auto-generate on mount if enabled
  useEffect(() => {
    if (params.autoGenerate !== false) {
      regenerate();
    }
  }, [
    params.userId,
    params.companyName,
    params.userRole,
    params.companySize,
    params.industry,
    params.nicheId,
    regenerate
  ]);

  return { context, loading, error, regenerate };
}

/**
 * Hook to generate email context and send to API
 */
export function useEmailGeneration(context: EmailBrainContext | null) {
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<Error | null>(null);

  const generateEmail = useCallback(async () => {
    if (!context) {
      setGenerationError(new Error('No email context available'));
      return;
    }

    setGeneratingEmail(true);
    setGenerationError(null);

    try {
      // Call your backend API
      const response = await fetch('/api/emails/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context: context, // Pass entire context to backend
          systemPrompt: context.systemPrompt // AI uses this to understand reasoning
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedEmail((data as any)?.email || '');
    } catch (err) {
      setGenerationError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setGeneratingEmail(false);
    }
  }, [context]);

  return {
    generateEmail,
    generatedEmail,
    generatingEmail,
    generationError
  };
}

/**
 * Combined hook - get brain context and generate email
 */
export function useEmailBrainWithGeneration(params: UseEmailBrainParams) {
  const brainResult = useEmailBrain(params);
  const generationResult = useEmailGeneration(brainResult.context);

  return {
    // Brain results
    context: brainResult.context,
    brainLoading: brainResult.loading,
    brainError: brainResult.error,
    regenerateContext: brainResult.regenerate,

    // Generation results
    generateEmail: generationResult.generateEmail,
    generatedEmail: generationResult.generatedEmail,
    generatingEmail: generationResult.generatingEmail,
    generationError: generationResult.generationError
  };
}