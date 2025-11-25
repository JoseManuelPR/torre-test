"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  getJobDetails as fetchJobDetailsApi,
  getGenome,
  type JobDetails,
  type GenomeResponse,
} from "@/lib/torre-api";

// Helper functions
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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

const formatAgreement = (agreement: JobDetails["agreement"]): string => {
  const agreementMap: Record<string, string> = {
    "non-employment-contract": "Non-employment Contract",
    "employment-contract": "Employment Contract",
    "freelance": "Freelance",
  };
  return agreementMap[agreement.type] || agreement.type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const getThemeColor = (theme: string): string => {
  const themeMap: Record<string, string> = {
    "deepPurple300": "#9575cd",
    "deepPurple200": "#b39ddb",
    "deepPurple500": "#673ab7",
    "purple300": "#ba68c8",
    "purple200": "#ce93d8",
    "purple500": "#9c27b0",
    "blue300": "#64b5f6",
    "blue200": "#90caf9",
    "blue500": "#2196f3",
    "cyan300": "#4dd0e1",
    "cyan500": "#00bcd4",
    "teal300": "#4db6ac",
    "teal500": "#009688",
    "green300": "#81c784",
    "green500": "#4caf50",
    "lightGreen300": "#aed581",
    "lightGreen500": "#8bc34a",
    "lime300": "#dce775",
    "lime500": "#cddc39",
    "yellow300": "#fff176",
    "yellow500": "#ffeb3b",
    "amber300": "#ffd54f",
    "amber500": "#ffc107",
    "orange300": "#ffb74d",
    "orange400": "#ffa726",
    "orange500": "#ff9800",
    "red300": "#e57373",
    "red500": "#f44336",
    "pink300": "#f06292",
    "pink500": "#e91e63",
  };
  return themeMap[theme] || "#cdff50";
};

// Candidate Fit Dialog Component
interface FitAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobDetails;
  themeColor: string;
}

interface AIAnalysis {
  jobSummary: string | unknown;
  fitAnalysis: string | unknown;
}

// Helper function to safely render text content
const renderTextContent = (content: unknown): string => {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map(item => typeof item === "string" ? item : JSON.stringify(item)).join("\n\n");
  }
  if (typeof content === "object" && content !== null) {
    return JSON.stringify(content, null, 2);
  }
  return String(content);
};

function FitAnalysisDialog({ isOpen, onClose, job, themeColor }: FitAnalysisDialogProps) {
  const [username, setUsername] = useState("");
  const [step, setStep] = useState<"input" | "loading" | "result">("input");
  const [genome, setGenome] = useState<GenomeResponse | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!username.trim()) return;

    setStep("loading");
    setError(null);

    try {
      // 1. Fetch genome data
      const genomeData = await getGenome(username.trim());
      setGenome(genomeData);

      // 2. Prepare the prompt for AI
      const prompt = `
You are an expert talent acquisition specialist and job seeker advisor. Analyze the following job opportunity and candidate profile to create a comprehensive fit analysis.

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

**Compensation:** ${formatCompensation(job.compensation) || "Not disclosed"}

**Job Description:**
${job.details?.find(d => d.code === "responsibilities")?.content?.replace(/<[^>]*>/g, " ").substring(0, 2000) || "Not available"}

---

## CANDIDATE PROFILE

**Name:** ${genomeData.person.name}
**Headline:** ${genomeData.person.professionalHeadline}
**Location:** ${genomeData.person.location?.name || "Not specified"}

**Bio Summary:** ${genomeData.person.summaryOfBio || "Not available"}

**Top Skills:**
${genomeData.strengths?.slice(0, 15).map(s => `- ${s.name}${s.proficiency ? ` (${s.proficiency})` : ""} - ${s.recommendations} recommendations`).join("\n") || "Not specified"}

**Languages:**
${genomeData.languages?.map(l => `- ${l.language} (${l.fluency})`).join("\n") || "Not specified"}

**Experience Summary:**
${genomeData.jobs?.slice(0, 5).map(j => `- ${j.name}${j.organizations?.[0]?.name ? ` at ${j.organizations[0].name}` : ""}`).join("\n") || "Not specified"}

**Education:**
${genomeData.education?.slice(0, 3).map(e => `- ${e.name}${e.organizations?.[0]?.name ? ` at ${e.organizations[0].name}` : ""}`).join("\n") || "Not specified"}

---

Please provide your analysis in the following JSON format:
{
  "jobSummary": "A compelling 2-3 paragraph summary of the job opportunity, highlighting key aspects, company culture hints, and what makes this role attractive. Write it as if you're explaining this opportunity to a potential candidate.",
  "fitAnalysis": "A detailed 3-4 paragraph analysis of how well the candidate fits this role. Include: 1) Matching skills and strengths, 2) Potential gaps or areas for development, 3) An overall fit score (e.g., 'Strong Match', 'Good Match', 'Partial Match', 'Needs Development'), and 4) Specific recommendations for the candidate if they want to pursue this opportunity."
}

Respond ONLY with the JSON object, no additional text.`;

      // 3. Send to AI for analysis
      const aiResponse = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          systemPrompt: "You are an expert talent acquisition specialist and career advisor. Always respond with valid JSON only.",
        }),
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(errorData.error || "AI analysis failed");
      }

      const aiData = await aiResponse.json();
      
      // Parse the AI response
      try {
        const parsedAnalysis = JSON.parse(aiData.text);
        setAnalysis(parsedAnalysis);
        setStep("result");
      } catch {
        // Try to extract JSON from the response if it has extra text
        const jsonMatch = aiData.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedAnalysis = JSON.parse(jsonMatch[0]);
          setAnalysis(parsedAnalysis);
          setStep("result");
        } else {
          throw new Error("Failed to parse AI response");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("input");
    }
  };

  const handleClose = () => {
    setUsername("");
    setStep("input");
    setGenome(null);
    setAnalysis(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-[--card-border] bg-[--background] shadow-2xl">
        {/* Header */}
        <div 
          className="flex items-center justify-between border-b border-[--card-border] px-6 py-4"
          style={{ background: `linear-gradient(to right, ${themeColor}15, transparent)` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${themeColor}25` }}
            >
              <svg className="h-5 w-5" style={{ color: themeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[--foreground]">Candidate Fit Analysis</h2>
              <p className="text-sm text-[--muted]">AI-powered job matching</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="rounded-lg p-2 text-[--muted] transition-colors hover:bg-[--card-bg] hover:text-[--foreground]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
          {/* Input Step */}
          {step === "input" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[--card-border] bg-[--card-bg] p-6">
                <h3 className="mb-2 text-lg font-semibold text-[--foreground]">Enter Candidate Username</h3>
                <p className="mb-4 text-sm text-[--muted]">
                  Enter the Torre username of the candidate you want to analyze for this position.
                </p>
                
                {error && (
                  <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-400">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    className="flex-1 rounded-xl border border-[--card-border] bg-[--input-bg] px-4 py-3 text-[--foreground] placeholder-[--muted] outline-none transition-colors focus:border-[--accent] focus:ring-1 focus:ring-[--accent]"
                    placeholder="e.g., renanpeixotox"
                    autoFocus
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={!username.trim()}
                    className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ 
                      backgroundColor: themeColor,
                      color: "#0f0f12",
                    }}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Analyze Fit
                  </button>
                </div>
              </div>

              {/* Job Preview */}
              <div className="rounded-2xl border border-[--card-border] bg-[--card-bg] p-6">
                <h4 className="mb-3 text-sm font-medium uppercase tracking-wider text-[--muted]">Analyzing for Position</h4>
                <div className="flex items-start gap-4">
                  {job.organizations?.[0]?.picture ? (
                    <Image 
                      src={job.organizations[0].picture} 
                      alt={job.organizations[0].name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div 
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
                      style={{ backgroundColor: themeColor }}
                    >
                      {job.organizations?.[0]?.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-[--foreground]">{job.objective}</h3>
                    <p className="text-sm text-[--muted]">{job.organizations?.[0]?.name}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading Step */}
          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div 
                className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-t-transparent"
                style={{ borderColor: `${themeColor}30`, borderTopColor: themeColor }}
              />
              <h3 className="mb-2 text-lg font-semibold text-[--foreground]">Analyzing Candidate Fit</h3>
              <p className="text-center text-[--muted]">
                Fetching profile data and running AI analysis...<br />
                This may take a few seconds.
              </p>
            </div>
          )}

          {/* Result Step */}
          {step === "result" && analysis && genome && (
            <div className="space-y-6">
              {/* Candidate Header */}
              <div className="flex items-center gap-4 rounded-2xl border border-[--card-border] bg-[--card-bg] p-4">
                {genome.person.picture ? (
                  <Image 
                    src={genome.person.picture}
                    alt={genome.person.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div 
                    className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white"
                    style={{ backgroundColor: themeColor }}
                  >
                    {genome.person.name?.charAt(0) || "?"}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-[--foreground]">{genome.person.name}</h3>
                  <p className="text-sm text-[--muted]">{genome.person.professionalHeadline}</p>
                </div>
                <a
                  href={`https://torre.ai/${genome.person.publicId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                >
                  View Profile
                </a>
              </div>

              {/* Job Summary Section */}
              <div className="rounded-2xl border border-[--card-border] bg-[--card-bg] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div 
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${themeColor}25` }}
                  >
                    <svg className="h-5 w-5" style={{ color: themeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-[--foreground]">Job Summary</h3>
                </div>
                <div className="prose prose-invert max-w-none text-[--muted] prose-p:leading-relaxed">
                  {renderTextContent(analysis.jobSummary).split("\n\n").map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Fit Analysis Section */}
              <div className="rounded-2xl border border-[--card-border] bg-[--card-bg] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div 
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${themeColor}25` }}
                  >
                    <svg className="h-5 w-5" style={{ color: themeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-[--foreground]">Fit Analysis</h3>
                </div>
                <div className="prose prose-invert max-w-none text-[--muted] prose-p:leading-relaxed prose-strong:text-[--foreground]">
                  {renderTextContent(analysis.fitAnalysis).split("\n\n").map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setStep("input");
                    setUsername("");
                    setGenome(null);
                    setAnalysis(null);
                  }}
                  className="rounded-xl border border-[--card-border] bg-[--card-bg] px-6 py-3 font-semibold text-[--foreground] transition-colors hover:bg-[--input-bg]"
                >
                  Analyze Another Candidate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadJobDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJobDetailsApi(id);
        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch job details");
      } finally {
        setLoading(false);
      }
    };

    loadJobDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[--background] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <div className="h-6 w-32 rounded loading-shimmer mb-4" />
            <div className="h-12 w-3/4 rounded loading-shimmer mb-4" />
            <div className="h-6 w-1/2 rounded loading-shimmer" />
          </div>
          <div className="rounded-2xl border border-[--card-border] bg-[--card-bg] p-8">
            <div className="space-y-4">
              <div className="h-6 w-full rounded loading-shimmer" />
              <div className="h-6 w-5/6 rounded loading-shimmer" />
              <div className="h-6 w-4/6 rounded loading-shimmer" />
              <div className="h-6 w-full rounded loading-shimmer" />
              <div className="h-6 w-3/4 rounded loading-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[--background] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-12">
            <svg className="mx-auto mb-4 h-16 w-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mb-2 text-2xl font-semibold text-red-400">Job Not Found</h2>
            <p className="mb-6 text-[--muted]">{error || "This job posting may have been removed or is no longer available."}</p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-[--accent] px-6 py-3 font-semibold text-[--background] transition-all hover:bg-[--accent-dark]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const themeColor = getThemeColor(job.theme);
  const org = job.organizations?.[0];
  const compensation = formatCompensation(job.compensation);
  const responsibilities = job.details?.find((d) => d.code === "responsibilities")?.content;
  const visibleMembers = job.members?.filter((m) => m.visible) || [];

  return (
    <div className="min-h-screen bg-[--background]">
      {/* Hero Section */}
      <div 
        className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8"
        style={{ 
          background: `linear-gradient(to bottom, ${themeColor}15 0%, transparent 100%)`,
        }}
      >
        <div className="mx-auto max-w-4xl">
          {/* Back Link */}
          <Link
            href="/jobs"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[--muted] transition-colors hover:text-[--foreground]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Jobs
          </Link>

          {/* Organization Info */}
          <div className="mb-6 flex items-center gap-4">
            {org?.picture ? (
              <Image 
                src={org.picture} 
                alt={org.name}
                width={64}
                height={64}
                className="h-16 w-16 rounded-2xl object-cover"
              />
            ) : (
              <div 
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white"
                style={{ backgroundColor: themeColor }}
              >
                {org?.name?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-[--foreground]">{org?.name || "Unknown Company"}</h2>
              {org?.websiteUrl && (
                <a 
                  href={org.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors hover:underline"
                  style={{ color: themeColor }}
                >
                  {org.websiteUrl.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>

          {/* Job Title & Status */}
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span 
                className="rounded-full px-3 py-1 text-sm font-medium"
                style={{ backgroundColor: `${themeColor}25`, color: themeColor }}
              >
                {formatType(job.opportunity)}
              </span>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                job.status === "open" 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
              }`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
              {job.quickApply && (
                <span className="rounded-full bg-[--accent] px-3 py-1 text-sm font-bold text-[--background]">
                  Quick Apply
                </span>
              )}
              {job.place?.remote && (
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-400">
                  Remote
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[--foreground] sm:text-4xl">
              {job.objective}
            </h1>
            <p className="mt-3 text-lg text-[--muted]">{job.tagline}</p>
          </div>

          {/* Key Info Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Compensation */}
            {compensation && (
              <div className="rounded-xl border border-[--card-border] bg-[--card-bg] p-4">
                <div className="mb-1 flex items-center gap-2 text-sm text-[--muted]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Compensation
                </div>
                <p className="font-semibold text-[--foreground]">{compensation}</p>
                {job.compensation?.negotiable && (
                  <p className="text-xs text-[--muted]">Negotiable</p>
                )}
              </div>
            )}

            {/* Commitment */}
            {job.commitment && (
              <div className="rounded-xl border border-[--card-border] bg-[--card-bg] p-4">
                <div className="mb-1 flex items-center gap-2 text-sm text-[--muted]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Commitment
                </div>
                <p className="font-semibold text-[--foreground]">{formatCommitment(job.commitment)}</p>
              </div>
            )}

            {/* Agreement */}
            {job.agreement && (
              <div className="rounded-xl border border-[--card-border] bg-[--card-bg] p-4">
                <div className="mb-1 flex items-center gap-2 text-sm text-[--muted]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Agreement
                </div>
                <p className="font-semibold text-[--foreground]">{formatAgreement(job.agreement)}</p>
              </div>
            )}

            {/* Deadline */}
            {job.deadline && (
              <div className="rounded-xl border border-[--card-border] bg-[--card-bg] p-4">
                <div className="mb-1 flex items-center gap-2 text-sm text-[--muted]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Apply By
                </div>
                <p className="font-semibold text-[--foreground]">{formatDate(job.deadline)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Video */}
              {job.videoUrl && (
                <div className="rounded-2xl border border-[--card-border] bg-[--card-bg] overflow-hidden">
                  <video 
                    src={job.videoUrl} 
                    controls 
                    className="w-full aspect-video"
                    poster={job.openGraph}
                  />
                </div>
              )}

              {/* Job Description */}
              {responsibilities && (
                <div className="rounded-2xl border border-[--card-border] bg-[--card-bg] p-6">
                  <h3 className="mb-4 text-xl font-semibold text-[--foreground]">About This Role</h3>
                  <div 
                    className="prose prose-invert max-w-none text-[--muted] prose-headings:text-[--foreground] prose-a:text-[--accent] prose-strong:text-[--foreground]"
                    dangerouslySetInnerHTML={{ __html: responsibilities }}
                  />
                </div>
              )}

              {/* Required Strengths/Skills */}
              {job.strengths && job.strengths.length > 0 && (
                <div className="rounded-2xl border border-[--card-border] bg-[--card-bg] p-6">
                  <h3 className="mb-4 text-xl font-semibold text-[--foreground]">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.strengths.map((strength) => (
                      <span 
                        key={strength.id}
                        className="rounded-lg border border-[--card-border] bg-[--input-bg] px-3 py-2 text-sm"
                      >
                        <span className="text-[--foreground]">{strength.name}</span>
                        {strength.proficiency && (
                          <span className="text-[--muted]"> · {formatProficiency(strength.proficiency)}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {job.languages && job.languages.length > 0 && (
                <div className="rounded-2xl border border-[--card-border] bg-[--card-bg] p-6">
                  <h3 className="mb-4 text-xl font-semibold text-[--foreground]">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.languages.map((lang, idx) => (
                      <span 
                        key={idx}
                        className="rounded-lg px-3 py-2 text-sm"
                        style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                      >
                        {lang.language.name} · {formatFluency(lang.fluency)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Apply Button */}
              <a
                href={`https://torre.ai/post/${job.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-semibold transition-all"
                style={{ 
                  backgroundColor: themeColor,
                  color: "#0f0f12",
                }}
              >
                Apply Now
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {/* Compare Candidate Button */}
              <button
                onClick={() => setIsDialogOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 py-4 text-lg font-semibold transition-all hover:bg-opacity-10"
                style={{ 
                  borderColor: themeColor,
                  color: themeColor,
                  backgroundColor: `${themeColor}10`,
                }}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Analyze Candidate Fit
              </button>

              {/* Location */}
              {job.place && (
                <div className="rounded-2xl border border-[--card-border] bg-[--card-bg] p-6">
                  <h3 className="mb-4 text-lg font-semibold text-[--foreground]">Location</h3>
                  <div className="space-y-3">
                    {job.place.anywhere ? (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                        </svg>
                        <span>Work from anywhere</span>
                      </div>
                    ) : job.place.remote ? (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span>Remote</span>
                      </div>
                    ) : null}
                    
                    {job.place.location && job.place.location.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {job.place.location.slice(0, 10).map((loc, idx) => (
                          <span 
                            key={idx}
                            className="rounded-lg bg-[--input-bg] px-2 py-1 text-sm text-[--muted]"
                          >
                            {loc.id}
                          </span>
                        ))}
                        {job.place.location.length > 10 && (
                          <span className="rounded-lg bg-[--input-bg] px-2 py-1 text-sm text-[--muted]">
                            +{job.place.location.length - 10} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Team Members */}
              {visibleMembers.length > 0 && (
                <div className="rounded-2xl border border-[--card-border] bg-[--card-bg] p-6">
                  <h3 className="mb-4 text-lg font-semibold text-[--foreground]">Team</h3>
                  <div className="space-y-4">
                    {visibleMembers.slice(0, 5).map((member) => (
                      <a
                        key={member.id}
                        href={`https://torre.ai/${member.person.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[--input-bg]"
                      >
                        {member.person.pictureThumbnail ? (
                          <Image 
                            src={member.person.pictureThumbnail}
                            alt={member.person.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div 
                            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                            style={{ backgroundColor: themeColor }}
                          >
                            {member.person.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-[--foreground]">
                            {member.person.name}
                            {member.person.verified && (
                              <svg className="ml-1 inline h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </p>
                          <p className="truncate text-sm text-[--muted]">{member.person.professionalHeadline}</p>
                        </div>
                        {(member.poster || member.leader) && (
                          <span 
                            className="rounded-full px-2 py-0.5 text-xs"
                            style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                          >
                            {member.leader ? "Lead" : "Poster"}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* About Company */}
              {org?.about && (
                <div className="rounded-2xl border border-[--card-border] bg-[--card-bg] p-6">
                  <h3 className="mb-4 text-lg font-semibold text-[--foreground]">About {org.name}</h3>
                  <p className="text-sm text-[--muted] leading-relaxed">{org.about}</p>
                  {org.size && (
                    <p className="mt-3 text-sm text-[--muted]">
                      <span className="font-medium text-[--foreground]">{org.size}</span> employees
                    </p>
                  )}
                </div>
              )}

              {/* Perks */}
              {org?.perks && org.perks !== "[]" && (
                <div className="rounded-2xl border border-[--card-border] bg-[--card-bg] p-6">
                  <h3 className="mb-4 text-lg font-semibold text-[--foreground]">Perks & Benefits</h3>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(org.perks).map((perk: string, idx: number) => (
                      <span 
                        key={idx}
                        className="rounded-lg bg-purple-500/20 px-3 py-1.5 text-sm text-purple-400"
                      >
                        {perk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Posted Date */}
              <div className="text-center text-sm text-[--muted]">
                <p>Posted on {formatDate(job.created)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fit Analysis Dialog */}
      <FitAnalysisDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        job={job}
        themeColor={themeColor}
      />
    </div>
  );
}
