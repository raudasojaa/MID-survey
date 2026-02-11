# MID Panel Survey

A Next.js application for creating and managing Minimally Important Difference (MID) panel surveys.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- A Vercel account (for deployment)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

**Note:** Local development will show errors when trying to save data until you connect to Vercel KV (see deployment instructions).

## Deployment to Vercel

### Step 1: Create Vercel KV Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on the **Storage** tab
3. Click **Create Database**
4. Select **KV** (Key-Value Store)
5. Choose a name (e.g., "mid-survey-kv")
6. Click **Create**

### Step 2: Deploy Your App

1. Install Vercel CLI (optional):
```bash
npm i -g vercel
```

2. Deploy using one of these methods:

**Method A: Using Vercel CLI**
```bash
cd mid-survey
vercel
```

**Method B: Using Git + Vercel Dashboard**
- Push your code to GitHub/GitLab/Bitbucket
- Go to [Vercel Dashboard](https://vercel.com/new)
- Click **Import Project**
- Select your repository
- Click **Deploy**

### Step 3: Connect KV Database to Your App

1. In Vercel Dashboard, go to your project
2. Click on the **Storage** tab
3. Click **Connect Store**
4. Select your KV database
5. Click **Connect**

That's it! Your app will automatically redeploy with the KV environment variables configured.

## Features

- Create multiple survey types (MID Threshold, Decision Threshold, Proportion Electing)
- Generate scenarios with automatic round-number spacing
- Share survey links with respondents
- Collect and view responses with visualizations
- All data stored securely in Vercel KV

## How It Saves Data

Survey responses are saved to **Vercel KV** (a Redis-based key-value database):

- **Surveys**: Stored under key `mid-surveys-v3`
- **Responses**: Stored under key `responses:{surveyId}` for each survey

When respondents submit a survey:
1. Their answers are sent to `/api/responses` endpoint
2. The API stores the response in Vercel KV
3. Results are immediately available in the survey dashboard
