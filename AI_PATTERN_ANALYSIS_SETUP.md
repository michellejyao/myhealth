# AI Pattern Analysis Setup

The AI health pattern detection system analyzes symptom logs and produces structured outputs: anomaly flags, insights, risk scores, summaries, and family history connections.

## Architecture

```
Frontend (3D body + book UI)
        ↓
Supabase Database (health_logs, health_profile)
        ↓
Supabase Edge Function: pattern-analysis
        ↓
OpenAI LLM + deterministic scoring
        ↓
Results → ai_flags, ai_summaries tables
```

## Prerequisites

1. **Supabase project** with migrations applied (`003_create_health_profile_and_ai_tables.sql`)
2. **Supabase CLI** installed
3. **Gemini API key** (from [Google AI Studio](https://aistudio.google.com/apikey))

## Deployment

### 1. Run migrations

```bash
supabase db push
# or apply 003_create_health_profile_and_ai_tables.sql manually in Supabase SQL editor
```

### 2. Deploy the Edge Function

```bash
# Link project (if not already)
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets (required for LLM analysis)
supabase secrets set GEMINI_API_KEY=your-gemini-api-key

# Deploy (use --no-verify-jwt if using Auth0; the function validates user_id from request body)
supabase functions deploy pattern-analysis --no-verify-jwt
```

### 3. Local development

```bash
# Create .env.local in supabase/ with:
# GEMINI_API_KEY=your-gemini-api-key

supabase functions serve pattern-analysis --env-file ./supabase/.env.local --no-verify-jwt
```

For local testing, the frontend must point to your local Supabase URL (or use the deployed function URL).

## Testing the analysis function

You can test the deployed `pattern-analysis` function with fake data:

1. **Seed fake data** (health_logs + health_profile for user `test-user-analysis`):
   ```bash
   npm run test:analysis:seed
   ```

2. **Call the function** (uses the same test user):
   ```bash
   npm run test:analysis:run
   ```

3. **Or do both in one go**:
   ```bash
   npm run test:analysis
   ```

Scripts read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`, `.env.local`, or `supabase/.env.local`. The seed creates ~10 symptom logs (head, back, knee, chest, etc.) and a health profile with family history (e.g. migraine, arthritis) so the LLM has data to analyze.

## Trigger Conditions

Analysis runs when:

- **New log created** – automatically triggered after `createLog`
- **Log edited** – automatically triggered after `updateLog`
- **User requests analysis** – "Run Analysis" on log detail page, "Run Full Analysis" on profile page

## Database Tables

| Table | Purpose |
|-------|---------|
| `health_logs` | Existing symptom logs (body_parts, severity, date, description) |
| `health_profile` | Family history, lifestyle (sleep, activity, diet) for pattern correlation |
| `ai_flags` | Stored flags (title, reasoning, severity, confidence, risk_score) |
| `ai_summaries` | Stored summaries with date range |

## Schema Mapping

The analysis maps `health_logs` to the normalized format:

- `body_region` ← `body_parts[0]`
- `pain_score` ← `severity` (1–10)
- `datetime` ← `date`
- `notes` ← `description`

## Safety

The AI is instructed to:

- **NOT** diagnose, prescribe, or recommend medication
- Use cautious language: "pattern observed", "may indicate", "consider discussing with professional"

## Optional: Periodic Batch Analysis

For daily batch analysis, use Supabase pg_cron + pg_net to call the Edge Function on a schedule. See [Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron) documentation.
