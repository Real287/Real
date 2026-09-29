# MirrorMatch backend plan

Today the app runs entirely on the phone. Nothing is uploaded and no face matching happens.
All server calls go through `js/api.js`, so connecting a backend means filling in that one file.

## What the live product needs
1. **Accounts**: email or phone login. Free option: Supabase Auth.
2. **Database** (Postgres): `profiles`, `consents` (who agreed to what, when, which terms version),
   `match_candidates`, `connections` (both sides must accept), `messages`, `reports`, `blocks`.
   Row-level security so people can only read their own rows.
3. **Private photo storage**: no public links. Free option: Supabase Storage with signed URLs.
4. **Face matching**: a service that turns each photo into a numeric face embedding, stores it in a
   vector index (pgvector in the same Postgres), and finds the nearest neighbours.
   Needs a real face-recognition model, and testing on faces from many regions,
   because accuracy differs by skin tone, age and gender.
5. **Mutual consent**: the server, not the app, must refuse to reveal profiles or open chat
   until both people accept.
6. **Safety**: 18+ check, live-selfie check so people cannot upload someone else's photo, reporting,
   blocking, moderation queue, rate limits.
7. **Deletion**: one action erases the account, photo and embedding.

## Legal (before any public launch)
Face data is biometric data. GDPR (EU/UK), BIPA (Illinois) and similar laws require explicit consent,
a retention policy and deletion rights. Have a lawyer review the terms and privacy notice.
The consent text in the app is a draft.

## Rollout
- **Phase 1 (this build)**: UI, consent flow, Preview Mode, free static hosting.
- **Phase 2**: accounts, database, private storage, consent records.
- **Phase 3**: face embedding and search, tested on a small invited group.
- **Phase 4**: mutual connections, chat, moderation, then wider launch.

## What I will need from you (Phase 2, not now)
- A free Supabase account: project URL and the "anon public" key (never the "service_role" key).
- A decision on the face-recognition provider (I will lay out options with cost and privacy trade-offs).
