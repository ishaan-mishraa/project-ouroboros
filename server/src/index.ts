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
// ROUTE 1: MANUAL INGESTION 
// ---------------------------------------------------------
app.post('/ingest', async (c) => {
  const { text } = await c.req.json()
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY)
  const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY })

  try {
    const extractionPrompt = `Analyze this: "${text}". Return ONLY JSON: {"actor": "...", "subject": "...", "sentiment": float between -1.0 and 1.0}`
    
    // Use the official model string and force strict JSON output
    const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: extractionPrompt,
    config: { responseMimeType: "application/json" }
    })
    
    // Safely parse the strictly formatted JSON
    const data = JSON.parse(result.text)

    const embedResult = await ai.models.embedContent({
  model: 'gemini-embedding-001', // The new active embedding model
  contents: text,
  config: { outputDimensionality: 768 } // CRITICAL: This matches your Supabase vector(768) setup
})
    const embedding = embedResult.embeddings[0].values

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
// ROUTE 2: AUTOMATED GLOBAL SYNC (NewsAPI) - WITH TELEMETRY
// ---------------------------------------------------------
app.get('/sync', async (c) => {
  console.log("▶️ SYNC INITIATED: Booting up...")
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY)
  const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY })

  try {
    const url = `https://newsapi.org/v2/everything?q=geopolitics+military+diplomacy&language=en&sortBy=publishedAt&pageSize=5&apiKey=${c.env.NEWS_API_KEY}`
    
    console.log("📡 FETCHING NEWS: Reaching out to NewsAPI...")
    const newsRes = await fetch(url, {
      headers: { 'User-Agent': 'Ouroboros-Intelligence-Engine/1.0' }
    })
    
    const newsData: any = await newsRes.json()
    console.log("📰 NEWS API RESPONSE STATUS:", newsData.status)

    if (newsData.status === "error") {
      console.error("❌ NEWS API BLOCKED US:", newsData.message)
      return c.json({ success: false, error: "NewsAPI Error", details: newsData.message }, 500)
    }

    if (!newsData.articles || newsData.articles.length === 0) {
       console.warn("⚠️ NO ARTICLES FOUND.")
       return c.json({ success: false, error: "No articles found" }, 500)
    }

    let processedCount = 0;

    for (const article of newsData.articles) {
      console.log(`\n⚙️ PROCESSING ARTICLE: "${article.title.substring(0, 30)}..."`)
      const text = `${article.title}. ${article.description || ''}`;
      
      const { data: exists } = await supabase.from('intelligence_reports').select('id').eq('statement', text).maybeSingle()
      if (exists) {
        console.log("⏭️ DUPLICATE FOUND: Skipping to next article.")
        continue;
      }

      console.log("🧠 GEMINI ANALYSIS: Requesting metadata extraction...")
      const extractionPrompt = `Analyze: "${text}". Return ONLY JSON: {"actor": "Country/Leader", "subject": "Topic", "sentiment": float between -1.0 and 1.0}`
      
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: extractionPrompt,
        config: { responseMimeType: "application/json" }
      })
      
      console.log("✅ GEMINI RAW OUTPUT:", result.text)
      const data = JSON.parse(result.text)

      console.log("📐 GENERATING VECTOR: Embedding text...")
      const embedResult = await ai.models.embedContent({
  model: 'gemini-embedding-001', // The new active embedding model
  contents: text,
  config: { outputDimensionality: 768 } // CRITICAL: This matches your Supabase vector(768) setup
})
      
      console.log("💾 SUPABASE SAVE: Inserting intelligence report...")
      const { error: dbError } = await supabase.from('intelligence_reports').insert({
        actor: data.actor.toUpperCase(), 
        subject: data.subject, 
        statement: text, 
        sentiment: data.sentiment, 
        embedding: embedResult.embeddings[0].values
      })

      if (dbError) {
        console.error("❌ SUPABASE DB ERROR:", dbError.message)
        throw new Error(dbError.message)
      }

      processedCount++;
    }

    console.log(`🎉 SYNC COMPLETE: ${processedCount} items ingested.`)
    return c.json({ success: true, message: `Global Sync Complete. Ingested ${processedCount} new reports.` })
    
  } catch (err: any) {
    console.error("\n💥 SYSTEM CRASH💥 :", err.message, err)
    return c.json({ success: false, error: "Sync failed", details: err.message }, 500)
  }
})

export default app