# ScholarIQ Implementation Note for Developers

## Bilingual RAG (Retrieval-Augmented Generation) Logic

### 1. Database-First Verified Retrieval
The chatbot is designed to prioritize accuracy and verification. Before generating any response, the system **MUST** query the verified PostgreSQL database.
- **Verification Protocol**: The AI is strictly prohibited from hallucinating or generating information not present in the database context.
- **System Prompt Enforcement**: The system prompt explicitly instructs the model: *"You must ONLY provide information based on the verified scholarship data provided to you from our PostgreSQL database."* This ensures 100% data integrity.

### 2. Multi-University Comparison Engine
To assist users in making informed decisions, the chatbot includes a logic layer for comparing universities.
- **Trigger**: When a user asks to compare 2 or 3 universities (e.g., "Compare Oxford and Cambridge").
- **Processing**: The system retrieves structured data for the requested universities (Tuition, GPA, Deadline, Country).
- **Presentation**: The frontend (`Chatbot.tsx`) renders this data using a unified **Markdown Table** component. This allows for a side-by-side comparison that is easy to read on both desktop and mobile.

### 3. High-Performance Response Streaming
- **Technology**: The backend utilizes FastAPI's asynchronous capabilities and streaming responses.
- **Benefit**: This architecture ensures low-latency interactions, providing a "real-time" feel even when performing complex database lookups and RAG processing.
