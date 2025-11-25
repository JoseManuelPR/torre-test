"use client";

import { useState } from "react";
import { 
  searchOpportunities as searchOpportunitiesApi,
  getJobDetails as getJobDetailsApi,
  getGenome as getGenomeApi
} from "@/lib/torre-api";

interface ApiResponse {
  data: unknown;
  status: number;
  loading: boolean;
  error: string | null;
}

// JSON syntax highlighter - moved outside component
const syntaxHighlight = (json: string): string => {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "json-number";
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "json-key";
          } else {
            cls = "json-string";
          }
        } else if (/true|false/.test(match)) {
          cls = "json-boolean";
        } else if (/null/.test(match)) {
          cls = "json-null";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
};

// ResponsePanel component - moved outside of Home component
const ResponsePanel = ({ response, title }: { response: ApiResponse; title: string }) => (
  <div className="mt-4">
    {response.loading && (
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <span className="text-[var(--muted)]">Fetching {title}...</span>
        </div>
      </div>
    )}
    {response.error && (
      <div className="animate-fade-in rounded-xl border border-red-500/30 bg-red-950/20 p-6">
        <div className="flex items-center gap-2 text-red-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Error:</span>
          <span>{response.error}</span>
        </div>
      </div>
    )}
    {typeof response.data !== "undefined" && response.data !== null && (
      <div className="animate-fade-in rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
            <span className="ml-2 text-sm text-[var(--muted)]">Response</span>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            response.status >= 200 && response.status < 300
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}>
            Status: {response.status}
          </span>
        </div>
        <pre className="max-h-96 overflow-auto p-4 text-sm leading-relaxed">
          <code
            dangerouslySetInnerHTML={{
              __html: syntaxHighlight(
                JSON.stringify(response.data, null, 2)
              ),
            }}
          />
        </pre>
      </div>
    )}
  </div>
);

export default function Home() {
  // State for each API
  const [searchParams, setSearchParams] = useState({
    keyword: "Designer",
    size: "5",
  });
  const [jobId, setJobId] = useState("PW9yY63W");
  const [username, setUsername] = useState("josemanuelpr23");

  const [searchResponse, setSearchResponse] = useState<ApiResponse>({
    data: null,
    status: 0,
    loading: false,
    error: null,
  });
  const [jobResponse, setJobResponse] = useState<ApiResponse>({
    data: null,
    status: 0,
    loading: false,
    error: null,
  });
  const [genomeResponse, setGenomeResponse] = useState<ApiResponse>({
    data: null,
    status: 0,
    loading: false,
    error: null,
  });

  // API 1: Search Opportunities
  const searchOpportunities = async () => {
    setSearchResponse({ data: null, status: 0, loading: true, error: null });
    try {
      const data = await searchOpportunitiesApi(
        { keyword: searchParams.keyword, status: "open" },
        { size: parseInt(searchParams.size) }
      );
      setSearchResponse({ data, status: 200, loading: false, error: null });
    } catch (err) {
      setSearchResponse({
        data: null,
        status: 0,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // API 2: Get Job Details
  const getJobDetails = async () => {
    setJobResponse({ data: null, status: 0, loading: true, error: null });
    try {
      const data = await getJobDetailsApi(jobId);
      setJobResponse({ data, status: 200, loading: false, error: null });
    } catch (err) {
      setJobResponse({
        data: null,
        status: 0,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // API 3: Get Genome/Bio
  const getGenome = async () => {
    setGenomeResponse({ data: null, status: 0, loading: true, error: null });
    try {
      const data = await getGenomeApi(username);
      setGenomeResponse({ data, status: 200, loading: false, error: null });
    } catch (err) {
      setGenomeResponse({
        data: null,
        status: 0,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-sm font-medium text-[var(--accent)]">API Testing Suite</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="text-[var(--foreground)]">Torre</span>
            <span className="text-[var(--accent)]">.co</span>
            <span className="text-[var(--foreground)]"> APIs</span>
          </h1>
          <p className="text-lg text-[var(--muted)]">
            Test and explore Torre&apos;s public API endpoints
          </p>
        </div>

        <div className="space-y-8">
          {/* API 1: Search Opportunities */}
          <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 transition-all hover:border-[var(--accent)]/30">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/20 text-sm font-bold text-[var(--accent)]">1</span>
                <h2 className="text-xl font-semibold">Search Opportunities</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono text-blue-400">POST</span>
                <code className="text-xs">search.torre.co/opportunities/_search</code>
              </div>
            </div>

            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Keyword</label>
                <input
                  type="text"
                  value={searchParams.keyword}
                  onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="e.g., Designer, Engineer"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Results Size</label>
                <input
                  type="number"
                  value={searchParams.size}
                  onChange={(e) => setSearchParams({ ...searchParams, size: e.target.value })}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                  placeholder="5"
                  min="1"
                  max="50"
                />
              </div>
            </div>

            <button
              onClick={searchOpportunities}
              disabled={searchResponse.loading}
              className="group relative w-full overflow-hidden rounded-xl bg-[var(--accent)] px-6 py-4 font-semibold text-[var(--background)] transition-all hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Jobs
              </span>
            </button>

            <ResponsePanel response={searchResponse} title="opportunities" />
          </section>

          {/* API 2: Job Details */}
          <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 transition-all hover:border-[var(--accent)]/30">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/20 text-sm font-bold text-[var(--accent)]">2</span>
                <h2 className="text-xl font-semibold">Get Job Details</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-emerald-400">GET</span>
                <code className="text-xs">torre.ai/api/suite/opportunities/&#123;job-id&#125;</code>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Job ID</label>
              <input
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] sm:w-80"
                placeholder="e.g., PW9yY63W"
              />
            </div>

            <button
              onClick={getJobDetails}
              disabled={jobResponse.loading}
              className="group relative w-full overflow-hidden rounded-xl bg-[var(--accent)] px-6 py-4 font-semibold text-[var(--background)] transition-all hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Fetch Job Details
              </span>
            </button>

            <ResponsePanel response={jobResponse} title="job details" />
          </section>

          {/* API 3: User Genome */}
          <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 transition-all hover:border-[var(--accent)]/30">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/20 text-sm font-bold text-[var(--accent)]">3</span>
                <h2 className="text-xl font-semibold">Get User Genome</h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-emerald-400">GET</span>
                <code className="text-xs">torre.ai/api/genome/bios/&#123;username&#125;</code>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] sm:w-80"
                placeholder="e.g., josemanuelpr23"
              />
            </div>

            <button
              onClick={getGenome}
              disabled={genomeResponse.loading}
              className="group relative w-full overflow-hidden rounded-xl bg-[var(--accent)] px-6 py-4 font-semibold text-[var(--background)] transition-all hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Fetch User Profile
              </span>
            </button>

            <ResponsePanel response={genomeResponse} title="user genome" />
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-[var(--muted)]">
          <p>Built for testing Torre.co public APIs</p>
        </footer>
      </div>
    </div>
  );
}
