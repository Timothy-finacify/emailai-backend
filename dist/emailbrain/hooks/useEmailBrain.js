"use strict";
/**
 * useEmailBrain Hook
 * Easy integration of EmailBrain into React components
 * Location: src/emailbrain/hooks/useEmailBrain.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEmailBrain = useEmailBrain;
exports.useEmailGeneration = useEmailGeneration;
exports.useEmailBrainWithGeneration = useEmailBrainWithGeneration;
const react_1 = require("react");
const EmailBrain_1 = require("../EmailBrain");
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
function useEmailBrain(params) {
    const [context, setContext] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const regenerate = (0, react_1.useCallback)(() => {
        setLoading(true);
        setError(null);
        try {
            const newContext = (0, EmailBrain_1.generateEmailContext)({
                userId: params.userId,
                companyName: params.companyName,
                userRole: params.userRole,
                companySize: params.companySize,
                industry: params.industry,
                nicheId: params.nicheId,
                engagementData: params.engagementData
            });
            setContext(newContext);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        }
        finally {
            setLoading(false);
        }
    }, [params]);
    // Auto-generate on mount if enabled
    (0, react_1.useEffect)(() => {
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
function useEmailGeneration(context) {
    const [generatingEmail, setGeneratingEmail] = (0, react_1.useState)(false);
    const [generatedEmail, setGeneratedEmail] = (0, react_1.useState)(null);
    const [generationError, setGenerationError] = (0, react_1.useState)(null);
    const generateEmail = (0, react_1.useCallback)(async () => {
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
            setGeneratedEmail(data?.email || '');
        }
        catch (err) {
            setGenerationError(err instanceof Error ? err : new Error('Unknown error'));
        }
        finally {
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
function useEmailBrainWithGeneration(params) {
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
//# sourceMappingURL=useEmailBrain.js.map