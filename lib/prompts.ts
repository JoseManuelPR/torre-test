/**
 * AI Prompts Library
 * Centralized prompt templates for AI interactions
 */

import { JobDetails, GenomeResponse } from "./torre-api";

// ============================================================================
// Types
// ============================================================================

export interface CandidateFitAnalysisInput {
  job: JobDetails;
  genome: GenomeResponse;
}

export interface CareerTrajectory {
  summary: string;
  growthIndicators: string[];
  alignmentWithRole: string;
}

export interface LocationAndWorkStyle {
  locationCompatibility: string;
  remoteWorkAlignment: string;
  commitmentLevelMatch: string;
  potentialConcerns: string[];
}

export interface ProfessionalCredibility {
  profileQuality: string;
  professionalPresence: string[];
  credibilityIndicators: string[];
}

export interface CandidateFitAnalysisResult {
  jobSummary: string;
  overallFitScore: "Strong Match" | "Good Match" | "Partial Match" | "Needs Development" | string;
  matchingSkillsAndStrengths: string[];
  areasForDevelopment: string[];
  recommendations: string[];
  // New sections
  careerTrajectory?: CareerTrajectory;
  locationAndWorkStyle?: LocationAndWorkStyle;
  professionalCredibility?: ProfessionalCredibility;
}

// ============================================================================
// Helper Functions for Formatting
// ============================================================================

const formatType = (type: string): string => {
  const typeMap: Record<string, string> = {
    "full-time-employment": "Full-time",
    "part-time-employment": "Part-time",
    "freelance": "Freelance",
    "internship": "Internship",
    "flexible-jobs": "Flexible",
    "contract": "Contract",
    "employee": "Employee",
    "flexible-job": "Flexible",
  };
  return typeMap[type] || type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatProficiency = (proficiency: string): string => {
  const profMap: Record<string, string> = {
    "no-experience-interested": "Interested",
    "proficient": "Proficient",
    "expert": "Expert",
    "master": "Master",
    "potential-to-develop": "Learning",
  };
  return profMap[proficiency] || proficiency?.replace(/\b\w/g, (c) => c.toUpperCase()) || "";
};

const formatFluency = (fluency: string): string => {
  const fluencyMap: Record<string, string> = {
    "fully-fluent": "Fluent",
    "conversational": "Conversational",
    "reading": "Reading",
    "native": "Native",
    "basic": "Basic",
  };
  return fluencyMap[fluency] || fluency?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";
};

const formatCommitment = (commitment: JobDetails["commitment"]): string => {
  const commitMap: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    "flexible": "Flexible",
    "contract": "Contract",
  };
  return commitMap[commitment.code] || commitment.code.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatCompensation = (compensation: JobDetails["compensation"] | null | undefined): string | null => {
  if (!compensation || !compensation.visible) return null;
  const { currency, minAmount, maxAmount, periodicity } = compensation;
  if (!currency || minAmount == null || maxAmount == null) return null;
  const formatNumber = (n: number) => n.toLocaleString();
  const periodMap: Record<string, string> = {
    monthly: "/month",
    yearly: "/year",
    hourly: "/hour",
  };
  const period = periodMap[periodicity] || `/${periodicity}`;
  return `${currency} ${formatNumber(minAmount)} - ${formatNumber(maxAmount)}${period}`;
};

// ============================================================================
// Prompt Templates
// ============================================================================

/**
 * System prompt for candidate fit analysis
 */
export const CANDIDATE_FIT_SYSTEM_PROMPT = 
  "You are an expert talent acquisition specialist and career advisor. Always respond with valid JSON only. Do not include any text outside the JSON object.";

/**
 * Generate the prompt for candidate fit analysis
 * @param input - Job details and candidate genome data
 * @returns The formatted prompt string
 */
export function generateCandidateFitPrompt(input: CandidateFitAnalysisInput): string {
  const { job, genome } = input;

  // Calculate remote work experience
  const remoteJobsCount = genome.jobs?.filter(j => j.remote).length || 0;
  const totalJobsCount = genome.jobs?.length || 0;
  const remoteExperiencePercent = totalJobsCount > 0 ? Math.round((remoteJobsCount / totalJobsCount) * 100) : 0;

  return `You are an expert talent acquisition specialist and job seeker advisor. Analyze the following job opportunity and candidate profile to create a comprehensive fit analysis.

## JOB OPPORTUNITY

**Position:** ${job.objective}
**Company:** ${job.organizations?.[0]?.name || "Not specified"}
**Type:** ${formatType(job.opportunity)}
**Status:** ${job.status}
**Commitment:** ${job.commitment?.code ? formatCommitment(job.commitment) : "Not specified"}

**Tagline:** ${job.tagline}

**Required Skills:**
${job.strengths?.map(s => `- ${s.name}${s.proficiency ? ` (${formatProficiency(s.proficiency)})` : ""}`).join("\n") || "Not specified"}

**Required Languages:**
${job.languages?.map(l => `- ${l.language.name} (${formatFluency(l.fluency)})`).join("\n") || "Not specified"}

**Location:** ${job.place?.remote ? "Remote" : job.place?.anywhere ? "Anywhere" : "On-site"}
${job.place?.location?.length ? `**Specific Locations:** ${job.place.location.slice(0, 5).map(l => l.id).join(", ")}` : ""}

**Compensation:** ${formatCompensation(job.compensation) || "Not disclosed"}

**Job Description:**
${job.details?.find(d => d.code === "responsibilities")?.content?.replace(/<[^>]*>/g, " ").substring(0, 2000) || "Not available"}

---

## CANDIDATE PROFILE

**Name:** ${genome.person.name}
**Headline:** ${genome.person.professionalHeadline}
**Location:** ${genome.person.location?.name || "Not specified"}
**Timezone:** ${genome.person.location?.timezone || "Not specified"}

**Profile Verification:** ${genome.person.verified ? "Verified" : "Not verified"}
**Profile Completeness:** ${genome.person.completion ? `${Math.round(genome.person.completion * 100)}%` : "Unknown"}

**Bio Summary:** ${genome.person.summaryOfBio || "Not available"}

**Top Skills:**
${genome.strengths?.slice(0, 15).map(s => `- ${s.name}${s.proficiency ? ` (${s.proficiency})` : ""} - ${s.recommendations} recommendations`).join("\n") || "Not specified"}

**Languages:**
${genome.languages?.map(l => `- ${l.language} (${l.fluency})`).join("\n") || "Not specified"}

**Career History (with dates):**
${genome.jobs?.slice(0, 8).map(j => {
  const dateRange = j.fromYear ? `${j.fromMonth || ""}/${j.fromYear} - ${j.toYear ? `${j.toMonth || ""}/${j.toYear}` : "Present"}` : "";
  return `- ${j.name}${j.organizations?.[0]?.name ? ` at ${j.organizations[0].name}` : ""}${dateRange ? ` (${dateRange})` : ""}${j.remote ? " [Remote]" : ""}`;
}).join("\n") || "Not specified"}

**Remote Work Experience:** ${remoteJobsCount} out of ${totalJobsCount} positions (${remoteExperiencePercent}%)

**Education:**
${genome.education?.slice(0, 3).map(e => `- ${e.name}${e.organizations?.[0]?.name ? ` at ${e.organizations[0].name}` : ""}`).join("\n") || "Not specified"}

**Projects:**
${genome.projects?.slice(0, 5).map(p => `- ${p.name}${p.additionalInfo ? `: ${p.additionalInfo.substring(0, 100)}` : ""}`).join("\n") || "None listed"}

**Awards & Recognition:**
${genome.awards?.slice(0, 5).map(a => `- ${a.name}${a.organizations?.[0]?.name ? ` from ${a.organizations[0].name}` : ""}`).join("\n") || "None listed"}

**Publications:**
${genome.publications?.slice(0, 3).map(p => `- ${p.name}`).join("\n") || "None listed"}

**Profile Stats:**
- ${genome.stats?.strengths || 0} skills listed
- ${genome.stats?.jobs || 0} job experiences
- ${genome.stats?.projects || 0} projects
- ${genome.stats?.publications || 0} publications
- ${genome.stats?.awards || 0} awards

**Online Presence:**
${genome.person.links?.slice(0, 5).map(l => `- ${l.name}: ${l.address}`).join("\n") || "No links provided"}

---

Analyze the candidate's fit for this role and provide your response in the following JSON structure:

{
  "jobSummary": "A compelling 2-3 paragraph summary of the job opportunity. Highlight key aspects, company culture hints, and what makes this role attractive. Write as if explaining the opportunity to a potential candidate.",
  "overallFitScore": "One of: 'Strong Match', 'Good Match', 'Partial Match', or 'Needs Development'",
  "matchingSkillsAndStrengths": [
    "First matching skill or strength with brief explanation",
    "Second matching skill or strength with brief explanation",
    "Third matching skill or strength with brief explanation"
  ],
  "areasForDevelopment": [
    "First gap or area needing improvement with context",
    "Second gap or area needing improvement with context"
  ],
  "recommendations": [
    "First actionable recommendation for the candidate",
    "Second actionable recommendation for the candidate",
    "Third actionable recommendation for the candidate"
  ],
  "careerTrajectory": {
    "summary": "Brief 1-2 sentence analysis of the candidate's career progression and growth pattern",
    "growthIndicators": [
      "Evidence of career growth or increasing responsibility",
      "Notable projects or initiatives showing drive",
      "Any awards or recognition received"
    ],
    "alignmentWithRole": "How their career trajectory aligns with this position's growth path"
  },
  "locationAndWorkStyle": {
    "locationCompatibility": "Analysis of location match between candidate and job requirements",
    "remoteWorkAlignment": "Assessment of remote work preference and experience match",
    "commitmentLevelMatch": "Full-time/part-time/flexible compatibility assessment",
    "potentialConcerns": [
      "Any timezone, location, or work style concerns to consider"
    ]
  },
  "professionalCredibility": {
    "profileQuality": "Assessment of profile completeness, verification status, and overall presentation",
    "professionalPresence": [
      "Evidence of professional engagement (publications, projects)",
      "Online professional presence and thought leadership"
    ],
    "credibilityIndicators": [
      "Specific trust signals from their profile (endorsements, verified status, etc.)"
    ]
  }
}

IMPORTANT:
- Each array should contain 2-5 items
- Each item should be a complete, meaningful sentence
- Be specific and reference actual skills/experience from the candidate's profile
- For careerTrajectory, locationAndWorkStyle, and professionalCredibility - provide honest, helpful analysis
- If remote work experience is low but the job is remote, note this as a potential concern
- Respond ONLY with the JSON object, no additional text before or after`;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get fit score badge color based on score text
 */
export function getFitScoreColor(score: string): { bg: string; text: string } {
  const scoreLower = score.toLowerCase();
  if (scoreLower.includes('strong')) return { bg: 'bg-green-500/20', text: 'text-green-400' };
  if (scoreLower.includes('good')) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
  if (scoreLower.includes('partial')) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400' };
  if (scoreLower.includes('needs') || scoreLower.includes('weak')) return { bg: 'bg-orange-500/20', text: 'text-orange-400' };
  return { bg: 'bg-blue-500/20', text: 'text-blue-400' };
}

/**
 * Parse AI response and extract JSON
 */
export function parseAIResponse(text: string): CandidateFitAnalysisResult {
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from the response if it has extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse AI response");
  }
}
