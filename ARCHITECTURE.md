# ScholarIQ — System & AI/ML Architecture

This document describes how ScholarIQ is structured and, in particular, how its
three AI/ML systems and two autonomous bots are designed. It is written to be
defensible: every modelling decision states its rationale and its limitations.

---

## 1. High-Level Architecture

```
┌─────────────┐     HTTPS/JSON      ┌──────────────────────────────┐
│  React SPA  │ ◄─────────────────► │        FastAPI Backend        │
│ (Vite + TS) │                     │                               │
└─────────────┘                     │  ┌────────────────────────┐   │
                                    │  │ REST routers (app/api) │   │
                                    │  └──────────┬─────────────┘   │
                                    │             ▼                 │
                                    │  ┌────────────────────────┐   │
                                    │  │ Services & ML layer    │   │
                                    │  │  • Chatbot RAG         │   │
                                    │  │  • Recommendation      │   │
                                    │  │  • Fraud detection     │   │
                                    │  │  • Auto-update bot     │   │
                                    │  │  • Auto-verify bot     │   │
                                    │  └──────────┬─────────────┘   │
                                    │             ▼                 │
                                    │  ┌────────────────────────┐   │
                                    │  │ SQLAlchemy ORM + SQLite│   │
                                    │  └────────────────────────┘   │
                                    │  APScheduler (background jobs) │
                                    └──────────────────────────────┘
```

The backend is a single FastAPI application. Background work (deadline emails,
fraud scans, the two bots, embedding-cache refresh) runs on an in-process
APScheduler started in the FastAPI `lifespan`.

---

## 2. AI System 1 — Chatbot (Retrieval-Augmented Generation)

**Goal:** answer student questions using *only* verified scholarship data, never
hallucinated listings.

**Pipeline (per message):**

1. **Retrieve** — the user query (enriched with profile hints: target country,
   degree, major) is embedded with `all-MiniLM-L6-v2` and compared by cosine
   similarity against a **pre-computed, cached embedding matrix** of all approved,
   active, non-expired scholarships. Top-6 are selected.
2. **Augment** — those 6 verified records are injected into the system prompt as
   ground truth, with an explicit "answer only from this data" instruction.
3. **Generate** — GPT-4o-mini produces the reply, with conversation history
   (token-budgeted) and the user profile for personalization.

**Key engineering decisions:**

| Decision | Why |
|---|---|
| **Embeddings cached at startup** (`embedding_cache.warm_up`) | Encoding the whole corpus *per request* costs seconds on CPU. Pre-computing makes query-time ≈ one query-embedding + a numpy dot product (~40 ms). |
| **`normalize_embeddings=True`** | L2-normalized vectors make the dot product mathematically equal to cosine similarity. |
| **Cache refresh** every 6 h + nightly + on admin demand + after bot promotions | New scholarships become discoverable without a restart. |
| **Token guard** (`tiktoken`) | Trims oldest history turns so long chats never overflow the context window. |
| **SQL fallback** | If `sentence-transformers` is unavailable, a keyword SQL filter still injects verified data — the chatbot never silently hallucinates. |

> Terminology: this is **Dynamic Context Injection via cached vector retrieval** —
> a retrieval layer over a structured DB, not document-chunk RAG.

---

## 3. AI System 2 — Recommendation Engine

**Goal:** rank scholarships for a logged-in user by fit.

**Hybrid score** = `0.6 × rule_score + 0.4 × ML_score` (when the ML model is loaded).

- **Rule layer** — interpretable points for CGPA gap, degree match, country
  match, field match, IELTS, funding preference, scholarship value, verification.
- **ML layer** — a `RandomForestClassifier` trained on **implicit feedback**.

**Labeling (defensible):**

- **Positive (1):** scholarships the user *applied to* or *saved*.
- **Negative (0):** implicit negative sampling — random scholarships the user
  never interacted with.
- **Views are excluded.** The interaction table has no dwell-time, so a "view"
  is ambiguous (engaged read vs. accidental bounce); including it would pollute
  the labels.

**Robustness:**

- Candidate pool is **deterministic** (`ORDER BY created_at DESC, deadline ASC`) —
  no arbitrary `LIMIT` ordering.
- Hard filters: approved, active, non-archived, **non-expired**, CGPA gap > −1.0.
- **Cold-start fallback** — if a profile is < 50% complete, the engine returns a
  popularity-based list (most-applied-to scholarships) labeled *"Popular Pick"*
  instead of scoring on empty features.

---

## 4. AI System 3 — Fraud Detection

**Goal:** flag fraudulent / scam scholarship listings.

A **hybrid rule + ML** design:

1. **Rule layer** (primary, reliable) — keyword analysis (processing fees,
   Western Union, "guaranteed", WhatsApp-only…), suspicious-TLD checks, and a
   live URL reachability test.
2. **ML layer** (auxiliary) — a `RandomForestClassifier` producing a continuous
   calibrated risk probability, combined into the composite score.

**Labeling & anti-leakage (the important part):**

- Labels come from **documented fraud heuristics**, *not* admin approval status
  (admins reject for many non-fraud reasons → that would be label contamination).
- The label-defining features (`has_high_risk_keyword`, `has_medium_risk_keyword`,
  `suspicious_domain`) are **excluded from the ML training set** to avoid the
  model simply memorizing the labeling rule. Keyword/TLD detection still runs in
  the rule layer, so no capability is lost.
- Class imbalance is handled with **SMOTE** (k-NN minority oversampling), with a
  graceful fallback to `class_weight="balanced"`.
- The decision threshold is **data-driven** — the max-F1 point on the
  precision-recall curve, persisted to `fraud_threshold.json`.

**Honest limitation (documented in `fraud_model_report.txt`):** on the current
seeded data the classes come from different *sources* (curated legit listings vs.
flagged scraped junk), so a single structural feature (`description_length`) can
separate them — permutation-importance analysis exposes this. The ML layer is
therefore treated as a **weak auxiliary signal**; the rule layer remains the
primary, trustworthy detector. Production requires same-source, human-verified
labels and a held-out test set.

---

## 5. Bot 1 — Scholarship Auto-Updater (GPT-4o + Serper)

Runs every 4 days on a rotating batch. For each scholarship it searches Google
(Serper), then asks GPT-4o to extract verified changes.

**Safety model — "trust but verify":**

- GPT must return **per-field confidence + evidence quotes**.
- Each change is **confidence-gated** (≥ 0.80) and **validated** (robust
  multi-format deadline parsing, CGPA range checks, amount/funding sanity).
- A past verified deadline → the scholarship is **auto-archived**, not left live.
- "Discontinued" is **never** applied destructively: it requires ≥ 0.90
  confidence and only **flags the item for admin review** (`auto_flagged`),
  never a silent auto-reject.
- Transient API failures are **retried**.

---

## 6. Bot 2 — Auto-Verify (Staged Scholarship Promoter)

Runs after the daily scrape. Decides what to publish from the staging table.

| Risk score | Action |
|---|---|
| 0–29 (SAFE) | eligible for auto-approve (subject to gates below) |
| 30–49 (MEDIUM) | sent to admin review queue |
| ≥ 50 (HIGH/CRITICAL) | auto-rejected (admin can override) |

**Pre-promotion gates** (a clean score is necessary but not sufficient):

1. **Fresh fraud re-check** — never trusts a stale score.
2. **Duplicate guard** — same URL, or same (title + country), is blocked.
3. **URL liveness** — dead application links are not published.
4. **Deadline guard** — already-expired scholarships are not published.

Items failing any gate are routed to **admin review** rather than going live.
After a batch with promotions, the embedding cache is refreshed so new
scholarships are immediately discoverable in chat.

---

## 7. Data Model (selected tables)

`users`, `scholarships`, `universities`, `applications`, `saved_scholarships`,
`scholarship_staging`, `pipeline_logs`, `chat_sessions` / `chat_messages`,
`user_scholarship_interactions` (ML feedback), `visa_profiles` / `visa_checklists`,
and the teacher-marketplace tables (`teacher_profiles`, `courses`, `lessons`,
`quizzes`, `enrollments`, `teacher_reviews`).

---

## 8. Security & Operations

- **JWT** auth (bcrypt-hashed passwords), role-based access (student / teacher / admin).
- **Rate limiting** (SlowAPI, 200/min) and **security headers** (HSTS, X-Frame-Options, etc.).
- **CORS** restricted to known dev origins.
- **APScheduler** jobs: deadline emails, smart notifications, weekly model
  retrain, daily fraud scan, daily scrape + auto-verify, 4-day auto-update,
  daily expired-archive, and embedding-cache refresh.

---

*ScholarIQ · Final Year Project · 2026*
