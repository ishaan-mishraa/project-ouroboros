# 🐍 Project Ouroboros
**An Autonomous, AI-Powered Geopolitical Dissonance Engine**

Project Ouroboros is a full-stack, edge-hosted intelligence platform designed to ingest global news, map relationships between geopolitical actors, and automatically detect hypocrisies or diplomatic clashes in real-time using Large Language Models and Vector Search.

![Ouroboros Dashboard Placeholder](client/public/placeholder-logo.png) *(Replace with a screenshot of your live dashboard!)*

## 🧠 Core Architecture

Ouroboros is built on a modern, highly scalable edge architecture:

* **Frontend:** Next.js (React), Tailwind CSS, Shadcn UI
* **Graph Visualization:** React Flow (Custom Circular/Ouroboros Layout)
* **Backend:** Hono (Deployed on Cloudflare Workers)
* **Database:** Supabase (PostgreSQL + pgvector)
* **AI Engine:** Google Gemini 2.0 Flash & Text-Embedding-004
* **Data Pipelines:** NewsAPI (Automated OSINT Aggregation)

## ✨ Key Features

* **Autonomous Global Sync:** The Hono edge server autonomously scrapes the latest global news regarding diplomacy, trade, and military actions.
* **Neural Extraction:** Uses Gemini 2.0 Flash to instantly read articles, normalize entity names (e.g., merging "U.S.", "USA", and "United States"), and score the geopolitical sentiment (-1.0 to 1.0).
* **Vector Dissonance Detection:** Every ingested report is embedded into a 768-dimensional vector space. Supabase uses cosine similarity to match new statements against historical data. If an actor's sentiment drastically shifts (a contradiction or hypocrisy), the system flags it.
* **The Ouroboros Canvas:** A dynamic, chronological node graph that maps actors in a centralized ring. Standard intelligence flows are drawn in cyan, while detected contradictions are drawn as thick, glowing red lines.
* **Live Alert Center:** A real-time right sidebar that isolates and displays the exact conflicting statements that triggered a system warning.

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
* Node.js (v18+)
* [pnpm](https://pnpm.io/)
* A [Supabase](https://supabase.com/) project
* A [Google Gemini API Key](https://aistudio.google.com/)
* A [NewsAPI Key](https://newsapi.org/)

### 2. Database Setup
Execute this SQL in your Supabase SQL Editor to prepare the vector database:
```sql
create extension if not exists vector;

create table intelligence_reports (
  id bigint primary key generated always as identity,
  actor text not null,
  subject text not null,
  statement text not null,
  sentiment double precision not null,
  embedding vector(768),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RPC Function for Cosine Similarity Matching
create or replace function match_intelligence (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  actor text,
  statement text,
  sentiment double precision,
  similarity float
)
language sql stable
as $$
  select
    intelligence_reports.id,
    intelligence_reports.actor,
    intelligence_reports.statement,
    intelligence_reports.sentiment,
    1 - (intelligence_reports.embedding <=> query_embedding) as similarity
  from intelligence_reports
  where 1 - (intelligence_reports.embedding <=> query_embedding) > match_threshold
  order by intelligence_reports.embedding <=> query_embedding
  limit match_count;
$$;

```
# Backend Setup (Hono)
```bash
cd server
pnpm install
```
Rename .dev.vars.example (or create .dev.vars) and add your keys:
```
SUPABASE_URL="your_supabase_url"
SUPABASE_KEY="your_supabase_service_key"
GEMINI_API_KEY="your_gemini_key"
NEWS_API_KEY="your_newsapi_key"

```
# Start the local edge server:
```bash
pnpm dev
```
# 4. Frontend Setup (Next.js)
Open a new terminal and navigate to the client folder:
```bash
cd client
pnpm install
```
# Create a .env.local file:
```
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
NEXT_PUBLIC_API_URL="http://localhost:8787"
```
# Start the Next.js development server:
```bash
pnpm dev
```
# Navigate to http://localhost:3000 to access the Command Center.
# 🌐 Deployment
Backend: Deployed natively to Cloudflare Workers via npx wrangler deploy. Secrets are managed via wrangler secret put.

Frontend: Hosted on Vercel. Ensure the Root Directory is set to client/ and NEXT_PUBLIC_API_URL is updated to point to the live Cloudflare Worker URL.

Developed by Ishaan.
