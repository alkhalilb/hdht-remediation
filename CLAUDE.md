# HDHT Remediation App

A hypothesis-driven history taking remediation application for medical students.

## Overview

This is a web-based virtual patient application designed to remediate medical students who have failed the PCMC-1 competency (hypothesis-driven history taking) on their OSCE. The app diagnoses the student's specific deficit pattern and provides targeted, scaffolded practice.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Zustand
- **Backend**: Node.js, Express, Claude API (Anthropic)
- **AI**: Uses Claude claude-sonnet-4-20250514 for virtual patient responses and question analysis

## Project Structure

```
HBHx/
├── app/                    # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── common/     # Reusable components (Button, Card, etc.)
│   │   │   ├── interview/  # Chat and hypothesis components
│   │   │   └── scaffolding/# Educational scaffolding components
│   │   ├── data/           # Case data (patients, illness scripts)
│   │   ├── pages/          # Route pages
│   │   ├── services/       # API and scoring services
│   │   ├── store/          # Zustand state management
│   │   └── types/          # TypeScript types
│   └── ...
├── server/                 # Backend API server
│   ├── index.ts            # Express server with Claude API integration
│   └── ...
└── hdht_remediation_app_spec.md  # Full specification document
```

## How to Run

### Development

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend (port 3001)
cd server && npm run dev

# Terminal 2 - Frontend (port 5173)
cd app && npm run dev
```

### Build for Production

```bash
cd app && npm run build
```

## Key Features

1. **Diagnostic Case**: Identifies student's deficit pattern
2. **4 Remediation Tracks**: Organization, Completeness, Hypothesis Alignment, Efficiency
3. **Scaffolded Practice**: Decreasing scaffolding over 3 practice cases
4. **Exit Assessment**: Demonstrates mastery
5. **Virtual Patients**: AI-powered patient responses via Claude API

## API Endpoints

- `POST /api/virtual-patient` - Get patient response to student question
- `POST /api/analyze-question` - Analyze question quality and categorization
- `POST /api/evaluate-hypotheses` - Evaluate student's differential diagnosis
- `POST /api/assess-performance` - Full case assessment with scoring

## Environment Variables

### Server (.env)
```
ANTHROPIC_API_KEY=your_key_here
PORT=3001
```

## Student Flow

1. Welcome → Orientation → Diagnostic Case
2. Deficit Report (shows assigned track)
3. Track Practice (3 cases with decreasing scaffolding)
4. Exit Case (unscaffolded)
5. Survey → Completion

## Scoring Dimensions

- Hypothesis Generation (0-100)
- Hypothesis Alignment (0-100)
- Organization (0-100)
- Completeness (0-100)
- Efficiency (0-100)
- Patient-Centeredness (0-100)
- Overall (weighted average)
