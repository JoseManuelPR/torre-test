# TORRE - TEST

A modern Next.js application for exploring and testing Torre.ai's public APIs, featuring advanced job search capabilities and AI-powered candidate analysis.

## 🚀 Features

- **API Testing Suite**: Interactive interface to test Torre.ai's 3 public APIs
- **Job Search**: Visual job explorer with filters and search functionality
- **Job Details**: Detailed pages with comprehensive information for each position
- **AI Candidate Analysis**: Intelligent compatibility analysis between candidates and jobs using Google Gemini
- **PDF Generation**: Export candidate analyses to PDF for sharing or archiving
- **Modern UI**: Beautiful interface designed with Tailwind CSS and dynamic themes

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **AI**: Google Gemini (via @ai-sdk/google)
- **PDFs**: jsPDF
- **Screenshots**: html2canvas

## 📁 Project Structure

```
torre-test/
├── app/
│   ├── api/                    # API Routes (Next.js)
│   │   ├── ai/                # AI endpoint (POST /api/ai)
│   │   ├── genome/            # Genome API (GET /api/genome/[username])
│   │   ├── jobs/              # Jobs API (GET /api/jobs/[id])
│   │   └── search/            # Search API (POST /api/search)
│   ├── jobs/                  # Job pages
│   │   ├── page.tsx           # Job listing with search
│   │   └── [id]/              # Individual job detail
│   ├── layout.tsx             # Main layout
│   ├── page.tsx               # Home page (API Testing Suite)
│   └── globals.css             # Global styles
├── lib/
│   ├── ai.ts                  # AI configuration
│   ├── prompts.ts             # Prompts and analysis utilities
│   └── torre-api.ts           # Torre.ai API client
└── public/                    # Static assets
```

## 🔌 API Routes

### 1. POST `/api/search`
Searches for job opportunities on Torre.ai.

**Query Parameters:**
- `size` (optional): Number of results (default: 10)

**Request Body:**
```json
{
  "and": [
    {
      "keywords": {
        "term": "Designer",
        "locale": "en"
      }
    },
    {
      "status": {
        "code": "open"
      }
    }
  ]
}
```

**Response:**
```json
{
  "total": 100,
  "size": 10,
  "results": [...],
  "offset": 0,
  "aggregators": {...},
  "pagination": {...}
}
```

### 2. GET `/api/jobs/[id]`
Gets complete details for a specific job.

**Response:**
```json
{
  "id": "PW9yY63W",
  "objective": "Senior Designer",
  "tagline": "...",
  "organizations": [...],
  "compensation": {...},
  "strengths": [...],
  "languages": [...],
  ...
}
```

### 3. GET `/api/genome/[username]`
Gets the complete profile (genome) of a Torre user.

**Response:**
```json
{
  "person": {...},
  "stats": {...},
  "strengths": [...],
  "experiences": [...],
  "jobs": [...],
  "projects": [...],
  ...
}
```

### 4. POST `/api/ai`
Generates responses using Google Gemini AI.

**Request Body:**
```json
{
  "prompt": "Analyze this candidate...",
  "systemPrompt": "You are an expert in...",
  "model": "gemini-2.5-flash-lite" // optional
}
```

**Response:**
```json
{
  "text": "Candidate analysis...",
  "usage": {...},
  "finishReason": "stop"
}
```

## 🎯 Pages and Routes

### `/` - API Testing Suite
Main page with interface to test Torre.ai's 3 APIs:
- Opportunity search
- Job details
- User profile (Genome)

### `/jobs` - Job Explorer
Job search and exploration page with:
- Keyword search
- Results count filter (6, 12, 24, 48)
- Visual cards with key information
- Links to each job's details

### `/jobs/[id]` - Job Details
Complete job details page with:
- Full job information
- Compensation, commitment, location
- Required skills
- Required languages
- Company information
- Team members
- **AI Candidate Analysis**: Button to analyze compatibility
- PDF generation of analysis

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd torre-test
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables (optional for AI):
Create a `.env.local` file:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
GOOGLE_MODEL=gemini-2.5-flash-lite  # optional
```

**Note**: The application works without the Google API key, but the AI candidate analysis feature will require this configuration.

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint and fix errors automatically

## 🔑 Torre.ai APIs Used

The project uses the following public Torre.ai APIs:

1. **Opportunities Search API**
   - Endpoint: `POST https://search.torre.co/opportunities/_search`
   - Usage: Search for jobs with advanced filters

2. **Job Details API**
   - Endpoint: `GET https://torre.ai/api/suite/opportunities/{job-id}`
   - Usage: Get complete job details

3. **User Genome API**
   - Endpoint: `GET https://torre.ai/api/genome/bios/{username}`
   - Usage: Get complete user profile

## 🤖 AI Functionality

The application includes intelligent candidate analysis that:

- Compares candidate profile with job requirements
- Identifies matching skills
- Highlights development areas
- Provides recommendations
- Analyzes career trajectory
- Evaluates location and work style compatibility
- Generates overall compatibility score
- Exports complete analysis to PDF

## 🎨 UI Features

- **Dynamic Themes**: Each job has a unique theme color
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Loading States**: Skeletons and spinners during requests
- **Error Handling**: Clear error messages
- **Animations**: Smooth transitions and hover effects

## 📦 Main Dependencies

```json
{
  "next": "16.0.4",
  "react": "19.2.0",
  "typescript": "^5",
  "@ai-sdk/google": "^2.0.43",
  "ai": "^5.0.102",
  "tailwindcss": "^4",
  "jspdf": "^3.0.4",
  "html2canvas": "^1.4.1"
}
```

## 📝 Notes

- Torre.ai APIs are public and don't require authentication
- AI functionality requires a Google API key (free tier available)
- The project is optimized for both development and production

## 🤝 Contributing

Contributions are welcome. Please:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

---

**Built with ❤️ using Next.js and Torre.ai APIs**
