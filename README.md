# Resolvify (Customer support agent)

A multi-tenant AI customer support platform. Companies get an isolated chatbot (RAG over their docs); when the AI cannot help or detects a policy breach, conversations escalate to human-handled tickets. Admins manage documents and tickets; end users chat via a widget embeddable on any client site.

---

## Problem Statement

**Why not use a public chatbot?**  
Customer support answers must be accurate, on-policy, and based on each company’s own content (policies, products, FAQs). Public or generic chatbots do not have access to that data and can hallucinate or give wrong advice. Companies need a system that grounds answers in their documents and keeps each client’s data separate.

**Why human escalation?**  
The model can be wrong, the knowledge base can be incomplete, or the user can ask for something that requires human judgment (refunds, exceptions, complaints). When the AI detects an escalation intent or a possible policy breach (e.g. user asks for more than policy allows), the system creates a ticket so a human can take over. The chatbot is an assistant, not a replacement for support staff.

---

## Architecture Overview

The system has three main parts:

1. **User-facing chat** — Widget or embed on the client’s website. Users send messages without logging in. Each request is tagged with a `client_id` so all data (chat, RAG, tickets) is scoped to that client.

2. **Admin panel** — Authenticated (JWT) React app where admins upload/delete documents and view/resolve tickets. Admins are tied to a `client_id`; they only see documents and tickets for their client.

3. **AI engine** — FastAPI backend that runs a LangGraph-based support agent: intent classification → RAG (when applicable) or small talk / out-of-scope / escalation. RAG uses a per-client ChromaDB vector store. Conversation state is checkpointed so follow-ups stay in context.

**Multi-tenant isolation** is done with `client_id`:  
- MongoDB collections (users, clients, tickets) and document metadata store `client_id`.  
- ChromaDB uses one vector store per client (e.g. `client_{client_id}`).  
- Chat and admin APIs resolve the client from the request (e.g. body, JWT, or embed config) and never return or query another client’s data.

*Placeholder: add an architecture diagram (e.g. `docs/architecture.png`) here.*

---

## Data Flow

**Chat (user → response)**  
1. User sends a message from the widget; frontend calls `POST /chat` with `query`, optional `thread_id`, and `client_id`.  
2. Backend validates `client_id` (and optionally origin).  
3. LangGraph agent runs: intent classifier → router → one of: RAG node, small talk, out-of-scope, “ask for full issue”, or escalation.  
4. RAG node: query (plus prior context summary) is run against the client’s ChromaDB index; retrieved chunks are passed to the LLM to generate an answer.  
5. If the route is “escalation”, the agent returns a message and sets an internal “escalated” flag.  
6. After the graph run, if escalated, the backend creates a ticket (thread_id, user message, optional bot summary) and returns `ticket_id` in the response.  
7. Frontend shows the reply and, if `ticket_id` is present, a “ticket created” state.

**Document upload → vector store**  
1. Admin uploads a file via the admin panel (authenticated).  
2. Backend stores the file under `client_id` and enqueues or runs an async ingestion job.  
3. Ingestion: PDF is loaded, split into chunks, embedded with the same model used at query time, and written to ChromaDB in the client’s collection (e.g. `company_{client_id}_kb`).  
4. Metadata (e.g. `client_id`, `doc_id`) is stored with each chunk for filtering and deletion.

**Ticket escalation (AI → human)**  
1. User expresses need for a human or the agent detects a policy breach (e.g. requested days > policy).  
2. Agent may ask “describe your full issue in one message” and then, on the next message, run the escalation node.  
3. Backend creates a ticket (OPEN, linked to `thread_id`, user query, optional bot answer).  
4. Response includes `escalated: true` and `ticket_id`. Widget shows that a ticket was created.

**Admin ticket resolution**  
1. Admin opens the tickets list (filtered by their `client_id`).  
2. Admin opens a ticket, adds remarks, and marks it RESOLVED (or deletes it).  
3. Backend updates the ticket document in MongoDB (status, `admin_remarks`, `updated_at`).

---

## Core Features

- **Multi-tenant support** — Isolation by `client_id` in DB, vector store, and APIs.  
- **RAG-based answers** — Queries run against the client’s ingested documents; answers are grounded in retrieved chunks.  
- **Context-aware follow-ups** — Stored conversation summary and checkpointed state allow follow-up questions in the same thread.  
- **Human escalation and ticketing** — Escalation intent or policy-breach detection creates a ticket; admins see and resolve tickets.  
- **Admin document lifecycle** — Upload PDFs, async ingestion into ChromaDB; delete documents (and their vectors) per client.  
- **Chat history isolation** — Thread state is keyed by `thread_id` (and effectively client); no cross-tenant leakage.

---

## Trade-offs & Design Decisions

- **ChromaDB** — Embedded vector store, no separate server; per-client directories keep isolation simple. Chosen for ease of deployment and good fit for single-region, moderate-scale RAG.  
- **MongoDB** — Flexible schema for users, clients, tickets, and document metadata; simple to add fields and query by `client_id`.  
- **Centralized agent (LangGraph)** — One orchestration layer for intent, RAG, and escalation keeps logic in one place and makes it easier to add branches or retries later.  
- **Widget / embed instead of full user auth** — End users do not log in; the widget is embedded with a `client_id` (e.g. in the URL or config). Reduces friction and integration work for client sites; identity is optional and can be added later.  
- **Intentional simplifications** — Single LLM and single embedding model; no A/B or multi-model routing. Ticket model is flat (no priorities or categories). Focus is on clear flow and maintainability rather than feature breadth.

---

## Limitations

- **No advanced RBAC** — Admins are per-client but there are no roles (e.g. viewer vs manager) or fine-grained permissions.  
- **No analytics dashboard** — No built-in metrics, charts, or reporting on chat volume, resolution time, or RAG usage.  
- **No billing** — No usage-based billing, quotas, or subscription tiers.  
- **Basic summarization** — Conversation context is summarized in a simple way for follow-ups; no long-document or thread summarization.  
- **Single-region deployment** — No multi-region or geo-redundancy; ChromaDB and MongoDB are assumed to run in one environment.

---

## Future Scope

- **Multi-admin roles** — Viewer, agent, admin with different permissions per client.  
- **Analytics and monitoring** — Dashboards for ticket volume, resolution time, escalation rate, and RAG retrieval quality.  
- **Auto-summarized tickets** — Short summary generated when a ticket is created or resolved.  
- **CRM integration** — Webhooks or APIs to push tickets to external CRMs.  
- **Rate limiting per client** — Throttling by `client_id` to avoid abuse and support fair usage.

---

## How This Project Demonstrates Engineering Skills

- **System design** — Clear separation of chat, admin, and AI engine; multi-tenant isolation via `client_id`; defined data flows for chat, ingestion, and tickets.  
- **Async backend** — FastAPI and async MongoDB; non-blocking ingestion so uploads don’t block the API.  
- **AI safety and fallback** — Intent classification and policy-breach checks; escalation path when the model shouldn’t answer; tickets as a guaranteed handoff to humans.  
- **Real-world trade-offs** — Documented choices (ChromaDB, MongoDB, widget-based integration, what was kept simple) and honest limitations and future work.

---

## How to Run

**Prerequisites**  
- Python 3.11+ (backend), Node 18+ (frontend)  
- MongoDB running and reachable  
- Hugging Face token (for LLM and embeddings) if using HF models  

**Backend**  
- From repo root: `cd backend`  
- Create a `.env` with at least: `MONGO_URI`, `FRONTEND_URL`, `JWT_SECRET_KEY`, `HF_TOKEN`. Optional: `EMBEDDING_MODEL`, `CHAT_MODEL_REPO`, `ALGORITHM`, `JWT_EXPIRE_MINUTES`.  
- Install dependencies (e.g. `pip install -r requirements.txt` if present, or install from `pyproject.toml`).  
- Run the API, e.g. `uvicorn app.main:app --reload` (from `backend` or with `app.main:app` from the right working directory).  

**Frontend**  
- From repo root: `cd frontend`  
- Create a `.env` if needed (e.g. `VITE_API_URL` or equivalent for the backend base URL).  
- `npm install` then `npm run dev`.  
- Open the app (e.g. `http://localhost:5173`). Use the embed with `?client_id=...` for the chat widget; use the admin UI to log in, upload documents, and manage tickets.  

**Environment variables (backend)**  
- `MONGO_URI` — MongoDB connection string.  
- `FRONTEND_URL` — Allowed CORS origin for the frontend (e.g. `http://localhost:5173`).  
- `JWT_SECRET_KEY` — Secret for signing JWT tokens.  
- `HF_TOKEN` — Hugging Face API token for model access.  
- `EMBEDDING_MODEL` — Model name for embeddings (default e.g. `sentence-transformers/all-MiniLM-L6-v2`).  
- `CHAT_MODEL_REPO` — Chat model repo (default e.g. `Qwen/Qwen2.5-7B-Instruct`).  

Before using RAG, at least one document must be uploaded and ingested for the client so the corresponding ChromaDB collection exists.
