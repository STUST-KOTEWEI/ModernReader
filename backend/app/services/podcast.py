"""Podcast generation service with Azure Speech and local fallback.

This service synthesizes audio for a chapter and stores it on disk.
It exposes a path that can be served via an API endpoint.
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional
import shutil
import subprocess
from tempfile import TemporaryDirectory

from app.core.config import settings
from app.models.content import BookChapter


class PodcastService:
    def __init__(self, storage_dir: Optional[Path] = None) -> None:
        root = Path(__file__).resolve().parents[2]
        self.storage = storage_dir or (root / "app" / "storage" / "audio")
        self.storage.mkdir(parents=True, exist_ok=True)

    def _chapter_filename(self, chapter: BookChapter) -> Path:
        safe = f"{chapter.id}.wav"
        return self.storage / safe

    def is_configured(self) -> bool:
        provider = (settings.TTS_PROVIDER or "").lower()
        if provider == "azure":
            return bool(
                settings.AZURE_SPEECH_KEY and settings.AZURE_SPEECH_REGION
            )
        if provider == "local":
            return self._local_available()
        return False

    def _local_available(self) -> bool:
        """Detect if a local TTS tool is available (macOS say or espeak)."""
        # Prefer macOS 'say' if present
        if shutil.which("say"):
            return True
        # Fallback to espeak on Linux
        if shutil.which("espeak"):
            return True
        return False

    def synthesize_chapter(self, chapter: BookChapter) -> Path:
        provider = (settings.TTS_PROVIDER or "").lower()
        if provider == "local":
            return self._synthesize_local(chapter)
        if provider != "azure":
            raise RuntimeError(
                "TTS provider not configured. Set TTS_PROVIDER=azure and "
                "AZURE_SPEECH_KEY/REGION, or TTS_PROVIDER=local."
            )

        try:
            import azure.cognitiveservices.speech as speechsdk  # type: ignore
        except Exception as e:  # pragma: no cover
            raise RuntimeError(
                "azure-cognitiveservices-speech is not installed"
            ) from e

        speech_config = speechsdk.SpeechConfig(
            subscription=settings.AZURE_SPEECH_KEY,
            region=settings.AZURE_SPEECH_REGION,
        )
        if settings.AZURE_SPEECH_VOICE:
            speech_config.speech_synthesis_voice_name = (
                settings.AZURE_SPEECH_VOICE
            )

        # Use PullAudioOutputStream to write WAV file
        out_path = self._chapter_filename(chapter)
        audio_config = speechsdk.audio.AudioOutputConfig(
            filename=str(out_path)
        )
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config,
            audio_config=audio_config,
        )

        text = chapter.text
        result = synthesizer.speak_text(text)
        if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
            raise RuntimeError(f"Synthesis failed: {result.reason}")
        return out_path

    # ----- Local provider (free) -----
    def _synthesize_local(self, chapter: BookChapter) -> Path:
        out_path = self._chapter_filename(chapter)
        text = chapter.text or ""
    # system info not currently needed for branching

        # On macOS, use 'say' to AIFF then convert to WAV via afconvert/ffmpeg
        if shutil.which("say"):
            with TemporaryDirectory() as tmp:
                aiff = Path(tmp) / "tmp.aiff"
                cmd = ["say", "-o", str(aiff), text]
                subprocess.run(cmd, check=True)
                # Convert to WAV
                if shutil.which("afconvert"):
                    subprocess.run(
                        [
                            "afconvert",
                            str(aiff),
                            str(out_path),
                            "-f",
                            "WAVE",
                            "-d",
                            "LEI16",
                        ],
                        check=True,
                    )
                elif shutil.which("ffmpeg"):
                    subprocess.run(
                        ["ffmpeg", "-y", "-i", str(aiff), str(out_path)],
                        check=True,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                else:
                    raise RuntimeError(
                        "Local TTS requires 'afconvert' or 'ffmpeg' to "
                        "convert AIFF to WAV on macOS."
                    )
            return out_path

        # On Linux, use espeak to WAV directly
        if shutil.which("espeak"):
            subprocess.run(
                [
                    "espeak",
                    text,
                    "--stdout",
                ],
                check=True,
                stdout=open(out_path, "wb"),
            )
            return out_path

        raise RuntimeError(
            "No local TTS tool found. Install 'say' (macOS) or 'espeak' "
            "(Linux), or use Azure (set TTS_PROVIDER=azure)."
        )
