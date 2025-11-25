"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  searchOpportunities, 
  type JobResult, 
  type Compensation, 
  type Place 
} from "@/lib/torre-api";

// Helper functions for formatting
const formatType = (type: string): string => {
  const typeMap: Record<string, string> = {
    "full-time-employment": "Full-time",
    "part-time-employment": "Part-time",
    "freelance": "Freelance",
    "internship": "Internship",
    "flexible-jobs": "Flexible",
    "contract": "Contract",
  };
  return typeMap[type] || type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatProficiency = (proficiency: string): string => {
  const profMap: Record<string, string> = {
    "no-experience-interested": "Interested",
    "proficient": "Proficient",
    "expert": "Expert",
    "master": "Master",
  };
  return profMap[proficiency] || proficiency.replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatCompensation = (compensation: Compensation | null | undefined): string => {
  if (!compensation || !compensation.visible || !compensation.data) return "Compensation not provided";
  const { currency, minAmount, maxAmount, periodicity } = compensation.data;
  if (!currency || minAmount == null || maxAmount == null) return "Compensation not provided";
  // Check if both min and max are 0
  if (minAmount === 0 && maxAmount === 0) return "Compensation not provided";
  const formatNumber = (n: number) => n.toLocaleString();
  const period = periodicity === "monthly" ? "/mo" : periodicity === "yearly" ? "/yr" : periodicity === "hourly" ? "/hr" : `/${periodicity}`;
  return `${currency} ${formatNumber(minAmount)} - ${formatNumber(maxAmount)}${period}`;
};

const formatLocationType = (place: Place): string => {
  if (place.anywhere) return "Anywhere";
  if (place.remote) return "Remote";
  return place.locationType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// Theme color mapping
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

// Job Card Component
const JobCard = ({ job }: { job: JobResult }) => {
  const themeColor = getThemeColor(job.theme);
  const compensation = formatCompensation(job.compensation);
  const org = job.organizations[0];

  return (
    <div 
      className="group relative flex h-full flex-col rounded-2xl border border-[--card-border] bg-[--card-bg] p-6 transition-all duration-300 hover:border-transparent hover:shadow-xl"
      style={{ 
        "--hover-glow": themeColor,
        boxShadow: "0 0 0 0 transparent",
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 30px ${themeColor}30, 0 0 60px ${themeColor}15`;
        e.currentTarget.style.borderColor = `${themeColor}50`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 0 transparent";
        e.currentTarget.style.borderColor = "var(--card-border)";
      }}
    >

      {/* Header: Organization & Status */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Organization Logo */}
          {org?.picture ? (
            <Image 
              src={org.picture} 
              alt={org.name}
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <div 
              className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{ backgroundColor: themeColor }}
            >
              {org?.name?.charAt(0) || "?"}
            </div>
          )}
          <div>
            <p className="text-sm text-[--muted]">{org?.name || "Unknown Company"}</p>
            <div className="flex items-center gap-2 mt-1">
              <span 
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: `${themeColor}25`, color: themeColor }}
              >
                {formatType(job.type)}
              </span>
              {job.remote && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  Remote
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Status */}
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
          job.status === "open" 
            ? "bg-green-500/20 text-green-400" 
            : "bg-red-500/20 text-red-400"
        }`}>
          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </span>
      </div>

      {/* Title */}
      <h3 
        className="mb-2 text-xl font-semibold transition-colors group-hover:text-[--accent]"
        style={{ color: "var(--foreground)" }}
      >
        {job.objective}
      </h3>

      {/* Tagline */}
      <p className="mb-4 line-clamp-2 text-sm text-[--muted]">
        {job.tagline}
      </p>

      {/* Compensation */}
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-5 w-5 text-[--accent]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`font-semibold ${compensation === "Compensation not provided" ? "text-[--muted] italic" : "text-[--foreground]"}`}>
          {compensation}
        </span>
      </div>

      {/* Locations */}
      {job.locations && job.locations.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {job.locations.slice(0, 5).map((location, idx) => (
              <span 
                key={idx}
                className="rounded-lg bg-[--input-bg] px-2 py-1 text-xs text-[--muted]"
              >
                {location}
              </span>
            ))}
            {job.locations.length > 5 && (
              <span className="rounded-lg bg-[--input-bg] px-2 py-1 text-xs text-[--muted]">
                +{job.locations.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Timezones */}
      {job.timezones && job.timezones.length > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm text-[--muted]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>UTC {job.timezones.map(tz => tz >= 0 ? `+${tz}` : tz).join(", ")}</span>
        </div>
      )}

      {/* Place Badge */}
      <div className="mb-4">
        <span 
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium"
          style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {formatLocationType(job.place)}
        </span>
      </div>

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[--muted]">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.slice(0, 6).map((skill, idx) => (
              <span 
                key={idx}
                className="rounded-lg border border-[--card-border] bg-[--input-bg] px-2 py-1 text-xs"
              >
                <span className="text-[--foreground]">{skill.name}</span>
                <span className="text-[--muted]"> · {formatProficiency(skill.proficiency)}</span>
              </span>
            ))}
            {job.skills.length > 6 && (
              <span className="rounded-lg bg-[--input-bg] px-2 py-1 text-xs text-[--muted]">
                +{job.skills.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Additional Compensation */}
      {job.additionalCompensation && job.additionalCompensation.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[--muted]">Benefits</p>
          <div className="flex flex-wrap gap-1.5">
            {job.additionalCompensation.map((comp, idx) => (
              <span 
                key={idx}
                className="rounded-lg bg-purple-500/20 px-2 py-1 text-xs text-purple-400"
              >
                {comp}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Spacer to push button to bottom */}
      <div className="flex-1" />

      {/* Action Button - Always at bottom */}
      <Link 
        href={`/jobs/${job.id}`}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all"
        style={{ 
          backgroundColor: `${themeColor}20`,
          color: themeColor,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = themeColor;
          e.currentTarget.style.color = "#0f0f12";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = `${themeColor}20`;
          e.currentTarget.style.color = themeColor;
        }}
      >
        {/* Quick Apply Lightning Icon */}
        {job.quickApply && (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-label="Quick Apply">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        )}
        View Position
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
    </div>
  );
};

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState("Designer");
  const [results, setResults] = useState<JobResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState(12);

  const searchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchOpportunities(
        { keyword: searchTerm, status: "open" },
        { size }
      );
      setResults(data.results || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, size]);

  useEffect(() => {
    searchJobs();
  }, [searchJobs]);

  return (
    <div className="min-h-screen bg-[--background] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link 
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-[--muted] transition-colors hover:text-[--foreground]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to API Tester
          </Link>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="text-[--foreground]">Find Your Next</span>
            <span className="text-[--accent]"> Opportunity</span>
          </h1>
          <p className="text-lg text-[--muted]">
            Discover {total.toLocaleString()} open positions matching your search
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-[--muted]">Search Jobs</label>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[--muted]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchJobs()}
                className="w-full rounded-xl border border-[--card-border] bg-[--card-bg] py-4 pl-12 pr-4 text-[--foreground] placeholder-[--muted] outline-none transition-colors focus:border-[--accent] focus:ring-1 focus:ring-[--accent]"
                placeholder="Search by keyword (e.g., Designer, Engineer, Marketing)"
              />
            </div>
          </div>
          <div className="w-full sm:w-32">
            <label className="mb-2 block text-sm font-medium text-[--muted]">Results</label>
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full rounded-xl border border-[--card-border] bg-[--card-bg] px-4 py-4 text-[--foreground] outline-none transition-colors focus:border-[--accent] focus:ring-1 focus:ring-[--accent]"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
          <button
            onClick={searchJobs}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-[--accent] px-8 py-4 font-semibold text-white transition-all hover:bg-[--accent-dark] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[--background] border-t-transparent" />
                Searching...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </>
            )}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-red-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: size }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[--card-border] bg-[--card-bg] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl loading-shimmer" />
                  <div className="flex-1">
                    <div className="mb-2 h-4 w-24 rounded loading-shimmer" />
                    <div className="h-3 w-16 rounded loading-shimmer" />
                  </div>
                </div>
                <div className="mb-3 h-6 w-3/4 rounded loading-shimmer" />
                <div className="mb-2 h-4 w-full rounded loading-shimmer" />
                <div className="mb-4 h-4 w-2/3 rounded loading-shimmer" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded-lg loading-shimmer" />
                  <div className="h-6 w-20 rounded-lg loading-shimmer" />
                  <div className="h-6 w-14 rounded-lg loading-shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Grid */}
        {!loading && results.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && results.length === 0 && (
          <div className="rounded-2xl border border-[--card-border] bg-[--card-bg] p-12 text-center">
            <svg className="mx-auto mb-4 h-16 w-16 text-[--muted]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mb-2 text-xl font-semibold text-[--foreground]">No jobs found</h3>
            <p className="text-[--muted]">Try adjusting your search term or filters</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-[--muted]">
          <p>Powered by Torre.co API</p>
        </footer>
      </div>
    </div>
  );
}

