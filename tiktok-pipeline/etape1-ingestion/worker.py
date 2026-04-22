"""
Worker FastAPI - Étape 1 : Ingestion YouTube
Pipeline TikTok FR - Finance Personnelle

Ce fichier tourne sur le même VPS que n8n.
Il reçoit des appels HTTP de n8n et exécute le travail lourd en Python.
Lancer avec : uvicorn worker:app --host 0.0.0.0 --port 8001
"""

import os
import json
import time
import re
import subprocess
import functools
import traceback
from pathlib import Path
from datetime import datetime

import yt_dlp
import psycopg2
import psycopg2.extras
import boto3
from botocore.client import Config
from openai import OpenAI
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Configuration via variables d'environnement (JAMAIS de valeurs en dur)
# ---------------------------------------------------------------------------

# Clé API OpenAI pour Whisper
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

# Connexion Postgres
POSTGRES_DSN = os.environ["POSTGRES_DSN"]
# Format attendu : postgresql://user:password@localhost:5432/dbname

# Cloudflare R2
R2_ENDPOINT    = os.environ["R2_ENDPOINT"]
# Format : https://<account_id>.r2.cloudflarestorage.com
R2_ACCESS_KEY  = os.environ["R2_ACCESS_KEY_ID"]
R2_SECRET_KEY  = os.environ["R2_SECRET_ACCESS_KEY"]
R2_BUCKET      = os.environ["R2_BUCKET_NAME"]

# Répertoire temporaire de travail sur le VPS
WORK_DIR = os.environ.get("PIPELINE_WORK_DIR", "/tmp/tiktok_pipeline")

# ---------------------------------------------------------------------------
# Modèles Pydantic (schéma des requêtes JSON reçues)
# ---------------------------------------------------------------------------

class DownloadRequest(BaseModel):
    youtube_url: str  # L'URL YouTube à télécharger
    short_id: str     # L'ID YouTube extrait (ex: dQw4w9WgXcQ)

class TranscribeRequest(BaseModel):
    audio_path: str  # Chemin local vers le fichier MP3
    short_id: str    # L'ID YouTube pour le logging

class UploadR2Request(BaseModel):
    short_id: str        # ID YouTube
    youtube_url: str     # URL d'origine
    video_path: str      # Chemin local MP4
    audio_path: str      # Chemin local MP3
    transcript_path: str # Chemin local JSON transcript

# ---------------------------------------------------------------------------
# Application FastAPI
# ---------------------------------------------------------------------------

app = FastAPI(title="TikTok Pipeline Worker", version="1.0.0")

# ---------------------------------------------------------------------------
# Utilitaires : Retry avec backoff exponentiel
# ---------------------------------------------------------------------------

def retry(max_attempts: int = 3, backoff_base: float = 2.0):
    """
    Décorateur : relance la fonction en cas d'exception.
    Attente entre les essais : 2s, 4s, 8s (backoff exponentiel).
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    # Tentative d'exécution normale
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        # Dernière tentative échouée → on propage l'erreur
                        raise
                    # Calcul du temps d'attente : 2^attempt secondes
                    wait_seconds = backoff_base ** attempt
                    print(
                        f"[RETRY] Fonction {func.__name__} - "
                        f"tentative {attempt + 1}/{max_attempts} échouée : {e}. "
                        f"Nouvelle tentative dans {wait_seconds:.0f}s..."
                    )
                    time.sleep(wait_seconds)
        return wrapper
    return decorator

# ---------------------------------------------------------------------------
# Utilitaires : Logging Postgres
# ---------------------------------------------------------------------------

def get_db_connection():
    """Ouvre et retourne une connexion Postgres."""
    return psycopg2.connect(POSTGRES_DSN)

def log_pipeline(node_name: str, short_id: str, status: str, payload: dict):
    """
    Insère une ligne dans shorts_pipeline_log.
    Appelé par chaque endpoint pour tracer l'entrée et la sortie.
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO shorts_pipeline_log
                    (timestamp, node_name, short_id, status, payload)
                VALUES
                    (NOW(), %s, %s, %s, %s)
                """,
                (
                    node_name,
                    short_id,
                    status,
                    psycopg2.extras.Json(payload),  # Sérialise le dict en JSONB
                )
            )
        conn.commit()
        conn.close()
    except Exception as e:
        # On ne bloque pas le pipeline si le log échoue, on l'affiche seulement
        print(f"[LOG_PIPELINE] Erreur d'écriture dans shorts_pipeline_log : {e}")

# ---------------------------------------------------------------------------
# Endpoint 1 : Téléchargement vidéo + extraction audio
# ---------------------------------------------------------------------------

@app.post("/api/download")
@retry(max_attempts=3, backoff_base=2.0)
def api_download(req: DownloadRequest):
    """
    Reçoit une URL YouTube.
    1. Télécharge la vidéo en MP4 720p max avec yt-dlp.
    2. Extrait l'audio en MP3 mono 16kHz avec FFmpeg.
    Retourne les chemins locaux + métadonnées.
    """
    print(f"[DOWNLOAD] Début téléchargement : {req.youtube_url}")

    # Log d'entrée
    log_pipeline(
        node_name="DOWNLOAD",
        short_id=req.short_id,
        status="started",
        payload={"youtube_url": req.youtube_url}
    )

    # Créer le dossier de travail pour ce short_id
    job_dir = Path(WORK_DIR) / req.short_id
    job_dir.mkdir(parents=True, exist_ok=True)

    video_path = str(job_dir / "video.mp4")
    audio_path = str(job_dir / "audio.mp3")

    # --- Étape 1 : Téléchargement avec yt-dlp ---
    # On demande : meilleure qualité ≤720p en MP4
    ydl_opts = {
        # Format : vidéo MP4 ≤720p + audio m4a, fusionnés en MP4
        "format": (
            "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]"
            "/best[height<=720][ext=mp4]"
            "/best[height<=720]"
        ),
        # Chemin de sortie : /tmp/tiktok_pipeline/<short_id>/video.mp4
        "outtmpl": video_path,
        # Forcer la sortie en MP4 (fusion si nécessaire)
        "merge_output_format": "mp4",
        # Pas de barre de progression dans les logs
        "quiet": False,
        "no_warnings": False,
        # Écraser si le fichier existe déjà
        "overwrites": True,
    }

    print(f"[DOWNLOAD] Lancement yt-dlp sur {req.youtube_url}")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        # extract_info() télécharge ET retourne les métadonnées
        info = ydl.extract_info(req.youtube_url, download=True)

    # Récupérer titre et durée depuis les métadonnées
    title     = info.get("title", "Titre inconnu")
    duration  = info.get("duration", 0)   # Durée en secondes

    print(f"[DOWNLOAD] Vidéo téléchargée : '{title}' ({duration}s)")

    # --- Étape 2 : Extraction audio avec FFmpeg ---
    # Paramètres :
    #   -i          : fichier d'entrée (la vidéo)
    #   -vn         : supprime la piste vidéo (audio only)
    #   -acodec libmp3lame : encodeur MP3
    #   -ar 16000   : fréquence d'échantillonnage 16kHz (optimal pour Whisper)
    #   -ac 1       : mono (1 canal, réduit la taille)
    #   -q:a 4      : qualité MP3 variable (~165 kbps)
    #   -y          : écraser sans demander
    print(f"[DOWNLOAD] Extraction audio avec FFmpeg → {audio_path}")
    ffmpeg_cmd = [
        "ffmpeg",
        "-i", video_path,
        "-vn",
        "-acodec", "libmp3lame",
        "-ar", "16000",
        "-ac", "1",
        "-q:a", "4",
        "-y",
        audio_path,
    ]
    result = subprocess.run(
        ffmpeg_cmd,
        capture_output=True,  # Capture stdout et stderr
        text=True,
    )
    # Vérifier que FFmpeg n'a pas échoué
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg a échoué : {result.stderr[-500:]}")

    # Calculer la taille du fichier vidéo en Mo
    video_size_mb = round(Path(video_path).stat().st_size / 1024 / 1024, 2)
    audio_size_mb = round(Path(audio_path).stat().st_size / 1024 / 1024, 2)

    print(f"[DOWNLOAD] MP4 : {video_size_mb} Mo | MP3 : {audio_size_mb} Mo")

    # Construction du résultat à renvoyer à n8n
    output = {
        "short_id":    req.short_id,
        "youtube_url": req.youtube_url,
        "title":       title,
        "duration_s":  int(duration),
        "video_path":  video_path,
        "audio_path":  audio_path,
        "video_size_mb": video_size_mb,
        "audio_size_mb": audio_size_mb,
        "status":      "downloaded",
    }

    # Log de sortie
    log_pipeline(
        node_name="DOWNLOAD",
        short_id=req.short_id,
        status="success",
        payload=output
    )

    print(f"[DOWNLOAD] Terminé avec succès : {output}")
    return JSONResponse(content=output)

# ---------------------------------------------------------------------------
# Endpoint 2 : Transcription Whisper
# ---------------------------------------------------------------------------

@app.post("/api/transcribe")
@retry(max_attempts=3, backoff_base=2.0)
def api_transcribe(req: TranscribeRequest):
    """
    Reçoit le chemin local d'un fichier MP3.
    Envoie le fichier à l'API OpenAI Whisper avec timestamps mot par mot.
    Sauvegarde le JSON de transcript localement.
    """
    print(f"[TRANSCRIBE] Début transcription : {req.audio_path}")

    # Log d'entrée
    log_pipeline(
        node_name="TRANSCRIBE",
        short_id=req.short_id,
        status="started",
        payload={"audio_path": req.audio_path}
    )

    # Vérifier que le fichier audio existe bien
    if not Path(req.audio_path).exists():
        raise FileNotFoundError(f"Fichier audio introuvable : {req.audio_path}")

    # Initialiser le client OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)

    # Calculer la taille du fichier (Whisper limite à 25 Mo)
    audio_size_mb = Path(req.audio_path).stat().st_size / 1024 / 1024
    print(f"[TRANSCRIBE] Taille audio : {audio_size_mb:.1f} Mo")
    if audio_size_mb > 24:
        raise ValueError(
            f"Fichier audio trop grand ({audio_size_mb:.1f} Mo). "
            "Whisper API limite à 25 Mo. Découper l'audio avant."
        )

    # Appel à l'API Whisper
    # response_format="verbose_json" : retourne le JSON complet avec timestamps
    # timestamp_granularities=["word"] : timestamps mot par mot
    print(f"[TRANSCRIBE] Envoi à Whisper API (modèle whisper-1)...")
    with open(req.audio_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="fr",                         # Forcer le français
            response_format="verbose_json",        # JSON avec métadonnées complètes
            timestamp_granularities=["word"],      # Timestamp par mot
        )

    # Convertir l'objet response en dictionnaire Python
    transcript_data = response.model_dump()

    # Sauvegarder le JSON de transcript localement
    job_dir = Path(req.audio_path).parent
    transcript_path = str(job_dir / "transcript.json")
    with open(transcript_path, "w", encoding="utf-8") as f:
        json.dump(transcript_data, f, ensure_ascii=False, indent=2)

    # Compter les mots dans le transcript
    word_count = len(transcript_data.get("words", []))
    text_preview = transcript_data.get("text", "")[:100]  # 100 premiers caractères

    print(f"[TRANSCRIBE] {word_count} mots transcrits. Début : '{text_preview}...'")

    output = {
        "short_id":       req.short_id,
        "transcript_path": transcript_path,
        "word_count":     word_count,
        "duration_s":     transcript_data.get("duration", 0),
        "language":       transcript_data.get("language", "fr"),
        "text_preview":   text_preview,
        "status":         "transcribed",
    }

    # Log de sortie
    log_pipeline(
        node_name="TRANSCRIBE",
        short_id=req.short_id,
        status="success",
        payload=output
    )

    print(f"[TRANSCRIBE] Terminé : {output}")
    return JSONResponse(content=output)

# ---------------------------------------------------------------------------
# Endpoint 3 : Upload vers Cloudflare R2
# ---------------------------------------------------------------------------

@app.post("/api/upload-r2")
@retry(max_attempts=3, backoff_base=2.0)
def api_upload_r2(req: UploadR2Request):
    """
    Upload le MP4 et le JSON de transcript vers Cloudflare R2.
    Structure dans le bucket :
      sources/<short_id>/video.mp4
      sources/<short_id>/transcript.json
    """
    print(f"[UPLOAD_R2] Début upload pour short_id={req.short_id}")

    # Log d'entrée
    log_pipeline(
        node_name="UPLOAD_R2",
        short_id=req.short_id,
        status="started",
        payload={"video_path": req.video_path, "transcript_path": req.transcript_path}
    )

    # Initialiser le client S3 compatible R2
    # endpoint_url : l'URL de votre compte R2 (pas s3.amazonaws.com)
    # config=Config(signature_version="s3v4") : R2 utilise la signature AWS v4
    s3_client = boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",  # R2 utilise "auto" comme région
    )

    # Chemin de base dans le bucket pour ce short
    r2_prefix = f"sources/{req.short_id}"

    # --- Upload MP4 ---
    r2_video_key = f"{r2_prefix}/video.mp4"
    print(f"[UPLOAD_R2] Upload MP4 → {R2_BUCKET}/{r2_video_key}")
    s3_client.upload_file(
        Filename=req.video_path,
        Bucket=R2_BUCKET,
        Key=r2_video_key,
        ExtraArgs={"ContentType": "video/mp4"},
    )

    # --- Upload JSON transcript ---
    r2_transcript_key = f"{r2_prefix}/transcript.json"
    print(f"[UPLOAD_R2] Upload transcript → {R2_BUCKET}/{r2_transcript_key}")
    s3_client.upload_file(
        Filename=req.transcript_path,
        Bucket=R2_BUCKET,
        Key=r2_transcript_key,
        ExtraArgs={"ContentType": "application/json"},
    )

    # Construire les URLs R2 (format path-style)
    # Note : ces URLs ne sont pas publiques par défaut, elles servent de référence interne
    r2_video_url      = f"{R2_ENDPOINT}/{R2_BUCKET}/{r2_video_key}"
    r2_transcript_url = f"{R2_ENDPOINT}/{R2_BUCKET}/{r2_transcript_key}"

    print(f"[UPLOAD_R2] Upload terminé. Vidéo : {r2_video_url}")

    # Nettoyage des fichiers locaux temporaires pour libérer de l'espace
    for path in [req.video_path, req.audio_path, req.transcript_path]:
        try:
            if Path(path).exists():
                Path(path).unlink()
                print(f"[UPLOAD_R2] Fichier local supprimé : {path}")
        except Exception as e:
            print(f"[UPLOAD_R2] Impossible de supprimer {path} : {e}")

    output = {
        "short_id":          req.short_id,
        "r2_video_url":      r2_video_url,
        "r2_transcript_url": r2_transcript_url,
        "r2_video_key":      r2_video_key,
        "r2_transcript_key": r2_transcript_key,
        "status":            "uploaded",
    }

    # Log de sortie
    log_pipeline(
        node_name="UPLOAD_R2",
        short_id=req.short_id,
        status="success",
        payload=output
    )

    print(f"[UPLOAD_R2] Terminé : {output}")
    return JSONResponse(content=output)

# ---------------------------------------------------------------------------
# Endpoint de santé (health check)
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    """Vérifie que le worker est en vie. Utilisé par n8n pour détecter les pannes."""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
