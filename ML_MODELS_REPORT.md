# ScholarIQ — AI / ML Models Report

A complete reference of every AI/ML model in the project: which model, why it
was chosen, how it is used, where its files live, which module calls it, and how
it was trained (or, for GPT, why it is *prompted* rather than trained).

> **Quick summary:** ScholarIQ uses **5 models** in total.
> - **2 models we train ourselves** (RandomForest: recommendation + fraud) — already trained locally, no Google Colab needed.
> - **1 pre-trained embedding model** (all-MiniLM-L6-v2) — downloaded, not trained.
> - **2 GPT models** (GPT-4o / GPT-4o-mini via OpenAI API) — *not trained*; controlled by prompt engineering + RAG.

---

## Model Inventory (at a glance)

| # | Model | Type | Trained by us? | File / Source | Used in module |
|---|---|---|---|---|---|
| 1 | **Recommendation** | RandomForestClassifier (supervised) | ✅ Yes (local) | `backend/ml/scholar_match.pkl` | `app/recommendation/engine.py` |
| 2 | **Fraud Detection** | RandomForestClassifier (supervised) | ✅ Yes (local) | `backend/ml/fraud_model.pkl` | `app/services/fraud_detection.py` |
| 3 | **Embedding (RAG)** | all-MiniLM-L6-v2 (transformer) | ⚙️ No — pre-trained | HuggingFace (auto-download) | `app/services/embedding_cache.py` |
| 4 | **Chatbot LLM** | GPT-4o-mini | ☁️ No — API + prompts | OpenAI API | `app/services/chatbot.py` |
| 5 | **Agent LLM** | GPT-4o | ☁️ No — API + prompts | OpenAI API | `app/services/scholarship_auto_updater.py`, `app/api/consultant.py` |

---

## 1 — Recommendation Model (RandomForest)

| Field | Detail |
|---|---|
| **Model** | `RandomForestClassifier` (scikit-learn), 300 trees, max_depth=6 |
| **Why this model** | Tabular, mixed numeric/binary features; RandomForest is robust, needs no scaling, resists overfitting on small data, and gives feature importances for explainability. Deep learning is overkill for ~hundreds of rows. |
| **What it predicts** | Probability that a given user will *want* a given scholarship (match likelihood, 0–1). |
| **Features (12)** | `cgpa_gap, degree_match, country_match, field_match, fee_affordable, scholarship_value, deadline_days, ielts_match, funding_match, work_exp_match, requires_work, has_work` |
| **Model file** | `backend/ml/scholar_match.pkl` (~456 KB) |
| **Feature list file** | `backend/ml/feature_names.json` |
| **Trainer script** | `backend/ml/train_recommendation_model.py` |
| **Loader / wrapper** | `backend/ml/scorer.py` (`ml_score()`), with a feature-count validation guard |
| **Where used** | `backend/app/recommendation/engine.py` → `get_recommendations()` |
| **API endpoint** | `backend/app/api/recommendations.py` (`/recommendations/`, `/recommendations/profile`) |

**How it is used (hybrid scoring):**
```
final_fit_score = 0.6 × rule_based_score + 0.4 × ML_probability
```
- **Rule layer** = interpretable points (CGPA, country, degree, field, IELTS…).
- **ML layer** = RandomForest probability, learned from real user behaviour.
- **Cold-start fallback:** if a user's profile is < 50% complete, the engine skips ML and returns popularity-based "Popular Pick" scholarships instead.

**How it was trained (purpose + method):**
- **Purpose:** learn from *real student behaviour* which scholarships are genuinely wanted, beyond static rules.
- **Labels (implicit feedback):**
  - Positive (1) = scholarships a user **applied to** or **saved**.
  - Negative (0) = **negative sampling** — random scholarships the user never touched.
  - **Views excluded** (no dwell-time data → ambiguous, would pollute labels).
- **Source data:** `user_scholarship_interactions` table in `scholariq.db`.
- **Evaluation:** 5-fold stratified cross-validation → `backend/ml/rec_model_report.txt`.
- **Where trained:** locally on CPU (seconds). **Google Colab not required.**
- **Command:** `python -m ml.train_recommendation_model`

---

## 2 — Fraud Detection Model (RandomForest)

| Field | Detail |
|---|---|
| **Model** | `RandomForestClassifier` (scikit-learn), 300 trees, max_depth=8 |
| **Why this model** | Same tabular-data reasoning as above; also outputs a *calibrated probability* (not just a yes/no), which we fold into a composite risk score. |
| **What it predicts** | Fraud probability of a scholarship listing (0–1). |
| **Training features (9, anti-leakage)** | `url_reachable, trusted_domain, scholarship_amount_ratio, deadline_too_close, has_official_email, cgpa_min_zero, has_apply_steps, description_length, short_description` |
| **Model file** | `backend/ml/fraud_model.pkl` (~257 KB) |
| **Threshold file** | `backend/ml/fraud_threshold.json` (data-driven, max-F1 on PR curve) |
| **Feature extractor + loader** | `backend/ml/fraud_model.py` (`extract_features()`, `predict_anomaly()`) |
| **Trainer script** | `backend/ml/train_fraud_model.py` |
| **Where used** | `backend/app/services/fraud_detection.py` → `calculate_fraud_risk()` |
| **Also used by** | daily fraud-scan job (`app/tasks`), staged auto-verify bot, admin fraud manager |

**How it is used (hybrid rule + ML):**
1. **Rule layer (primary):** keyword check (processing fees, Western Union, "guaranteed", WhatsApp-only…), suspicious-TLD check, live URL reachability.
2. **ML layer (auxiliary):** RandomForest probability → added into the composite `risk_score` (0–100), bucketed SAFE / MEDIUM / HIGH / CRITICAL.

**How it was trained (purpose + method) — and an honest limitation:**
- **Purpose:** automatically flag scam/fake scholarship listings.
- **Labels:** derived from **documented fraud heuristics** (keywords, suspicious TLDs, implausible award/domain), **not** admin approval status (that would be label contamination).
- **Anti-leakage:** the label-defining features (keyword flags, suspicious TLD) are **excluded from training** so the model can't just memorise the labeling rule.
- **Imbalance:** handled with **SMOTE** (k-NN minority oversampling), fallback to `class_weight="balanced"`.
- **Threshold:** **data-driven** — max-F1 point on the precision-recall curve, saved to `fraud_threshold.json`.
- **Honest finding (documented in `fraud_model_report.txt`):** on the current seeded data, fraud and legitimate examples come from different *sources*, so a single feature (`description_length`) can separate them — permutation-importance analysis exposes this. Therefore the ML layer is treated as a **weak auxiliary signal**; the **rule layer is the primary, trustworthy detector**. Production needs same-source, human-verified labels.
- **Where trained:** locally on CPU. **Colab not required.**
- **Command:** `python -m ml.train_fraud_model`

---

## 3 — Embedding Model (all-MiniLM-L6-v2) — Chatbot RAG

| Field | Detail |
|---|---|
| **Model** | `all-MiniLM-L6-v2` (Sentence-Transformers), 384-dimensional embeddings |
| **Why this model** | Lightweight (~80 MB), fast on CPU, free, strong semantic-search quality. Ideal for on-device retrieval without a paid embedding API. |
| **Trained by us?** | **No.** It is a **pre-trained** model from HuggingFace, downloaded automatically on first run. We only *use* it. |
| **Source** | HuggingFace `sentence-transformers/all-MiniLM-L6-v2` |
| **Where used** | `backend/app/services/embedding_cache.py` (pre-computes scholarship embeddings at startup); queried by `backend/app/services/chatbot.py` |
| **Purpose** | Power the chatbot's **Retrieval-Augmented Generation**: find the scholarships most semantically relevant to a user's question, then feed only those *verified* records to GPT so it never hallucinates. |

**How it is used:**
1. **Startup:** embed all approved/active scholarships once into a cached matrix (`warm_up()`), refreshed every 6 h / nightly / on admin demand.
2. **Per query:** embed the user's question (with profile hints), cosine-similarity rank against the cached matrix (`normalize_embeddings=True` ⇒ dot product = cosine), return top-6.
3. Those 6 verified records are injected into GPT's prompt as ground truth.

> Per-query cost ≈ 40 ms (one query-embedding + a numpy dot product), versus seconds if we re-embedded the whole corpus each request.

---

## 4 & 5 — GPT Models (GPT-4o-mini and GPT-4o)

> **Important clarification:** we do **NOT** train GPT. Training an LLM from scratch needs millions of dollars and huge GPU clusters. Instead we **control** GPT's behaviour with three standard, industry-accepted techniques. This is what "training GPT" means in this project.

### Where each GPT is used

| Model | Module | Purpose |
|---|---|---|
| **GPT-4o-mini** | `app/services/chatbot.py` | Main student/teacher/admin chatbot (cheap, fast) |
| **GPT-4o-mini** | `app/api/sop_writer.py` | Statement-of-Purpose writing assistant |
| **GPT-4o** | `app/services/scholarship_auto_updater.py` | Auto-update bot: extract verified scholarship changes from web search |
| **GPT-4o** | `app/api/consultant.py` | Premium AI consultant |

### How GPT is "trained" (controlled) — 3 techniques

**(a) Prompt Engineering / System Prompts** — `app/services/chatbot.py` (`SYSTEM_PROMPTS`)
- Three **role-specific system prompts** (student / teacher / admin) define GPT's persona, rules, and output format.
- Example rules: reply in clear professional English, warn about scam scholarships, output university comparisons as a table, never invent data.

**(b) RAG — Retrieval-Augmented Generation (grounding)** — `app/services/chatbot.py` + `embedding_cache.py`
- Before answering, the system retrieves **verified scholarships from the database** (via the MiniLM embedding model) and injects them into the prompt with an explicit *"answer ONLY from this data"* instruction.
- This is how we stop hallucination — GPT is "taught" the correct facts at question time, not at training time.

**(c) Structured Output + Confidence Gating** — `app/services/scholarship_auto_updater.py`
- The auto-update bot asks GPT-4o to return **JSON with per-field confidence + evidence quotes**.
- Each change is validated and only applied if confidence ≥ 0.80 (≥ 0.90 to mark a scholarship discontinued, which only *flags for admin* — never auto-deletes).
- Temperature is kept low (0.0–0.1) for deterministic, factual extraction; retries handle transient API errors.

### Personalization
GPT also receives the logged-in user's profile (CGPA, target country, degree, IELTS) and recent conversation history (token-budgeted with `tiktoken`), so answers are personalized and context-aware.

### Requirement
GPT features need `OPENAI_API_KEY` in `backend/.env`. Without it the chatbot **degrades gracefully** to a SQL-based context layer (no crash).

---

## Where everything lives (file map)

```
backend/
├── ml/
│   ├── scholar_match.pkl            # (1) recommendation model
│   ├── feature_names.json           # (1) feature list
│   ├── rec_model_report.txt         # (1) evaluation report
│   ├── train_recommendation_model.py# (1) trainer
│   ├── scorer.py                    # (1) loader/wrapper
│   ├── fraud_model.pkl              # (2) fraud model
│   ├── fraud_threshold.json         # (2) data-driven threshold
│   ├── fraud_model_report.txt       # (2) evaluation report
│   ├── train_fraud_model.py         # (2) trainer
│   └── fraud_model.py               # (2) feature extractor + predict
└── app/
    ├── recommendation/engine.py     # (1) uses recommendation model
    ├── services/fraud_detection.py  # (2) uses fraud model
    ├── services/embedding_cache.py  # (3) MiniLM RAG cache
    ├── services/chatbot.py          # (3)+(4) RAG + GPT-4o-mini
    ├── services/scholarship_auto_updater.py # (5) GPT-4o agent
    ├── api/sop_writer.py            # (4) GPT-4o-mini
    └── api/consultant.py            # (5) GPT-4o
```

---

## How to (re)train the two local models

```bash
cd backend
python -m ml.train_fraud_model            # → fraud_model.pkl + report + threshold
python -m ml.train_recommendation_model   # → scholar_match.pkl + feature_names.json + report
```

Both run in **seconds on CPU** — **no Google Colab / GPU required.** Each writes a
`*_report.txt` containing cross-validation metrics, confusion matrix, ROC-AUC and
feature importances (examiner evidence).

---

*ScholarIQ · AI/ML Models Report · 2026*
