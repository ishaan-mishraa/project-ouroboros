import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_KEY: string
  GEMINI_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// 1. Enable CORS (Critical for Frontend communication)
app.use('/*', cors())

app.get('/', (c) => c.text('Project Ouroboros Intelligence Engine: ONLINE'))

app.post('/ingest', async (c) => {
  const { text } = await c.req.json()
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY)
  const genAI = new GoogleGenAI(c.env.GEMINI_API_KEY)
  
  // Using 3.1 Flash Lite for higher rate limits (15 RPM)
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" })

  try {
    // 2. Extract Metadata via AI
    const extractionPrompt = `Analyze this: "${text}". Return ONLY JSON: {"actor": "...", "subject": "...", "sentiment": float between -1.0 and 1.0}`
    const result = await model.generateContent(extractionPrompt)
    const data = JSON.parse(result.response.text().replace(/```json|```/g, ""))

    // 3. Generate Embedding (text-embedding-004 has high separate quotas)
    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" })
    const embedResult = await embedModel.embedContent(text)
    const embedding = embedResult.embedding.values

    // 4. Vector Search for Contradictions
    const { data: matches } = await supabase.rpc('match_intelligence', {
      query_embedding: embedding,
      match_threshold: 0.8,
      match_count: 5
    })

    // Detect Hypocrisy/Dissonance
    const conflict = matches?.find(m => m.actor === data.actor && Math.abs(m.sentiment - data.sentiment) > 1.2)

    // 5. Save to Memory
    await supabase.from('intelligence_reports').insert({
      actor: data.actor,
      subject: data.subject,
      statement: text,
      sentiment: data.sentiment,
      embedding: embedding
    })

    return c.json({ 
      success: true, 
      dissonance: !!conflict, 
      conflict_with: conflict?.statement || null,
      data 
    })

  } catch (err) {
    return c.json({ success: false, error: "Processing failed" }, 500)
  }
})

export default app