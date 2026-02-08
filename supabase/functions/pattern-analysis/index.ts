/// <reference path="./deno.d.ts" />
import { createClient } from "npm:@supabase/supabase-js@2"
// @ts-ignore
import { BackboardClient } from "npm:backboard-sdk"
import { corsHeaders } from "../_shared/cors.ts"

// Backboard LLM call helper
async function callBackboard(apiKey: string, systemPrompt: string, userInput: string): Promise<string | null> {
  const client = new BackboardClient({ apiKey })
  let assistantId: string | null = null
  let threadId: string | null = null

  try {
    const assistant = await client.createAssistant({
      name: "Pattern Analysis Assistant",
      system_prompt: systemPrompt,
      tools: []
    })
    assistantId = assistant.assistantId

    const thread = await client.createThread(assistantId)
    threadId = thread.threadId

    const response = await client.addMessage(threadId, {
      content: userInput,
      stream: false,
      llm_provider: "openai",
      model_name: "gpt-4o"
    })

    if (response.status === 'REQUIRES_ACTION') {
      console.warn("Backboard: unexpected REQUIRES_ACTION status")
      return null
    }

    return response.content || null
  } finally {
    // Clean up API resources to avoid orphaned assistants/threads
    try {
      if (threadId) await client.deleteThread(threadId)
    } catch { /* best-effort cleanup */ }
    try {
      if (assistantId) await client.deleteAssistant(assistantId)
    } catch { /* best-effort cleanup */ }
  }
}

// Types for health_logs (existing schema)
interface HealthLog {
  id: string
  user_id: string
  title: string
  description?: string
  body_parts?: string[]
  severity?: number
  date: string
  created_at?: string
  updated_at?: string
}

// Normalized log format for analysis (maps from health_logs)
interface NormalizedLog {
  id: string
  body_region: string
  pain_score: number
  datetime: string
  notes: string
}

interface HealthProfile {
  user_id: string
  allergies?: string[]
  height?: number
  weight?: number
  family_history?: string[]
  lifestyle_sleep_hours?: number
  lifestyle_activity_level?: string
  lifestyle_diet_type?: string
}

// Family history keyword -> body region mappings (uses our body_region IDs)
const FAMILY_HISTORY_REGION_MAP: Record<string, string[]> = {
  arthritis: ["left_arm", "right_arm", "left_leg", "right_leg", "back", "neck"],
  migraine: ["head", "neck"],
  diabetes: ["left_leg", "right_leg", "abdomen"],
  heart: ["chest", "back"],
  cardiac: ["chest"],
  hypertension: ["chest", "head"],
  asthma: ["chest"],
  cancer: ["chest", "abdomen", "back", "head"],
}

function normalizeLog(log: HealthLog): NormalizedLog {
  const bodyRegion = log.body_parts?.[0] ?? "unknown"
  return {
    id: log.id,
    body_region: bodyRegion,
    pain_score: log.severity ?? 0,
    datetime: log.date,
    notes: log.description ?? "",
  }
}

function linearRegressionSlope(points: { x: number; y: number }[]): number {
  if (points.length < 2) return 0
  const n = points.length
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0
  for (const p of points) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumX2 += p.x * p.x
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return isNaN(slope) ? 0 : slope
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function std(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  const variance =
    arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length - 1)
  return Math.sqrt(variance)
}

function computeDeterministicMetrics(
  logs: NormalizedLog[],
  currentLog: NormalizedLog | null,
  profile: HealthProfile | null
) {
  const now = new Date()
  const ms90 = 90 * 24 * 60 * 60 * 1000
  const ms30 = 30 * 24 * 60 * 60 * 1000

  const logs90 = logs.filter((l) => now.getTime() - new Date(l.datetime).getTime() <= ms90)
  const logs30 = logs.filter((l) => now.getTime() - new Date(l.datetime).getTime() <= ms30)

  const currentRegion = currentLog?.body_region ?? logs[0]?.body_region ?? "unknown"

  // Frequency score per body region (last 30 / last 90)
  const regionCount90 = logs90.filter((l) => l.body_region === currentRegion).length
  const regionCount30 = logs30.filter((l) => l.body_region === currentRegion).length
  const frequency_score = regionCount90 > 0 ? Math.min(1, regionCount30 / regionCount90) : 0

  // Severity trend slope (pain over time for current region)
  const regionLogs = logs90.filter((l) => l.body_region === currentRegion)
  const points = regionLogs.map((l, i) => ({
    x: new Date(l.datetime).getTime() / 1000,
    y: l.pain_score,
  }))
  const severity_slope = linearRegressionSlope(points)
  const slopeNormalized = Math.max(0, Math.min(1, (severity_slope + 0.5) / 1)) // map to 0-1

  // Z-score anomaly
  const painScores = logs90.map((l) => l.pain_score)
  const avgPain = mean(painScores)
  const stdPain = std(painScores) || 0.001
  const currentPain = currentLog?.pain_score ?? (logs[0]?.pain_score ?? 0)
  const z_score = stdPain > 0 ? (currentPain - avgPain) / stdPain : 0

  // Recurrence score (count of region occurrences in last 30 days)
  const recurrence_score = Math.min(1, regionCount30 / 10)

  // Family history relevance: match family history text to condition keywords, then to body regions
  const familyHistory = profile?.family_history ?? []
  const familyText = familyHistory.join(" ").toLowerCase()
  const regionLower = currentRegion.toLowerCase()
  let family_relevance_score = 0
  for (const [condition, regions] of Object.entries(FAMILY_HISTORY_REGION_MAP)) {
    if (familyText.includes(condition) && regions.some((r) => regionLower.includes(r))) {
      family_relevance_score += 0.25
    }
  }
  family_relevance_score = Math.min(1, family_relevance_score)

  // Deterministic risk score
  let risk_score =
    slopeNormalized * 25 +
    frequency_score * 20 +
    Math.max(0, Math.min(1, z_score / 3)) * 20 +
    recurrence_score * 15 +
    family_relevance_score * 20
  risk_score = Math.max(0, Math.min(100, risk_score))

  return {
    severity_slope,
    frequency_score,
    z_score,
    recurrence_score,
    family_relevance_score,
    risk_score,
    regionCount30,
    regionCount90,
    avgPain,
  }
}

function isAnomaly(
  z_score: number,
  severity_slope: number,
  currentPain: number,
  baseline: number,
  logs: NormalizedLog[],
  currentRegion: string
): boolean {
  if (z_score > 2) return true
  if (severity_slope > 0.3) return true
  if (currentPain >= 8 && baseline < 4) return true
  const recentRegions = logs.slice(0, 30).map((l) => l.body_region)
  const hasNewRegion =
    currentRegion && !recentRegions.slice(5).includes(currentRegion) && recentRegions.length >= 5
  if (hasNewRegion) return true
  return false
}

function buildLLMPrompt(
  currentLog: NormalizedLog | null,
  recentLogs: NormalizedLog[],
  profile: HealthProfile | null,
  metrics: ReturnType<typeof computeDeterministicMetrics>
) {
  const familyHistory = profile?.family_history ?? []
  const lifestyle = {
    sleep_hours: profile?.lifestyle_sleep_hours,
    activity_level: profile?.lifestyle_activity_level,
    diet_type: profile?.lifestyle_diet_type,
  }

  const systemPrompt = `You are a medical pattern detection assistant.
You analyze symptom logs and identify patterns, anomalies, correlations, and possible inherited risk connections.

You DO NOT diagnose.
You ONLY identify patterns and observational insights.

You must produce structured JSON output.

You must consider:
- severity trends
- recurrence patterns
- anomaly signals
- correlations across body regions
- connections to family health history
- worsening or improving patterns
- predictive risk indicators

Be precise, factual, and cautious.
Avoid alarmist language.`

  const userInput = `
User Health Profile:
family_history: ${JSON.stringify(familyHistory)}
lifestyle_metrics: ${JSON.stringify(lifestyle)}

Current Log:
${JSON.stringify(currentLog, null, 2)}

Recent Logs (last 90 days, sample):
${JSON.stringify(recentLogs.slice(0, 30), null, 2)}

Deterministic Pattern Metrics:
severity_slope: ${metrics.severity_slope}
frequency_score: ${metrics.frequency_score}
recurrence_score: ${metrics.recurrence_score}
anomaly_z_score: ${metrics.z_score}
deterministic_risk_score: ${metrics.risk_score}

OUTPUT FORMAT REQUIRED (valid JSON only, no other text):
{
  "flags": [
    {
      "title": "string",
      "reasoning_summary": "string",
      "severity": "low" | "medium" | "high"
    }
  ],
  "insights": ["string"],
  "anomaly_detected": boolean,
  "predictive_risk_assessment": {
    "risk_level": "low" | "medium" | "high",
    "reasoning": "string"
  },
  "family_history_connections": ["string"],
  "summary": "string"
}`

  return { systemPrompt, userInput }
}

function llmRiskToNumber(level: string): number {
  if (level === "high") return 75
  if (level === "medium") return 45
  return 20
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { user_id, log_id } = (await req.json()) as { user_id: string; log_id?: string }
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const backboardKey = Deno.env.get("BACKBOARD_API_KEY")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch logs (health_logs) - last 365 days
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const { data: rawLogs, error: logsError } = await supabase
      .from("health_logs")
      .select("*")
      .eq("user_id", user_id)
      .gte("date", oneYearAgo.toISOString())
      .order("date", { ascending: false })
      .limit(365)

    if (logsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch logs: " + logsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const logs = (rawLogs ?? []).map(normalizeLog)
    const currentLog = log_id
      ? logs.find((l) => l.id === log_id) ?? null
      : logs[0] ?? null
    const recentLogs = logs.slice(0, 90)

    // Fetch health profile
    const { data: profile } = await supabase
      .from("health_profile")
      .select("*")
      .eq("user_id", user_id)
      .single()

    const profileData = profile as HealthProfile | null

    const metrics = computeDeterministicMetrics(logs, currentLog, profileData)
    const anomalyDetected = isAnomaly(
      metrics.z_score,
      metrics.severity_slope,
      currentLog?.pain_score ?? 0,
      metrics.avgPain,
      logs,
      currentLog?.body_region ?? ""
    )

    let llmOutput: {
      flags: { title: string; reasoning_summary: string; severity: string; confidence_score: number }[]
      insights: string[]
      anomaly_detected: boolean
      predictive_risk_assessment: { risk_level: string; reasoning: string }
      family_history_connections: string[]
      summary: string
    } = {
      flags: [],
      insights: [],
      anomaly_detected: anomalyDetected,
      predictive_risk_assessment: { risk_level: "low", reasoning: "Insufficient data for assessment." },
      family_history_connections: [],
      summary: "Pattern analysis completed. No significant patterns identified in the available data.",
    }

    let backboardError: string | null = null

    if (backboardKey && logs.length > 0) {
      const { systemPrompt, userInput } = buildLLMPrompt(
        currentLog,
        recentLogs,
        profileData,
        metrics
      )
      try {
        const content = await callBackboard(backboardKey, systemPrompt, userInput)
        if (content) {
          // Strip markdown code fences if the LLM wraps its JSON response
          const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
          let parsed
          try {
            parsed = JSON.parse(cleaned)
          } catch (parseErr) {
            console.error("Backboard JSON parse error:", parseErr, "\nRaw content:", content)
            backboardError = "AI returned invalid response format"
            parsed = null
          }
          if (parsed) {
            llmOutput = {
              flags: Array.isArray(parsed.flags) ? parsed.flags : [],
              insights: Array.isArray(parsed.insights) ? parsed.insights : [],
              anomaly_detected: typeof parsed.anomaly_detected === 'boolean' ? parsed.anomaly_detected : anomalyDetected,
              predictive_risk_assessment:
                parsed.predictive_risk_assessment ?? llmOutput.predictive_risk_assessment,
              family_history_connections: Array.isArray(parsed.family_history_connections) ? parsed.family_history_connections : [],
              summary: typeof parsed.summary === 'string' ? parsed.summary : llmOutput.summary,
            }
          }
        } else {
          backboardError = "AI returned empty response"
        }
      } catch (e) {
        console.error("Backboard error:", e)
        backboardError = e instanceof Error ? e.message : "AI analysis failed"
      }
    } else if (!backboardKey) {
      backboardError = "AI analysis not configured (missing API key)"
    }

    // If no patterns found (no flags, no insights, no anomaly, no family connections), return 0 risk
    const hasPatterns = 
      llmOutput.flags.length > 0 ||
      llmOutput.insights.length > 0 ||
      llmOutput.anomaly_detected ||
      llmOutput.family_history_connections.length > 0

    let clampedRisk = 0
    if (hasPatterns) {
      const llmRiskScore = llmRiskToNumber(
        llmOutput.predictive_risk_assessment?.risk_level ?? "low"
      )
      const final_risk_score = Math.round(
        metrics.risk_score * 0.7 + llmRiskScore * 0.3
      )
      clampedRisk = Math.max(0, Math.min(100, final_risk_score))
    }

    const logIdForFlags = currentLog?.id ?? null

    // Store ai_flags
    for (const flag of llmOutput.flags) {
      await supabase.from("ai_flags").insert({
        user_id: user_id,
        log_id: logIdForFlags,
        title: flag.title,
        reasoning_summary: flag.reasoning_summary,
        severity: flag.severity ?? "low",
        confidence_score: flag.confidence_score ?? 50,
        risk_score: clampedRisk,
      })
    }

    // Store ai_summaries
    const dateRangeStart = logs.length > 0 ? logs[logs.length - 1].datetime : null
    const dateRangeEnd = logs.length > 0 ? logs[0].datetime : null
    await supabase.from("ai_summaries").insert({
      user_id: user_id,
      summary_text: llmOutput.summary,
      date_range_start: dateRangeStart,
      date_range_end: dateRangeEnd,
    })

    const response = {
      flags: llmOutput.flags,
      insights: llmOutput.insights,
      risk_score: clampedRisk,
      summary: llmOutput.summary,
      anomaly_detected: llmOutput.anomaly_detected,
      family_history_connections: llmOutput.family_history_connections,
      ...(backboardError ? { ai_warning: backboardError } : {}),
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("Pattern analysis error:", err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
