"""Lightweight text emotion analysis without external dependencies.

This module provides a simple, language-agnostic(ish) emotion detector
using lexicon hints and emoji/markup heuristics. It returns a normalized
probability distribution across emotions, plus the top label.

Intended as an interim solution until a proper ML model is integrated.
"""
from __future__ import annotations

from collections import Counter
from typing import Dict, List, Tuple


# Supported emotions
EMOTIONS: List[str] = [
    "joy",
    "sadness",
    "anger",
    "fear",
    "surprise",
    "disgust",
    "neutral",
]


# Minimal multilingual-ish lexicon (English + a few zh-TW keywords)
LEXICON: Dict[str, List[str]] = {
    "joy": [
        "happy",
        "joy",
        "delighted",
        "glad",
        "cheerful",
        "pleased",
        "wonderful",
        "great",
        "awesome",
        "love",
        "快樂",
        "高興",
        "喜悅",
        "開心",
        "笑",
    ],
    "sadness": [
        "sad",
        "unhappy",
        "sorrow",
        "depressed",
        "down",
        "gloomy",
        "grief",
        "tearful",
        "難過",
        "傷心",
        "悲傷",
    ],
    "anger": [
        "angry",
        "mad",
        "furious",
        "rage",
        "annoyed",
        "irritated",
        "pissed",
        "憤怒",
        "生氣",
        "火大",
    ],
    "fear": [
        "fear",
        "afraid",
        "scared",
        "anxious",
        "worry",
        "worried",
        "terror",
        "panic",
        "nervous",
        "害怕",
        "恐懼",
        "擔心",
    ],
    "surprise": [
        "surprise",
        "surprised",
        "amazed",
        "astonished",
        "shocked",
        "wow",
        "unexpected",
        "驚訝",
        "驚喜",
    ],
    "disgust": [
        "disgust",
        "disgusted",
        "gross",
        "yuck",
        "nasty",
        "sickening",
        "revolting",
        "噁",
        "噁心",
        "厭惡",
        "反感",
    ],
}


# Simple emoji / markup hints
EMOJI_HINTS: Dict[str, List[str]] = {
    "joy": [":)", "😀", "😄", "😂", "🥰", "❤"],
    "sadness": [":(", "😢", "😭", "😞"],
    "anger": ["😡", "🤬"],
    "fear": ["😱", "😰", "😨"],
    "surprise": ["😲", "🤯", "!"],
    "disgust": ["🤢", "🤮"],
}


def analyze_text_emotions(text: str) -> Tuple[Dict[str, float], str]:
    """Return emotion probability distribution and top label.

    Heuristic rules:
    - Count lexicon hits per emotion via substring presence (case-insensitive)
    - Count emoji/markup hints
    - If no signal, return neutral=1.0
    - Otherwise, normalize counts across emotions; keep small neutral prior
    """
    if not text:
        return {"neutral": 1.0}, "neutral"

    t = text.lower()
    counts: Counter[str] = Counter()

    # Lexicon hits
    for emotion, words in LEXICON.items():
        for w in words:
            if w and w.lower() in t:
                counts[emotion] += 1

    # Emoji and punctuation hints
    for emotion, hints in EMOJI_HINTS.items():
        for h in hints:
            if h in text:
                counts[emotion] += 1

    total_hits = sum(counts.values())

    # No signal -> neutral
    if total_hits == 0:
        return {"neutral": 1.0}, "neutral"

    # Add a tiny neutral prior to avoid zeroing
    neutral_prior = 0.2
    total = total_hits + neutral_prior

    probs: Dict[str, float] = {}
    for e in EMOTIONS:
        if e == "neutral":
            probs[e] = neutral_prior / total
        else:
            probs[e] = counts.get(e, 0) / total

    # Top emotion (excluding neutral unless it's the only signal)
    non_neutral = {k: v for k, v in probs.items() if k != "neutral"}
    if non_neutral:
        top = max(non_neutral.items(), key=lambda kv: kv[1])[0]
    else:
        top = "neutral"

    return probs, top
