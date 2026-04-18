import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_KEY: string
  GEMINI_API_KEY: string
  NEWS_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/*', cors())

app.get('/', (c) => c.text('Project Ouroboros Intelligence Engine: ONLINE'))

// ---------------------------------------------------------
// CORE SYNC LOGIC (Extracted for Dual Use: API + Cron)
// ---------------------------------------------------------
async function runGlobalSync(env: Bindings) {
  console.log("▶️ SYNC INITIATED: Booting up Multi-Source Aggregator...")
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY)
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })

  let rawArticles: { title: string, description: string }[] = [];

  try {
    // --- SOURCE 1: NEWS API ---
    console.log("📡 FETCHING SOURCE 1: NewsAPI...")
    const newsUrl = `https://newsapi.org/v2/everything?q=geopolitics+military+diplomacy&language=en&sortBy=publishedAt&pageSize=5&apiKey=${env.NEWS_API_KEY}`
    const newsRes = await fetch(newsUrl, { headers: { 'User-Agent': 'Ouroboros-Engine/1.0' } })
    const newsData: any = await newsRes.json()
    
    if (newsData.articles) {
      newsData.articles.forEach((a: any) => rawArticles.push({ title: a.title, description: a.description || '' }))
    }

    // --- SOURCE 2: RSS FEEDS (Via Edge-Safe JSON Converter) ---
    console.log("📡 FETCHING SOURCE 2: Global RSS Feeds...")
    const rssFeeds = [
      'https://feeds.bbci.co.uk/news/world/rss.xml', // BBC World
      'https://www.aljazeera.com/xml/rss/all.xml'    // Al Jazeera
    ];

    for (const feed of rssFeeds) {
      try {
        const rssRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${feed}`)
        const rssData: any = await rssRes.json()
        if (rssData.items) {
          // Grab top 3 from each RSS feed so we don't overload the AI
          rssData.items.slice(0, 3).forEach((item: any) => {
            // RSS descriptions are often polluted with HTML tags. Strip them out.
            const cleanDescription = (item.description || '').replace(/<[^>]*>?/gm, '');
            rawArticles.push({ title: item.title, description: cleanDescription })
          })
        }
      } catch (e) {
        console.error(`⚠️ Failed to parse RSS feed: ${feed}`)
      }
    }

    // --- SOURCE 3: GDELT PROJECT ---
    console.log("📡 FETCHING SOURCE 3: GDELT 2.0 API...")
    try {
        const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=(military%20OR%20diplomacy%20OR%20geopolitics%20OR%20conflict)&mode=artlist&maxrecords=15&format=json&sort=datedesc`
        const gdeltRes = await fetch(gdeltUrl)
        const gdeltData: any = await gdeltRes.json()
        
        if (gdeltData.articles) {
            gdeltData.articles.forEach((a: any) => {
                // GDELT primarily relies on the title for immediate context
                rawArticles.push({ title: a.title, description: '' })
            })
        }
    } catch (e) {
        console.error("⚠️ Failed to fetch from GDELT Project.")
    }

    // --- REDUNDANCY FILTER ---
    console.log(`🧹 AGGREGATED ${rawArticles.length} RAW ARTICLES. Running Deduplication...`)
    const uniqueArticles = [];
    const seenSignatures = new Set();

    for (const art of rawArticles) {
      if (!art.title) continue;
      
      // Create a signature to catch similar articles (lowercase, alphanumeric only, first 40 chars)
      const signature = art.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 40);
      
      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        uniqueArticles.push(art);
      }
    }

    console.log(`🎯 DEDUPLICATION COMPLETE. Processing ${uniqueArticles.length} unique reports.`)

    // --- AI PROCESSING & INGESTION ---
    let processedCount = 0;

    for (const article of uniqueArticles) {
      console.log(`\n⚙️ PROCESSING: "${article.title.substring(0, 40)}..."`)
      const text = `${article.title}. ${article.description}`.trim();
      
      // Database check for historical redundancy
      const { data: exists } = await supabase.from('intelligence_reports').select('id').eq('statement', text).maybeSingle()
      if (exists) {
        console.log("⏭️ DB DUPLICATE FOUND: Skipping.")
        continue;
      }

      console.log("🧠 GEMINI ANALYSIS: Requesting metadata extraction...")
      const extractionPrompt = `Analyze: "${text}". Return ONLY JSON: {"actor": "Country/Leader", "subject": "Topic", "sentiment": float between -1.0 and 1.0}`
      
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: extractionPrompt,
        config: { 
          responseMimeType: "application/json",
          systemInstruction: "You are an automated JSON extraction API. Return ONLY raw JSON without any markdown formatting, explanation, or code blocks. Your output must begin with '{' and end with '}'."
        }
      })
      
      const data = JSON.parse(result.text)

      console.log("📐 GENERATING VECTOR: Embedding text...")
      const embedResult = await ai.models.embedContent({
        model: 'gemini-embedding-001', 
        contents: text,
        config: { outputDimensionality: 768 } 
      })
      
      console.log("💾 SUPABASE SAVE: Inserting intelligence report...")
      const { error: dbError } = await supabase.from('intelligence_reports').insert({
        actor: data.actor.toUpperCase(), 
        subject: data.subject, 
        statement: text, 
        sentiment: data.sentiment, 
        embedding: embedResult.embeddings[0].values
      })

      if (dbError) throw new Error(dbError.message)
      processedCount++;
    }

    console.log(`\n🎉 SYNC COMPLETE: ${processedCount} items ingested.`)
    return { success: true, message: `Global Sync Complete. Ingested ${processedCount} new reports.`, count: processedCount }
    
  } catch (err: any) {
    console.error("\n💥 SYSTEM CRASH💥 :", err.message, err)
    throw err; // Re-throw so the caller (API or Cron) knows it failed
  }
}

// ---------------------------------------------------------
// ROUTE 1: MANUAL INGESTION 
// ---------------------------------------------------------
app.post('/ingest', async (c) => {
  const { text } = await c.req.json()
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY)
  const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY })

  try {
    const extractionPrompt = `Analyze this: "${text}". Return ONLY JSON: {"actor": "...", "subject": "...", "sentiment": float between -1.0 and 1.0}`
    
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: extractionPrompt,
      config: { 
          responseMimeType: "application/json",
          systemInstruction: "You are an automated JSON extraction API. Return ONLY raw JSON without any markdown formatting, explanation, or code blocks. Your output must begin with '{' and end with '}'."
        }
    })
    
    const data = JSON.parse(result.text)

    const embedResult = await ai.models.embedContent({
      model: 'gemini-embedding-001', 
      contents: text,
      config: { outputDimensionality: 768 } 
    })
    const embedding = embed;

    const { data: matches } = await supabase.rpc('match_intelligence', {
      query_embedding: embedding, match_threshold: 0.8, match_count: 5
    })

    const conflict = matches?.find((m: any) => m.actor === data.actor && Math.abs(m.sentiment - data.sentiment) > 1.2)

    await supabase.from('intelligence_reports').insert({
      actor: data.actor, subject: data.subject, statement: text, sentiment: data.sentiment, embedding: embedding
    })

    return c.json({ success: true, dissonance: !!conflict, conflict_with: conflict?.statement || null, data })
  } catch (err: any) {
    return c.json({ success: false, error: "Processing failed", details: err.message }, 500)
  }
})

// ---------------------------------------------------------
// ROUTE 2: API SYNC TRIGGER (Calls the extracted logic)
// ---------------------------------------------------------
app.get('/sync', async (c) => {
  try {
    const result = await runGlobalSync(c.env)
    return c.json(result)
  } catch (err: any) {
    return c.json({ success: false, error: "Sync failed", details: err.message }, 500)
  }
})

// ---------------------------------------------------------
// CLOUDFLARE EXPORT (Handles both HTTP requests and Cron jobs)
// ---------------------------------------------------------
export default {
  fetch: app.fetch,
  scheduled: async (event: any, env: Bindings, ctx: any) => {
    // ctx.waitUntil prevents Cloudflare from killing the worker before the sync finishes
    ctx.waitUntil(runGlobalSync(env));
  }
}