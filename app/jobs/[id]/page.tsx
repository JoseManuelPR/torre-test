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
import {
  generateCandidateFitPrompt,
  CANDIDATE_FIT_SYSTEM_PROMPT,
  getFitScoreColor,
  parseAIResponse,
  type CandidateFitAnalysisResult,
} from "@/lib/prompts";
import jsPDF from "jspdf";

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

// Helper function to render text with bullet points and formatting
const renderFormattedContent = (html: string): string => {
  if (!html) return "";
  
  // First, decode any HTML entities and clean up the content
  const content = html;
  
  // Check if content has bullet points
  if (/[●•◦▪◾○]/.test(content) || /(?:^|\n)\s*[-*]\s+/.test(content)) {
    // Split by common section headers
    const sections = content.split(/(?=(?:Responsibilities|Requirements|Qualifications|Benefits|About|What you|Who you|Your role|Key|Main|Primary|Essential|Preferred|Nice to have)[^:]*:)/gi);
    
    let result = "";
    
    for (const section of sections) {
      // Check if this section starts with a header
      const headerMatch = section.match(/^((?:Responsibilities|Requirements|Qualifications|Benefits|About|What you|Who you|Your role|Key|Main|Primary|Essential|Preferred|Nice to have)[^:]*:)/i);
      
      if (headerMatch) {
        const header = headerMatch[1];
        const restOfSection = section.slice(header.length);
        
        // Add the header as a strong element
        result += `<p><strong>${header}</strong></p>`;
        
        // Process bullet points in this section
        const bulletItems = restOfSection.split(/\s*(?:●|•|◦|▪|◾|○)\s+/).filter(item => item.trim());
        
        if (bulletItems.length > 0) {
          result += "<ul>";
          for (const item of bulletItems) {
            const cleanItem = item.trim();
            if (cleanItem) {
              result += `<li>${cleanItem}</li>`;
            }
          }
          result += "</ul>";
        }
      } else {
        // Check if section has bullet points
        const bulletItems = section.split(/\s*(?:●|•|◦|▪|◾|○)\s+/).filter(item => item.trim());
        
        if (bulletItems.length > 1) {
          // First item might be introductory text
          const firstItem = bulletItems[0].trim();
          if (firstItem && !firstItem.match(/^[A-Z]/)) {
            result += `<p>${firstItem}</p>`;
            bulletItems.shift();
          }
          
          result += "<ul>";
          for (const item of bulletItems) {
            const cleanItem = item.trim();
            if (cleanItem) {
              result += `<li>${cleanItem}</li>`;
            }
          }
          result += "</ul>";
        } else {
          // No bullets, just add as paragraph
          const trimmed = section.trim();
          if (trimmed) {
            result += `<p>${trimmed}</p>`;
          }
        }
      }
    }
    
    return result;
  }
  
  // If no bullet patterns found, return as-is
  return content;
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

// PDF Generation Function
const generateAnalysisPDF = (
  analysis: CandidateFitAnalysisResult,
  genome: GenomeResponse,
  job: JobDetails
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const addNewPageIfNeeded = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const addSectionTitle = (title: string) => {
    addNewPageIfNeeded(20);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(80, 80, 80);
    pdf.text(title, margin, y);
    y += 8;
  };

  const addBulletList = (items: string[], bulletColor: number[]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);

    items.forEach((item) => {
      const lines = pdf.splitTextToSize(item, contentWidth - 10);
      const blockHeight = lines.length * 5 + 3;
      addNewPageIfNeeded(blockHeight);

      // Bullet point
      pdf.setFillColor(bulletColor[0], bulletColor[1], bulletColor[2]);
      pdf.circle(margin + 2, y - 1.5, 1.5, "F");

      // Text
      pdf.text(lines, margin + 8, y);
      y += blockHeight;
    });
    y += 3;
  };

  const addParagraph = (text: string) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    const lines = pdf.splitTextToSize(text, contentWidth);
    const blockHeight = lines.length * 5 + 5;
    addNewPageIfNeeded(blockHeight);
    pdf.text(lines, margin, y);
    y += blockHeight;
  };

  const addKeyValue = (label: string, value: string) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    const labelLines = pdf.splitTextToSize(`${label}:`, 50);
    pdf.text(labelLines, margin, y);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60);
    const valueLines = pdf.splitTextToSize(value, contentWidth - 55);
    pdf.text(valueLines, margin + 55, y);
    y += Math.max(labelLines.length, valueLines.length) * 5 + 3;
  };

  // Header
  pdf.setFillColor(245, 245, 250);
  pdf.rect(0, 0, pageWidth, 45, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(30, 30, 35);
  pdf.text("Candidate Fit Analysis", margin, 20);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, 30);

  y = 55;

  // Candidate Info
  pdf.setFillColor(250, 250, 255);
  pdf.roundedRect(margin, y - 5, contentWidth, 25, 3, 3, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(30, 30, 35);
  pdf.text(genome.person.name || "Unknown Candidate", margin + 5, y + 5);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text(genome.person.professionalHeadline || "", margin + 5, y + 12);

  y += 30;

  // Job Info
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.text("Position:", margin, y);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(30, 30, 35);
  pdf.text(job.objective, margin + 25, y);
  y += 6;

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(80, 80, 80);
  pdf.text("Company:", margin, y);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(30, 30, 35);
  pdf.text(job.organizations?.[0]?.name || "Unknown", margin + 25, y);
  y += 12;

  // Overall Fit Score
  if (analysis.overallFitScore) {
    pdf.setFillColor(230, 245, 230);
    pdf.roundedRect(margin, y - 5, contentWidth, 20, 3, 3, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(30, 120, 30);
    pdf.text(`Overall Fit Score: ${analysis.overallFitScore}`, margin + 5, y + 5);
    y += 25;
  }

  // Job Summary
  if (analysis.jobSummary) {
    addSectionTitle("Job Summary");
    addParagraph(String(analysis.jobSummary));
    y += 5;
  }

  // Matching Skills
  if (analysis.matchingSkillsAndStrengths && analysis.matchingSkillsAndStrengths.length > 0) {
    addSectionTitle("Matching Skills & Strengths");
    addBulletList(analysis.matchingSkillsAndStrengths, [76, 175, 80]); // Green
  }

  // Areas for Development
  if (analysis.areasForDevelopment && analysis.areasForDevelopment.length > 0) {
    addSectionTitle("Areas for Development");
    addBulletList(analysis.areasForDevelopment, [255, 193, 7]); // Yellow
  }

  // Recommendations
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    addSectionTitle("Recommendations");
    addBulletList(analysis.recommendations, [66, 165, 245]); // Blue
  }

  // Career Trajectory
  if (analysis.careerTrajectory) {
    addSectionTitle("Career Trajectory & Growth");

    if (analysis.careerTrajectory.summary) {
      addParagraph(analysis.careerTrajectory.summary);
    }

    if (analysis.careerTrajectory.growthIndicators && analysis.careerTrajectory.growthIndicators.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(120, 80, 180);
      addNewPageIfNeeded(10);
      pdf.text("Growth Indicators:", margin, y);
      y += 6;
      addBulletList(analysis.careerTrajectory.growthIndicators, [156, 39, 176]); // Purple
    }

    if (analysis.careerTrajectory.alignmentWithRole) {
      addNewPageIfNeeded(15);
      addKeyValue("Role Alignment", analysis.careerTrajectory.alignmentWithRole);
    }
  }

  // Location & Work Style
  if (analysis.locationAndWorkStyle) {
    addSectionTitle("Location & Work Style");

    if (analysis.locationAndWorkStyle.locationCompatibility) {
      addKeyValue("Location", analysis.locationAndWorkStyle.locationCompatibility);
    }
    if (analysis.locationAndWorkStyle.remoteWorkAlignment) {
      addKeyValue("Remote Work", analysis.locationAndWorkStyle.remoteWorkAlignment);
    }
    if (analysis.locationAndWorkStyle.commitmentLevelMatch) {
      addKeyValue("Commitment", analysis.locationAndWorkStyle.commitmentLevelMatch);
    }

    if (analysis.locationAndWorkStyle.potentialConcerns && analysis.locationAndWorkStyle.potentialConcerns.length > 0) {
      y += 3;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(255, 152, 0);
      addNewPageIfNeeded(10);
      pdf.text("Potential Concerns:", margin, y);
      y += 6;
      addBulletList(analysis.locationAndWorkStyle.potentialConcerns, [255, 152, 0]); // Orange
    }
  }

  // Professional Credibility
  if (analysis.professionalCredibility) {
    addSectionTitle("Professional Credibility");

    if (analysis.professionalCredibility.profileQuality) {
      addKeyValue("Profile Quality", analysis.professionalCredibility.profileQuality);
    }

    if (analysis.professionalCredibility.professionalPresence && analysis.professionalCredibility.professionalPresence.length > 0) {
      y += 3;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(0, 150, 136);
      addNewPageIfNeeded(10);
      pdf.text("Professional Presence:", margin, y);
      y += 6;
      addBulletList(analysis.professionalCredibility.professionalPresence, [0, 150, 136]); // Teal
    }

    if (analysis.professionalCredibility.credibilityIndicators && analysis.professionalCredibility.credibilityIndicators.length > 0) {
      y += 3;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(0, 150, 136);
      addNewPageIfNeeded(10);
      pdf.text("Credibility Indicators:", margin, y);
      y += 6;
      addBulletList(analysis.professionalCredibility.credibilityIndicators, [0, 150, 136]); // Teal
    }
  }

  // Footer
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} of ${totalPages} • Torre Candidate Fit Analysis`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  // Download
  const fileName = `Candidate_Fit_${genome.person.name?.replace(/\s+/g, "_") || "Unknown"}_${job.objective.replace(/\s+/g, "_").substring(0, 30)}.pdf`;
  pdf.save(fileName);
};

// Candidate Fit Dialog Component
interface FitAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobDetails;
  themeColor: string;
}

function FitAnalysisDialog({ isOpen, onClose, job, themeColor }: FitAnalysisDialogProps) {
  const [username, setUsername] = useState("");
  const [step, setStep] = useState<"input" | "loading" | "result">("input");
  const [genome, setGenome] = useState<GenomeResponse | null>(null);
  const [analysis, setAnalysis] = useState<CandidateFitAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!username.trim()) return;

    setStep("loading");
    setError(null);

    try {
      // 1. Fetch genome data
      const genomeData = await getGenome(username.trim());
      setGenome(genomeData);

      // 2. Generate the prompt using the prompts library
      const prompt = generateCandidateFitPrompt({ job, genome: genomeData });

      // 3. Send to AI for analysis
      const aiResponse = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          systemPrompt: CANDIDATE_FIT_SYSTEM_PROMPT,
        }),
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(errorData.error || "AI analysis failed");
      }

      const aiData = await aiResponse.json();
      
      // Parse the AI response using the utility function
      const parsedAnalysis = parseAIResponse(aiData.text);
      setAnalysis(parsedAnalysis);
      setStep("result");
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
      <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-[var(--card-border)] bg-[var(--background)] shadow-2xl">
        {/* Header */}
        <div 
          className="flex items-center justify-between border-b border-[var(--card-border)] px-6 py-4"
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
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Candidate Fit Analysis</h2>
              <p className="text-sm text-[var(--muted)]">AI-powered job matching</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--card-bg)] hover:text-[var(--foreground)]"
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
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Enter Candidate Username</h3>
                <p className="mb-4 text-sm text-[var(--muted)]">
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
                    className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                    placeholder="e.g., josemanuelpr23"
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
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                <h4 className="mb-3 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">Analyzing for Position</h4>
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
                    <h3 className="font-semibold text-[var(--foreground)]">{job.objective}</h3>
                    <p className="text-sm text-[var(--muted)]">{job.organizations?.[0]?.name}</p>
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
              <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Analyzing Candidate Fit</h3>
              <p className="text-center text-[var(--muted)]">
                Fetching profile data and running AI analysis...<br />
                This may take a few seconds.
              </p>
            </div>
          )}

          {/* Result Step */}
          {step === "result" && analysis && genome && (
            <div className="space-y-6">
              {/* Candidate Header */}
              <div className="flex items-center gap-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
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
                  <h3 className="font-semibold text-[var(--foreground)]">{genome.person.name}</h3>
                  <p className="text-sm text-[var(--muted)]">{genome.person.professionalHeadline}</p>
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
              {analysis.jobSummary && (
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${themeColor}25` }}
                    >
                      <svg className="h-5 w-5" style={{ color: themeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--foreground)]">Job Summary</h3>
                  </div>
                  <div className="prose prose-invert max-w-none text-[var(--muted)] prose-p:leading-relaxed">
                    {String(analysis.jobSummary).split("\n\n").map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Fit Analysis Section */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${themeColor}25` }}
                    >
                      <svg className="h-5 w-5" style={{ color: themeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--foreground)]">Fit Analysis</h3>
                  </div>
                  {/* Overall Fit Score Badge */}
                  {analysis.overallFitScore && (
                    <span className={`rounded-full px-4 py-2 text-sm font-bold ${getFitScoreColor(String(analysis.overallFitScore)).bg} ${getFitScoreColor(String(analysis.overallFitScore)).text}`}>
                      {String(analysis.overallFitScore)}
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Matching Skills */}
                  {analysis.matchingSkillsAndStrengths && analysis.matchingSkillsAndStrengths.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <h4 className="font-semibold text-[var(--foreground)]">Matching Skills & Strengths</h4>
                      </div>
                      <ul className="space-y-2 pl-7">
                        {analysis.matchingSkillsAndStrengths.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[var(--muted)]">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas for Development */}
                  {analysis.areasForDevelopment && analysis.areasForDevelopment.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h4 className="font-semibold text-[var(--foreground)]">Areas for Development</h4>
                      </div>
                      <ul className="space-y-2 pl-7">
                        {analysis.areasForDevelopment.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[var(--muted)]">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h4 className="font-semibold text-[var(--foreground)]">Recommendations</h4>
                      </div>
                      <ul className="space-y-2 pl-7">
                        {analysis.recommendations.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[var(--muted)]">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Career Trajectory Section */}
              {analysis.careerTrajectory && (
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${themeColor}25` }}
                    >
                      <svg className="h-5 w-5" style={{ color: themeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--foreground)]">Career Trajectory & Growth</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Summary */}
                    {analysis.careerTrajectory.summary && (
                      <p className="text-[var(--muted)] leading-relaxed">
                        {analysis.careerTrajectory.summary}
                      </p>
                    )}

                    {/* Growth Indicators */}
                    {analysis.careerTrajectory.growthIndicators && analysis.careerTrajectory.growthIndicators.length > 0 && (
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          <h4 className="font-semibold text-[var(--foreground)]">Growth Indicators</h4>
                        </div>
                        <ul className="space-y-2 pl-7">
                          {analysis.careerTrajectory.growthIndicators.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[var(--muted)]">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Alignment with Role */}
                    {analysis.careerTrajectory.alignmentWithRole && (
                      <div className="rounded-xl bg-purple-500/10 p-4">
                        <p className="text-sm text-[var(--muted)]">
                          <span className="font-semibold text-purple-400">Role Alignment: </span>
                          {analysis.careerTrajectory.alignmentWithRole}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location & Work Style Section */}
              {analysis.locationAndWorkStyle && (
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${themeColor}25` }}
                    >
                      <svg className="h-5 w-5" style={{ color: themeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--foreground)]">Location & Work Style</h3>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Location Compatibility */}
                    {analysis.locationAndWorkStyle.locationCompatibility && (
                      <div className="rounded-xl bg-[var(--input-bg)] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h5 className="text-sm font-semibold text-[var(--foreground)]">Location</h5>
                        </div>
                        <p className="text-sm text-[var(--muted)]">{analysis.locationAndWorkStyle.locationCompatibility}</p>
                      </div>
                    )}

                    {/* Remote Work */}
                    {analysis.locationAndWorkStyle.remoteWorkAlignment && (
                      <div className="rounded-xl bg-[var(--input-bg)] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <h5 className="text-sm font-semibold text-[var(--foreground)]">Remote Work</h5>
                        </div>
                        <p className="text-sm text-[var(--muted)]">{analysis.locationAndWorkStyle.remoteWorkAlignment}</p>
                      </div>
                    )}

                    {/* Commitment Level */}
                    {analysis.locationAndWorkStyle.commitmentLevelMatch && (
                      <div className="rounded-xl bg-[var(--input-bg)] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h5 className="text-sm font-semibold text-[var(--foreground)]">Commitment</h5>
                        </div>
                        <p className="text-sm text-[var(--muted)]">{analysis.locationAndWorkStyle.commitmentLevelMatch}</p>
                      </div>
                    )}
                  </div>

                  {/* Potential Concerns */}
                  {analysis.locationAndWorkStyle.potentialConcerns && analysis.locationAndWorkStyle.potentialConcerns.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-3 flex items-center gap-2">
                        <svg className="h-5 w-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h4 className="font-semibold text-[var(--foreground)]">Potential Concerns</h4>
                      </div>
                      <ul className="space-y-2 pl-7">
                        {analysis.locationAndWorkStyle.potentialConcerns.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[var(--muted)]">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Professional Credibility Section */}
              {analysis.professionalCredibility && (
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${themeColor}25` }}
                    >
                      <svg className="h-5 w-5" style={{ color: themeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--foreground)]">Professional Credibility</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Profile Quality */}
                    {analysis.professionalCredibility.profileQuality && (
                      <div className="rounded-xl bg-teal-500/10 p-4">
                        <p className="text-sm text-[var(--muted)]">
                          <span className="font-semibold text-teal-400">Profile Quality: </span>
                          {analysis.professionalCredibility.profileQuality}
                        </p>
                      </div>
                    )}

                    {/* Professional Presence */}
                    {analysis.professionalCredibility.professionalPresence && analysis.professionalCredibility.professionalPresence.length > 0 && (
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <svg className="h-5 w-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <h4 className="font-semibold text-[var(--foreground)]">Professional Presence</h4>
                        </div>
                        <ul className="space-y-2 pl-7">
                          {analysis.professionalCredibility.professionalPresence.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[var(--muted)]">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Credibility Indicators */}
                    {analysis.professionalCredibility.credibilityIndicators && analysis.professionalCredibility.credibilityIndicators.length > 0 && (
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <svg className="h-5 w-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          <h4 className="font-semibold text-[var(--foreground)]">Credibility Indicators</h4>
                        </div>
                        <ul className="space-y-2 pl-7">
                          {analysis.professionalCredibility.credibilityIndicators.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[var(--muted)]">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => generateAnalysisPDF(analysis, genome, job)}
                  className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all hover:opacity-90"
                  style={{ 
                    backgroundColor: themeColor,
                    color: "#0f0f12",
                  }}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    setStep("input");
                    setUsername("");
                    setGenome(null);
                    setAnalysis(null);
                  }}
                  className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-6 py-3 font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--input-bg)]"
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
      <div className="min-h-screen bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <div className="h-6 w-32 rounded loading-shimmer mb-4" />
            <div className="h-12 w-3/4 rounded loading-shimmer mb-4" />
            <div className="h-6 w-1/2 rounded loading-shimmer" />
          </div>
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8">
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
      <div className="min-h-screen bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-12">
            <svg className="mx-auto mb-4 h-16 w-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mb-2 text-2xl font-semibold text-red-400">Job Not Found</h2>
            <p className="mb-6 text-[var(--muted)]">{error || "This job posting may have been removed or is no longer available."}</p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--background)] transition-all hover:bg-[var(--accent-dark)]"
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
    <div className="min-h-screen bg-[var(--background)]">
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
            className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
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
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{org?.name || "Unknown Company"}</h2>
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
                <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-bold text-[var(--background)]">
                  Quick Apply
                </span>
              )}
              {job.place?.remote && (
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-400">
                  Remote
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
              {job.objective}
            </h1>
            <p className="mt-3 text-lg text-[var(--muted)]">{job.tagline}</p>
          </div>

          {/* Key Info Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Compensation */}
            {compensation && (
              <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
                <div className="mb-1 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Compensation
                </div>
                <p className="font-semibold text-[var(--foreground)]">{compensation}</p>
                {job.compensation?.negotiable && (
                  <p className="text-xs text-[var(--muted)]">Negotiable</p>
                )}
              </div>
            )}

            {/* Commitment */}
            {job.commitment && (
              <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
                <div className="mb-1 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Commitment
                </div>
                <p className="font-semibold text-[var(--foreground)]">{formatCommitment(job.commitment)}</p>
              </div>
            )}

            {/* Agreement */}
            {job.agreement && (
              <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
                <div className="mb-1 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Agreement
                </div>
                <p className="font-semibold text-[var(--foreground)]">{formatAgreement(job.agreement)}</p>
              </div>
            )}

            {/* Deadline */}
            {job.deadline && (
              <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
                <div className="mb-1 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Apply By
                </div>
                <p className="font-semibold text-[var(--foreground)]">{formatDate(job.deadline)}</p>
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
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden">
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
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                  <h3 className="mb-4 text-xl font-semibold text-[var(--foreground)]">About This Role</h3>
                  <div 
                    className="prose prose-invert max-w-none text-[var(--muted)] prose-headings:text-[var(--foreground)] prose-a:text-[var(--accent)] prose-strong:text-[var(--foreground)]"
                    dangerouslySetInnerHTML={{ __html: renderFormattedContent(responsibilities) }}
                  />
                </div>
              )}

              {/* Required Strengths/Skills */}
              {job.strengths && job.strengths.length > 0 && (
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                  <h3 className="mb-4 text-xl font-semibold text-[var(--foreground)]">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.strengths.map((strength) => (
                      <span 
                        key={strength.id}
                        className="rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
                      >
                        <span className="text-[var(--foreground)]">{strength.name}</span>
                        {strength.proficiency && (
                          <span className="text-[var(--muted)]"> · {formatProficiency(strength.proficiency)}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {job.languages && job.languages.length > 0 && (
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                  <h3 className="mb-4 text-xl font-semibold text-[var(--foreground)]">Languages</h3>
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
                Analyze Candidate with AI
              </button>

              {/* Location */}
              {job.place && (
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                  <h3 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Location</h3>
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
                            className="rounded-lg bg-[var(--input-bg)] px-2 py-1 text-sm text-[var(--muted)]"
                          >
                            {loc.id}
                          </span>
                        ))}
                        {job.place.location.length > 10 && (
                          <span className="rounded-lg bg-[var(--input-bg)] px-2 py-1 text-sm text-[var(--muted)]">
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
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                  <h3 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Team</h3>
                  <div className="space-y-4">
                    {visibleMembers.slice(0, 5).map((member) => (
                      <a
                        key={member.id}
                        href={`https://torre.ai/${member.person.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[var(--input-bg)]"
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
                          <p className="truncate font-medium text-[var(--foreground)]">
                            {member.person.name}
                            {member.person.verified && (
                              <svg className="ml-1 inline h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </p>
                          <p className="truncate text-sm text-[var(--muted)]">{member.person.professionalHeadline}</p>
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
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                  <h3 className="mb-4 text-lg font-semibold text-[var(--foreground)]">About {org.name}</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{org.about}</p>
                  {org.size && (
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      <span className="font-medium text-[var(--foreground)]">{org.size}</span> employees
                    </p>
                  )}
                </div>
              )}

              {/* Perks */}
              {org?.perks && org.perks !== "[]" && (
                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
                  <h3 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Perks & Benefits</h3>
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
              <div className="text-center text-sm text-[var(--muted)]">
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
