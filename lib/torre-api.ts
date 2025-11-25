/**
 * Torre API Client
 * Centralized API calls to Torre endpoints
 */

// ============================================================================
// Types - Search Opportunities
// ============================================================================

export interface Organization {
  id: number;
  name: string;
  picture?: string;
  publicId?: string;
  websiteUrl?: string;
  about?: string;
  perks?: string;
  theme?: string;
  size?: number;
}

export interface Compensation {
  data: {
    code: string;
    currency: string;
    minAmount: number;
    maxAmount: number;
    periodicity: string;
    minHourlyUSD?: number;
    maxHourlyUSD?: number;
    negotiable?: boolean;
  } | null;
  visible: boolean;
}

export interface Skill {
  name: string;
  experience: string;
  proficiency: string;
}

export interface PlaceLocation {
  id: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: number;
}

export interface Place {
  remote: boolean;
  anywhere: boolean;
  timezone: boolean;
  locationType: string;
  location: PlaceLocation[];
}

export interface JobResult {
  id: string;
  objective: string;
  slug: string;
  tagline: string;
  theme: string;
  type: string;
  opportunity: string;
  organizations: Organization[];
  locations: string[];
  timezones: number[] | null;
  remote: boolean;
  status: string;
  commitment: string;
  compensation: Compensation;
  skills: Skill[];
  place: Place;
  additionalCompensation: string[];
  quickApply: boolean;
}

export interface SearchResponse {
  total: number;
  size: number;
  results: JobResult[];
  offset?: number;
  aggregators?: Record<string, unknown>;
  pagination?: {
    previous: string | null;
    next: string | null;
  };
}

export interface SearchFilters {
  keyword?: string;
  language?: {
    term: string;
    fluency?: string;
  };
  skills?: Array<{
    text: string;
    proficiency?: string;
  }>;
  status?: string;
}

export interface SearchOptions {
  size?: number;
  currency?: string;
  periodicity?: string;
  lang?: string;
}

// ============================================================================
// Types - Job Details
// ============================================================================

export interface Person {
  id: string;
  ggId: string;
  name: string;
  username: string;
  professionalHeadline: string;
  picture?: string;
  pictureThumbnail?: string;
  theme?: string;
  verified?: boolean;
}

export interface Member {
  id: string;
  person: Person;
  manager: boolean;
  poster: boolean;
  member: boolean;
  leader: boolean;
  visible: boolean;
}

export interface Strength {
  id: string;
  code: number;
  name: string;
  experience?: string;
  proficiency?: string;
}

export interface Language {
  language: {
    code: string;
    name: string;
  };
  fluency: string;
}

export interface Detail {
  code: string;
  content: string;
}

export interface Commitment {
  code: string;
  hours?: number;
}

export interface Agreement {
  type: string;
  currencyTaxes?: string;
}

export interface JobCompensation {
  code: string;
  currency: string;
  minAmount: number;
  maxAmount: number;
  periodicity: string;
  visible: boolean;
  negotiable?: boolean;
  estimate?: boolean;
}

export interface JobDetails {
  id: string;
  objective: string;
  tagline: string;
  slug: string;
  theme: string;
  status: string;
  active: boolean;
  published: boolean;
  quickApply: boolean;
  created: string;
  deadline?: string;
  videoUrl?: string;
  openGraph?: string;
  locale: string;
  opportunity: string;
  completion: number;
  owner: Person;
  members: Member[];
  organizations: Organization[];
  strengths: Strength[];
  languages: Language[];
  place: Place;
  details: Detail[];
  commitment: Commitment;
  agreement: Agreement;
  compensation: JobCompensation;
}

// ============================================================================
// Types - Genome/Bio
// ============================================================================

export interface GenomeLocation {
  name: string;
  shortName?: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface GenomePerson {
  professionalHeadline: string;
  completion: number;
  showPhone: boolean;
  created: string;
  verified: boolean;
  weight: number;
  ggId: string;
  locale: string;
  subjectId: number;
  picture?: string;
  pictureThumbnail?: string;
  hasEmail: boolean;
  isTest: boolean;
  name: string;
  links?: Array<{
    id: string;
    name: string;
    address: string;
  }>;
  location?: GenomeLocation;
  theme?: string;
  id: string;
  publicId: string;
  summaryOfBio?: string;
}

export interface GenomeStrength {
  id: string;
  code: number;
  name: string;
  proficiency?: string;
  weight: number;
  recommendations: number;
}

export interface GenomeExperience {
  id: string;
  category: string;
  name: string;
  organizations?: Array<{
    id: number;
    name: string;
    picture?: string;
  }>;
  fromMonth?: string;
  fromYear?: string;
  toMonth?: string;
  toYear?: string;
  remote?: boolean;
  additionalInfo?: string;
  highlighted?: boolean;
}

export interface GenomeLanguage {
  code: string;
  language: string;
  fluency: string;
}

export interface GenomeResponse {
  person: GenomePerson;
  stats: {
    strengths: number;
    publications: number;
    awards: number;
    education: number;
    jobs: number;
    projects: number;
  };
  strengths: GenomeStrength[];
  interests: unknown[];
  experiences: GenomeExperience[];
  awards: GenomeExperience[];
  jobs: GenomeExperience[];
  projects: GenomeExperience[];
  publications: GenomeExperience[];
  education: GenomeExperience[];
  languages: GenomeLanguage[];
}

// ============================================================================
// API Client Class
// ============================================================================

class TorreApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  /**
   * Search for job opportunities
   */
  async searchOpportunities(
    filters: SearchFilters,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const { size = 10, currency = "USD", periodicity = "hourly", lang = "en" } = options;
    
    const queryParams = new URLSearchParams({
      size: size.toString(),
      currency,
      periodicity,
      lang,
    });

    // Build the request body
    const andFilters: Array<Record<string, unknown>> = [];

    if (filters.keyword) {
      andFilters.push({
        keywords: { term: filters.keyword, locale: lang },
      });
    }

    if (filters.language) {
      andFilters.push({
        language: {
          term: filters.language.term,
          fluency: filters.language.fluency || "conversational",
        },
      });
    }

    if (filters.skills) {
      filters.skills.forEach((skill) => {
        andFilters.push({
          "skill/role": {
            text: skill.text,
            proficiency: skill.proficiency || "proficient",
          },
        });
      });
    }

    if (filters.status) {
      andFilters.push({
        status: { code: filters.status },
      });
    }

    const response = await fetch(
      `${this.baseUrl}/api/search?${queryParams.toString()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ and: andFilters }),
      }
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get job details by ID
   */
  async getJobDetails(jobId: string): Promise<JobDetails> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch job details: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user genome/bio by username
   */
  async getGenome(username: string): Promise<GenomeResponse> {
    const response = await fetch(`${this.baseUrl}/api/genome/${username}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch genome: ${response.statusText}`);
    }

    return response.json();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const torreApi = new TorreApiClient();

// ============================================================================
// Convenience Functions (for simpler imports)
// ============================================================================

/**
 * Search for job opportunities
 * @example
 * const results = await searchOpportunities({ keyword: "Designer", status: "open" }, { size: 12 });
 */
export const searchOpportunities = (
  filters: SearchFilters,
  options?: SearchOptions
) => torreApi.searchOpportunities(filters, options);

/**
 * Get job details by ID
 * @example
 * const job = await getJobDetails("PW9yY63W");
 */
export const getJobDetails = (jobId: string) => torreApi.getJobDetails(jobId);

/**
 * Get user genome/bio by username
 * @example
 * const genome = await getGenome("josemanuelpr23");
 */
export const getGenome = (username: string) => torreApi.getGenome(username);

