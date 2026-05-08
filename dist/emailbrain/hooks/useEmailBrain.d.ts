/**
 * useEmailBrain Hook
 * Easy integration of EmailBrain into React components
 * Location: src/emailbrain/hooks/useEmailBrain.ts
 */
import { EmailBrainContext } from '../EmailBrain';
import { EmailEngagementData } from '../services/stageDetector';
export interface UseEmailBrainParams {
    userId: string;
    companyName: string;
    userRole: string;
    companySize: string;
    industry: string;
    nicheId: string;
    engagementData: EmailEngagementData;
    autoGenerate?: boolean;
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
export declare function useEmailBrain(params: UseEmailBrainParams): UseEmailBrainReturn;
/**
 * Hook to generate email context and send to API
 */
export declare function useEmailGeneration(context: EmailBrainContext | null): {
    generateEmail: () => Promise<void>;
    generatedEmail: string;
    generatingEmail: boolean;
    generationError: Error;
};
/**
 * Combined hook - get brain context and generate email
 */
export declare function useEmailBrainWithGeneration(params: UseEmailBrainParams): {
    context: EmailBrainContext;
    brainLoading: boolean;
    brainError: Error;
    regenerateContext: () => void;
    generateEmail: () => Promise<void>;
    generatedEmail: string;
    generatingEmail: boolean;
    generationError: Error;
};
