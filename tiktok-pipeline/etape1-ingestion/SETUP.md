# Étape 1 — Ingestion YouTube : Setup complet

## 1. Schéma du workflow (13 nodes)

```
POST /webhook/youtube-ingest
         │
         ▼
[1] Webhook Trigger
         │  {youtube_url}
         ▼
[2] Postgres: Vérif Idempotence
         │  {count: 0 ou 1}
         ▼
[3] IF: Déjà Traité
    count > 0 ──► [4] Respond: Déjà Traité → HTTP 200 {status: already_processed}
    count = 0 ──► [5] Code JS: Extraire ID YouTube
                       │  {youtube_url, short_id}
                       ▼
                  [6] HTTP: Download + Audio  ──► FastAPI /api/download
                       │  {short_id, title, duration_s, video_path, audio_path}
                       ▼
                  [7] HTTP: Transcription Whisper  ──► FastAPI /api/transcribe
                       │  {transcript_path, word_count}
                       ▼
                  [8] Code JS: Fusion Données
                       │  (merge nodes 6 + 7 + webhook)
                       ▼
                  [9] HTTP: Upload R2  ──► FastAPI /api/upload-r2
                       │  {r2_video_key, r2_transcript_key, r2_video_url}
                       ▼
                  [10] Code JS: Prépare Insert
                       │  (merge pour Postgres)
                       ▼
                  [11] Postgres: Insert Source
                       │  INSERT INTO podcasts_sources ... RETURNING id
                       ▼
                  [12] HTTP: Telegram Notify
                       │  POST api.telegram.org
                       ▼
                  [13] Respond: Succès → HTTP 200 {status: success, ...}
```

### Détail de chaque node

| # | Nom | Type n8n | Input attendu | Output renvoyé |
|---|-----|----------|---------------|----------------|
| 1 | Webhook Trigger | `n8n-nodes-base.webhook` | `{"youtube_url": "https://..."}` | `{youtube_url}` |
| 2 | Postgres: Vérif Idempotence | `n8n-nodes-base.postgres` | `{youtube_url}` | `{count: int}` |
| 3 | IF: Déjà Traité | `n8n-nodes-base.if` | `{count}` | True (existe) / False (nouveau) |
| 4 | Respond: Déjà Traité | `n8n-nodes-base.respondToWebhook` | — | `{"status":"already_processed"}` |
| 5 | Code JS: Extraire ID YouTube | `n8n-nodes-base.code` | `{youtube_url}` | `{youtube_url, short_id}` |
| 6 | HTTP: Download + Audio | `n8n-nodes-base.httpRequest` | `{youtube_url, short_id}` | `{short_id, title, duration_s, video_path, audio_path}` |
| 7 | HTTP: Transcription Whisper | `n8n-nodes-base.httpRequest` | `{audio_path, short_id}` | `{transcript_path, word_count, duration_s}` |
| 8 | Code JS: Fusion Données | `n8n-nodes-base.code` | (accède aux nodes 6+7+webhook) | `{short_id, youtube_url, title, duration_s, video_path, audio_path, transcript_path}` |
| 9 | HTTP: Upload R2 | `n8n-nodes-base.httpRequest` | `{short_id, youtube_url, video_path, audio_path, transcript_path}` | `{r2_video_key, r2_transcript_key, r2_video_url, r2_transcript_url}` |
| 10 | Code JS: Prépare Insert | `n8n-nodes-base.code` | (accède aux nodes 6+9) | `{youtube_url, title, duration_s, r2_video_path, r2_transcript_path}` |
| 11 | Postgres: Insert Source | `n8n-nodes-base.postgres` | tout ci-dessus | `{id}` (RETURNING) |
| 12 | HTTP: Telegram Notify | `n8n-nodes-base.httpRequest` | — | `{"ok": true}` |
| 13 | Respond: Succès | `n8n-nodes-base.respondToWebhook` | — | `{"status":"success", "short_id":..., ...}` |

---

## 2. Instructions de setup initial

### 2a. Credentials n8n à créer

Aller dans n8n → **Settings → Credentials → New Credential**.

**Credential 1 — PostgreSQL**
- Type : `Postgres`
- Nom : `Postgres Pipeline TikTok`
- Host : `localhost` (ou `postgres` si Postgres est dans Docker Compose)
- Port : `5432`
- Database : `tiktok_pipeline` (le nom que tu choisiras)
- User : `pipeline_user`
- Password : ton mot de passe Postgres

> ⚠️ Après création, noter l'ID de la credential (visible dans l'URL n8n).
> Remplacer `REMPLACER_PAR_ID_CREDENTIAL` dans le JSON du workflow.
> **Alternativement** : dans n8n, ouvre le workflow importé → clique sur chaque
> node Postgres → sélectionne la credential dans la liste déroulante. C'est plus simple.

---

### 2b. Variables d'environnement — docker-compose.yml

Ajouter ces variables dans la section `environment` du service n8n
ET dans le service `fastapi-worker` (voir docker-compose complet ci-dessous) :

```yaml
# ─────────────────────────────────────────────
# docker-compose.yml — extrait des env vars
# ─────────────────────────────────────────────

services:
  n8n:
    image: n8nio/n8n
    environment:
      # URL vers le worker FastAPI (depuis le réseau Docker interne)
      - FASTAPI_WORKER_URL=http://fastapi-worker:8001
      # Token et chat ID Telegram
      - TELEGRAM_BOT_TOKEN=123456789:ABCdef...
      - TELEGRAM_CHAT_ID=-100123456789
      # Répertoire de travail partagé (voir volumes)
      - PIPELINE_WORK_DIR=/data/pipeline_work
    volumes:
      - n8n_data:/home/node/.n8n
      - pipeline_work:/data/pipeline_work  # Partagé avec fastapi-worker !

  fastapi-worker:
    build:
      context: ./tiktok-pipeline/etape1-ingestion
      dockerfile: Dockerfile.worker
    ports:
      - "8001:8001"
    environment:
      # Clé API OpenAI (pour Whisper)
      - OPENAI_API_KEY=sk-proj-...
      # DSN Postgres : postgresql://user:pass@host:port/dbname
      - POSTGRES_DSN=postgresql://pipeline_user:MOT_DE_PASSE@postgres:5432/tiktok_pipeline
      # Cloudflare R2
      - R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
      - R2_ACCESS_KEY_ID=votre_access_key
      - R2_SECRET_ACCESS_KEY=votre_secret_key
      - R2_BUCKET_NAME=tiktok-pipeline
      # Répertoire de travail partagé avec n8n
      - PIPELINE_WORK_DIR=/data/pipeline_work
    volumes:
      - pipeline_work:/data/pipeline_work

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=tiktok_pipeline
      - POSTGRES_USER=pipeline_user
      - POSTGRES_PASSWORD=MOT_DE_PASSE_FORT_ICI
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  n8n_data:
  postgres_data:
  pipeline_work:  # Volume partagé entre n8n et fastapi-worker
```

---

### 2c. Dockerfile pour le worker FastAPI

Créer `tiktok-pipeline/etape1-ingestion/Dockerfile.worker` :

```dockerfile
FROM python:3.11-slim

# Installer FFmpeg (nécessaire pour l'extraction audio)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code du worker
COPY worker.py .

# Lancer uvicorn sur le port 8001
CMD ["uvicorn", "worker:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

### 2d. requirements.txt

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
yt-dlp==2024.11.18
openai==1.54.0
boto3==1.35.0
psycopg2-binary==2.9.9
pydantic==2.9.0
```

---

### 2e. Commandes SQL — Créer les tables Postgres

Se connecter à Postgres (`psql -U pipeline_user -d tiktok_pipeline`) et exécuter :

```sql
-- ──────────────────────────────────────────────────────────────
-- Table principale : sources de podcasts YouTube
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS podcasts_sources (
    id                  SERIAL PRIMARY KEY,
    youtube_url         TEXT UNIQUE NOT NULL,      -- URL YouTube (clé unique pour idempotence)
    title               TEXT,                       -- Titre de la vidéo YouTube
    duration_s          INTEGER,                   -- Durée en secondes
    r2_video_path       TEXT,                      -- Chemin dans le bucket R2 (ex: sources/ID/video.mp4)
    r2_transcript_path  TEXT,                      -- Chemin dans le bucket R2 (ex: sources/ID/transcript.json)
    status              TEXT DEFAULT 'pending',    -- pending | transcribed | processed | published
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Index pour accélérer la vérification d'idempotence
CREATE INDEX IF NOT EXISTS idx_podcasts_sources_url
    ON podcasts_sources(youtube_url);

-- ──────────────────────────────────────────────────────────────
-- Table de logs pipeline (tracabilité de chaque étape)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shorts_pipeline_log (
    id          SERIAL PRIMARY KEY,
    timestamp   TIMESTAMP DEFAULT NOW(),
    node_name   TEXT NOT NULL,     -- Nom du node/endpoint qui a loggé
    short_id    TEXT,              -- ID YouTube de la vidéo
    status      TEXT NOT NULL,     -- started | success | error
    payload     JSONB              -- Données d'entrée ou de sortie
);

-- Index pour retrouver rapidement tous les logs d'un short
CREATE INDEX IF NOT EXISTS idx_pipeline_log_short_id
    ON shorts_pipeline_log(short_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_log_timestamp
    ON shorts_pipeline_log(timestamp DESC);
```

---

## 3. Code Python de chaque endpoint FastAPI

Le code Python complet est dans `worker.py`.
Voici un résumé de ce que fait chaque endpoint :

### `POST /api/download` (node 6)

**Reçoit :**
```json
{"youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "short_id": "dQw4w9WgXcQ"}
```

**Actions :**
1. Crée `/tmp/tiktok_pipeline/<short_id>/`
2. Lance `yt-dlp` : télécharge en MP4 ≤720p → `video.mp4`
3. Lance `ffmpeg` : extrait l'audio en MP3 mono 16kHz → `audio.mp3`

**Renvoie :**
```json
{
  "short_id": "dQw4w9WgXcQ",
  "youtube_url": "https://...",
  "title": "Comment épargner 500€/mois",
  "duration_s": 3612,
  "video_path": "/tmp/tiktok_pipeline/dQw4w9WgXcQ/video.mp4",
  "audio_path": "/tmp/tiktok_pipeline/dQw4w9WgXcQ/audio.mp3",
  "video_size_mb": 142.3,
  "audio_size_mb": 18.7,
  "status": "downloaded"
}
```

---

### `POST /api/transcribe` (node 7)

**Reçoit :**
```json
{"audio_path": "/tmp/tiktok_pipeline/dQw4w9WgXcQ/audio.mp3", "short_id": "dQw4w9WgXcQ"}
```

**Actions :**
1. Vérifie que le fichier existe et fait < 25 Mo
2. Envoie à `OpenAI Whisper API` (modèle `whisper-1`, langue `fr`, format `verbose_json`, timestamps par mot)
3. Sauvegarde la réponse dans `transcript.json`

**Renvoie :**
```json
{
  "short_id": "dQw4w9WgXcQ",
  "transcript_path": "/tmp/tiktok_pipeline/dQw4w9WgXcQ/transcript.json",
  "word_count": 6234,
  "duration_s": 3612.5,
  "language": "fr",
  "text_preview": "Bonjour à tous, bienvenue dans ce nouvel épisode...",
  "status": "transcribed"
}
```

> ⚠️ **Limite Whisper : 25 Mo.** Un podcast de 1h en MP3 mono 16kHz ≈ 110 Mo.
> Pour des vidéos > 30 min, il faut découper l'audio. Une prochaine étape du pipeline gérera ça.
> Pour l'instant, tester avec des vidéos < 20 min.

---

### `POST /api/upload-r2` (node 9)

**Reçoit :**
```json
{
  "short_id": "dQw4w9WgXcQ",
  "youtube_url": "https://...",
  "video_path": "/tmp/.../video.mp4",
  "audio_path": "/tmp/.../audio.mp3",
  "transcript_path": "/tmp/.../transcript.json"
}
```

**Actions :**
1. Upload `video.mp4` → R2 `sources/dQw4w9WgXcQ/video.mp4`
2. Upload `transcript.json` → R2 `sources/dQw4w9WgXcQ/transcript.json`
3. Supprime les fichiers locaux temporaires

**Renvoie :**
```json
{
  "short_id": "dQw4w9WgXcQ",
  "r2_video_url": "https://ACCOUNT.r2.cloudflarestorage.com/tiktok-pipeline/sources/dQw4w9WgXcQ/video.mp4",
  "r2_transcript_url": "https://ACCOUNT.r2.cloudflarestorage.com/tiktok-pipeline/sources/dQw4w9WgXcQ/transcript.json",
  "r2_video_key": "sources/dQw4w9WgXcQ/video.mp4",
  "r2_transcript_key": "sources/dQw4w9WgXcQ/transcript.json",
  "status": "uploaded"
}
```

---

## 4. Importer le workflow dans n8n

1. Dans n8n : **Workflows → New → ⋮ (trois points) → Import from File**
2. Sélectionner `workflow.json`
3. Pour chaque node Postgres : cliquer dessus → sélectionner `Postgres Pipeline TikTok` dans "Credential"
4. Vérifier que la variable `FASTAPI_WORKER_URL` est bien définie (sinon les HTTP Request échoueront)
5. Activer le workflow (toggle en haut à droite)

---

## 5. Procédure de test node par node

### Test préalable : vérifier que le worker est en vie

```bash
curl http://localhost:8001/health
# Attendu : {"status":"ok","timestamp":"2026-04-22T10:00:00"}
```

---

### Test node 1 — Webhook Trigger

Récupérer l'URL du webhook dans n8n (mode Test → "Test URL").
```bash
# Remplacer <WEBHOOK_URL> par l'URL affichée dans n8n
curl -X POST https://ton-vps.com/webhook-test/youtube-ingest \
  -H "Content-Type: application/json" \
  -d '{"youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

---

### Test node 2 — Postgres: Vérif Idempotence

```bash
# Sur le VPS, dans psql :
psql -U pipeline_user -d tiktok_pipeline -c \
  "SELECT COUNT(*)::int AS count FROM podcasts_sources WHERE youtube_url = 'https://test.com';"
# Attendu : count = 0 (table vide)
```

---

### Test node 6 — FastAPI /api/download (isolé)

```bash
# ⚠️ Utiliser une courte vidéo YouTube (< 5 min) pour le test
curl -X POST http://localhost:8001/api/download \
  -H "Content-Type: application/json" \
  -d '{"youtube_url": "https://www.youtube.com/watch?v=jNQXAC9IVRw", "short_id": "jNQXAC9IVRw"}'
# Attendu : {"short_id":"jNQXAC9IVRw","title":"Me at the zoo","duration_s":19,...}
```

---

### Test node 7 — FastAPI /api/transcribe (isolé)

```bash
# Après avoir téléchargé une vidéo (test précédent)
curl -X POST http://localhost:8001/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audio_path": "/tmp/tiktok_pipeline/jNQXAC9IVRw/audio.mp3", "short_id": "jNQXAC9IVRw"}'
# Attendu : {"word_count": ..., "transcript_path": "...", "status": "transcribed"}
```

---

### Test node 9 — FastAPI /api/upload-r2 (isolé)

```bash
curl -X POST http://localhost:8001/api/upload-r2 \
  -H "Content-Type: application/json" \
  -d '{
    "short_id": "jNQXAC9IVRw",
    "youtube_url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    "video_path": "/tmp/tiktok_pipeline/jNQXAC9IVRw/video.mp4",
    "audio_path": "/tmp/tiktok_pipeline/jNQXAC9IVRw/audio.mp3",
    "transcript_path": "/tmp/tiktok_pipeline/jNQXAC9IVRw/transcript.json"
  }'
# Attendu : {"r2_video_url": "https://...", "status": "uploaded"}
```

---

### Test idempotence (rejouer la même URL)

```bash
# Premier appel : traite la vidéo
curl -X POST https://ton-vps.com/webhook/youtube-ingest \
  -d '{"youtube_url": "https://www.youtube.com/watch?v=jNQXAC9IVRw"}'

# Deuxième appel : doit retourner already_processed sans rien retraiter
curl -X POST https://ton-vps.com/webhook/youtube-ingest \
  -d '{"youtube_url": "https://www.youtube.com/watch?v=jNQXAC9IVRw"}'
# Attendu : {"status":"already_processed","message":"URL déjà traitée..."}
```

---

### Vérifier les logs pipeline

```bash
psql -U pipeline_user -d tiktok_pipeline -c \
  "SELECT timestamp, node_name, short_id, status FROM shorts_pipeline_log ORDER BY timestamp DESC LIMIT 20;"
```

---

## 6. Coûts estimés pour 1 vidéo traitée

### Hypothèses : vidéo podcast de 60 minutes

| Poste | Calcul | Coût |
|-------|--------|------|
| **Whisper API** | 60 min × 0,006 $/min = 0,36 $ | ~0,33 € |
| **Stockage R2 - MP4 720p 1h** | ~600 Mo × 0,015 $/Go/mois ≈ 0,009 $/mois | ~0,01 €/mois |
| **Stockage R2 - Transcript JSON** | ~500 Ko ≈ négligeable | < 0,001 € |
| **Transfert R2 (upload)** | Gratuit (ingress Cloudflare R2) | 0 € |
| **CPU VPS Hetzner** | Inclus dans l'abonnement | 0 € |

**Total par vidéo de 60 min ≈ 0,34 €**

### Projection mensuelle (50 vidéos/semaine = ~200 vidéos/mois)

> Note : 50 shorts/semaine vient en général de 5-10 vidéos sources, pas 200.
> En supposant **10 vidéos sources/semaine × 4 = 40 vidéos/mois** :

| Poste | Calcul | Coût mensuel |
|-------|--------|--------------|
| Whisper (40 vidéos × 60 min) | 2400 min × 0,006 $ | ~13,20 € |
| Stockage R2 (40 × 600 Mo) | 24 Go × 0,015 $/Go | ~0,36 € |
| VPS Hetzner CX31 (4 vCPU/8 GB) | — | ~12 € |
| **Total étape 1 seulement** | | **~26 €/mois** |

**Reste budgétaire pour les étapes suivantes (découpage, montage, publication) :**
~54-104 €/mois sur ton budget de 80-130 €.

---

## 7. Notes importantes pour un débutant

### Pourquoi les Code nodes sont en JavaScript et pas Python ?

Les **Code nodes n8n exécutent du JavaScript**, pas du Python.
Le Python tourne dans le **worker FastAPI** sur le même VPS.
Les HTTP Request nodes font le pont entre n8n et FastAPI.

### Pourquoi un worker FastAPI séparé ?

- `yt-dlp` et `ffmpeg` ne peuvent pas tourner dans n8n directement
- Le worker permet d'avoir des logs Python détaillés (`print(...)`)
- Facilite les tests isolés de chaque étape via `curl`

### La variable `FASTAPI_WORKER_URL` dans n8n

Si n8n et FastAPI sont dans le même Docker Compose réseau :
```
FASTAPI_WORKER_URL=http://fastapi-worker:8001
```
Si tu lances FastAPI directement sur le VPS (sans Docker) :
```
FASTAPI_WORKER_URL=http://172.17.0.1:8001
```
(172.17.0.1 est l'IP de la gateway Docker bridge sur Linux)

### Limite Whisper 25 Mo

Pour contourner cette limite sur les longs podcasts, tu peux découper l'audio
avec FFmpeg en segments de 20 minutes avant d'envoyer à Whisper.
Ce sera géré dans une prochaine version du worker.

### Sécurité du webhook

Pour l'instant le webhook est public. Ajouter un header `Authorization` :
- Dans n8n Webhook node → Authentication → Header Auth → `X-Pipeline-Token`
- Dans tes appels curl : `-H "X-Pipeline-Token: ton_secret"`
