/**
 * EmailBrain Persona Classifier
 * Classifies user into buyer persona (pragmatist, innovator, risk-averse, etc.)
 * Location: src/emailbrain/services/personaClassifier.ts
 */
export interface UserProfile {
    userId: string;
    companyName: string;
    userRole: string;
    companySize: string;
    industry: string;
    yearsAtCompany?: number;
    department?: string;
    reportingStructure?: string;
}
export interface PersonaScore {
    personaType: string;
    score: number;
    confidence: number;
    reasoning: string;
}
export declare class PersonaClassifier {
    /**
     * Classify user into persona based on role and company characteristics
     */
    static classifyPersona(userProfile: UserProfile): PersonaScore[];
    /**
     * Get persona based on user's role
     */
    private static getRoleBasedPersona;
    /**
     * Adjust persona score based on company size
     */
    private static getSizeBasedPersona;
    /**
     * Adjust persona score based on industry
     */
    private static getIndustryBasedPersona;
    /**
     * Get top persona and confidence level
     */
    static getTopPersona(userProfile: UserProfile): PersonaScore;
    /**
     * Get persona characteristics
     */
    static getPersonaCharacteristics(personaType: string): Record<string, any>;
}
