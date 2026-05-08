/**
 * EmailBrain Persona Classifier
 * Classifies user into buyer persona (pragmatist, innovator, risk-averse, etc.)
 * Location: src/emailbrain/services/personaClassifier.ts
 */

export interface UserProfile {
  userId: string;
  companyName: string;
  userRole: string; // CEO, CFO, CTO, VP Marketing, etc.
  companySize: string; // micro, small, mid_market, enterprise
  industry: string;
  yearsAtCompany?: number;
  department?: string;
  reportingStructure?: string;
}

export interface PersonaScore {
  personaType: string;
  score: number; // 0-100
  confidence: number; // 0-100
  reasoning: string;
}

export class PersonaClassifier {
  /**
   * Classify user into persona based on role and company characteristics
   */
  static classifyPersona(userProfile: UserProfile): PersonaScore[] {
    const scores: PersonaScore[] = [];

    // Role-based classification
    const rolePersonas = this.getRoleBasedPersona(userProfile.userRole);
    scores.push(...rolePersonas);

    // Company size-based refinement
    const sizePersonas = this.getSizeBasedPersona(userProfile.companySize);
    scores.forEach((score, index) => {
      score.score = (score.score + sizePersonas[index]?.score) / 2;
    });

    // Industry-based refinement
    const industryPersonas = this.getIndustryBasedPersona(userProfile.industry);
    scores.forEach((score, index) => {
      score.score = (score.score + industryPersonas[index]?.score) / 2;
    });

    // Sort by score, highest first
    scores.sort((a, b) => b.score - a.score);

    return scores;
  }

  /**
   * Get persona based on user's role
   */
  private static getRoleBasedPersona(role: string): PersonaScore[] {
    const lowerRole = role.toLowerCase();

    const roleMapping: Record<string, PersonaScore[]> = {
      // C-suite roles
      ceo: [
        {
          personaType: "the_growth_obsessed_founder",
          score: 95,
          confidence: 95,
          reasoning: "CEOs are typically growth-obsessed, market-share focused"
        },
        {
          personaType: "the_relationship_builder",
          score: 70,
          confidence: 80,
          reasoning: "Many CEOs value strategic partnerships"
        }
      ],
      cfo: [
        {
          personaType: "the_pragmatist",
          score: 95,
          confidence: 95,
          reasoning: "CFOs are ROI and cost-focused, data-driven"
        },
        {
          personaType: "the_financial_steward",
          score: 90,
          confidence: 90,
          reasoning: "CFOs are inherently stewards of financial health"
        }
      ],
      cto: [
        {
          personaType: "the_innovator",
          score: 95,
          confidence: 95,
          reasoning: "CTOs are tech-forward, innovation-driven"
        },
        {
          personaType: "the_growth_obsessed_founder",
          score: 60,
          confidence: 70,
          reasoning: "CTOs often care about speed-to-market"
        }
      ],
      ciso: [
        {
          personaType: "the_compliance_guardian",
          score: 95,
          confidence: 95,
          reasoning: "CISOs are security and compliance-focused"
        },
        {
          personaType: "the_threat_paranoid",
          score: 85,
          confidence: 90,
          reasoning: "CISOs are inherently threat-aware"
        }
      ],
      // VP/Director roles
      "vp marketing": [
        {
          personaType: "the_growth_hacker_marketer",
          score: 95,
          confidence: 95,
          reasoning: "Marketing leads are growth and conversion-focused"
        },
        {
          personaType: "the_innovator",
          score: 70,
          confidence: 75,
          reasoning: "Marketing VPs seek competitive differentiation"
        }
      ],
      "vp sales": [
        {
          personaType: "the_growth_obsessed_founder",
          score: 85,
          confidence: 85,
          reasoning: "Sales VPs are revenue and quota-focused"
        },
        {
          personaType: "the_pragmatist",
          score: 70,
          confidence: 80,
          reasoning: "Sales leaders need concrete ROI proof"
        }
      ],
      "vp operations": [
        {
          personaType: "the_operations_optimizer",
          score: 95,
          confidence: 95,
          reasoning: "Operations leaders optimize efficiency and cost"
        },
        {
          personaType: "the_pragmatist",
          score: 75,
          confidence: 80,
          reasoning: "Ops leaders are metrics and results-driven"
        }
      ],
      // Manager roles
      manager: [
        {
          personaType: "the_pragmatist",
          score: 80,
          confidence: 85,
          reasoning: "Managers focus on practical solutions and ROI"
        },
        {
          personaType: "the_change_management_champion",
          score: 70,
          confidence: 75,
          reasoning: "Managers often handle implementation"
        }
      ]
    };

    // Check for exact or partial match
    for (const [key, personas] of Object.entries(roleMapping)) {
      if (lowerRole.includes(key)) {
        return personas;
      }
    }

    // Default persona if role not matched
    return [
      {
        personaType: "the_pragmatist",
        score: 50,
        confidence: 50,
        reasoning: "Default persona for unclassified role"
      }
    ];
  }

  /**
   * Adjust persona score based on company size
   */
  private static getSizeBasedPersona(companySize: string): PersonaScore[] {
    const sizeMapping: Record<string, PersonaScore[]> = {
      micro: [
        {
          personaType: "the_growth_obsessed_founder",
          score: 85,
          confidence: 90,
          reasoning: "Small companies are survival/growth focused"
        }
      ],
      small: [
        {
          personaType: "the_pragmatist",
          score: 75,
          confidence: 85,
          reasoning: "Small companies focus on efficiency and ROI"
        }
      ],
      mid_market: [
        {
          personaType: "the_operations_optimizer",
          score: 70,
          confidence: 80,
          reasoning: "Mid-market companies scale operations"
        },
        {
          personaType: "the_compliance_guardian",
          score: 65,
          confidence: 75,
          reasoning: "Growing companies face compliance pressures"
        }
      ],
      enterprise: [
        {
          personaType: "the_compliance_guardian",
          score: 85,
          confidence: 90,
          reasoning: "Enterprise companies are compliance-heavy"
        },
        {
          personaType: "the_relationship_builder",
          score: 75,
          confidence: 85,
          reasoning: "Enterprise buys based on relationships"
        }
      ]
    };

    return sizeMapping[companySize] || [];
  }

  /**
   * Adjust persona score based on industry
   */
  private static getIndustryBasedPersona(industry: string): PersonaScore[] {
    const lowerIndustry = industry.toLowerCase();

    const industryMapping: Record<string, PersonaScore[]> = {
      tech: [
        {
          personaType: "the_innovator",
          score: 80,
          confidence: 85,
          reasoning: "Tech companies value innovation"
        }
      ],
      finance: [
        {
          personaType: "the_pragmatist",
          score: 85,
          confidence: 90,
          reasoning: "Finance is data and ROI-driven"
        },
        {
          personaType: "the_compliance_guardian",
          score: 80,
          confidence: 85,
          reasoning: "Financial services are heavily regulated"
        }
      ],
      healthcare: [
        {
          personaType: "the_compliance_guardian",
          score: 85,
          confidence: 90,
          reasoning: "Healthcare has strict compliance requirements"
        },
        {
          personaType: "the_threat_paranoid",
          score: 70,
          confidence: 75,
          reasoning: "Healthcare data is sensitive"
        }
      ],
      manufacturing: [
        {
          personaType: "the_operations_optimizer",
          score: 85,
          confidence: 90,
          reasoning: "Manufacturing optimizes production"
        },
        {
          personaType: "the_pragmatist",
          score: 75,
          confidence: 80,
          reasoning: "Manufacturing is efficiency-focused"
        }
      ],
      retail: [
        {
          personaType: "the_growth_hacker_marketer",
          score: 80,
          confidence: 85,
          reasoning: "Retail focuses on sales and conversion"
        },
        {
          personaType: "the_growth_obsessed_founder",
          score: 75,
          confidence: 80,
          reasoning: "Retail is growth-obsessed"
        }
      ],
      energy: [
        {
          personaType: "the_pragmatist",
          score: 75,
          confidence: 85,
          reasoning: "Energy is cost and efficiency-focused"
        },
        {
          personaType: "the_compliance_guardian",
          score: 70,
          confidence: 75,
          reasoning: "Energy has regulatory requirements"
        }
      ]
    };

    // Check for industry match
    for (const [key, personas] of Object.entries(industryMapping)) {
      if (lowerIndustry.includes(key)) {
        return personas;
      }
    }

    return [];
  }

  /**
   * Get top persona and confidence level
   */
  static getTopPersona(userProfile: UserProfile) {
    const scores = this.classifyPersona(userProfile);
    return scores[0] || null;
  }

  /**
   * Get persona characteristics
   */
  static getPersonaCharacteristics(personaType: string): Record<string, any> {
    const characteristics: Record<string, Record<string, any>> = {
      the_pragmatist: {
        motivation: "ROI, efficiency, cost savings",
        painLanguage: "Cost, metrics, budget impact",
        objectionStyle: "Questions ROI math, compares alternatives",
        emailTrigger: "Numbers, benchmarks, competitive advantage",
        subjectLineAngle: "Metrics-first ('Save $X, Improve Y by Z%')",
        riskConcern: "Investment waste, hidden costs"
      },
      the_innovator: {
        motivation: "Cutting-edge capability, competitive differentiation",
        painLanguage: "Technical limitations, speed to market, scalability",
        objectionStyle: "Digs into tech details, wants architecture docs",
        emailTrigger: "Technical innovation, architecture, API capability",
        subjectLineAngle: "Technology-first ('AI-powered', 'Next-gen')",
        riskConcern: "Technical debt, vendor lock-in"
      },
      the_compliance_guardian: {
        motivation: "Risk elimination, regulatory compliance",
        painLanguage: "Compliance gaps, breach likelihood, audit failures",
        objectionStyle: "Wants guarantees, SLAs, insurance, certifications",
        emailTrigger: "Security certifications, compliance automation",
        subjectLineAngle: "Compliance-first ('100% compliant', 'Zero-breach')",
        riskConcern: "Regulatory violation, liability exposure"
      },
      the_relationship_builder: {
        motivation: "Partnership, support, strategic guidance",
        painLanguage: "Banker quality, relationship depth, strategic alignment",
        objectionStyle: "Wants to know the person, build trust first",
        emailTrigger: "Personal banker intro, relationship success stories",
        subjectLineAngle: "Relationship-first ('Your dedicated banker...')",
        riskConcern: "Impersonal service, banker turnover"
      },
      the_growth_obsessed_founder: {
        motivation: "Speed of growth, market share, competitive advantage",
        painLanguage: "Growth bottlenecks, cash runway, competitor threats",
        objectionStyle: "Fast-moving, wants speed over details",
        emailTrigger: "Growth metrics, speed guarantees, competitive edge",
        subjectLineAngle: "Growth-first ('Add $500k revenue', 'Grow 3x faster')",
        riskConcern: "Losing market window, competition winning"
      },
      the_operations_optimizer: {
        motivation: "Workflow efficiency, cost reduction, quality consistency",
        painLanguage: "Process cost, operational complexity, downtime",
        objectionStyle: "Wants workflow proof, efficiency metrics, support",
        emailTrigger: "Efficiency improvements, process documentation",
        subjectLineAngle: "Efficiency-first ('Cut costs 20%', 'Speed up by 40%')",
        riskConcern: "Operational disruption, complexity increase"
      },
      the_growth_hacker_marketer: {
        motivation: "Revenue growth, conversion optimization, competitive advantage",
        painLanguage: "Conversion rate, CAC, customer lifetime value",
        objectionStyle: "Wants A/B test proof, conversion metrics, benchmarks",
        emailTrigger: "Conversion lift data, growth case studies",
        subjectLineAngle: "Growth-first ('Increase revenue 30%', 'Boost conversions')",
        riskConcern: "Growth not materializing, wasted ad spend"
      },
      the_threat_paranoid: {
        motivation: "Zero breaches, threat elimination, board confidence",
        painLanguage: "Breach likelihood, threat sophistication, detection gaps",
        objectionStyle: "Wants threat data, breach case studies, simulations",
        emailTrigger: "Threat intelligence data, breach prevention proof",
        subjectLineAngle: "Threat-first ('Stop [Threat] before it happens')",
        riskConcern: "Breach happening despite tools, sophisticated threats"
      }
    };

    return characteristics[personaType] || characteristics.the_pragmatist;
  }
}