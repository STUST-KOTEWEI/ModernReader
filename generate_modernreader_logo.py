#!/usr/bin/env python3
"""Generate ModernReader brand logos (light + dark variants)."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter


CANVAS = (2000, 1200)
ICON_SIZE = 860
ICON_POS = (120, 170)
TITLE_POS = (1050, 430)
TAGLINE_POS = (1050, 640)

LIGHT_BG = (248, 246, 244)
DARK_BG_TOP = (20, 24, 45)
DARK_BG_BOTTOM = (9, 12, 28)

GRADIENT_START = (255, 138, 92)
GRADIENT_END = (147, 56, 255)

TITLE_FONTS = [
    "/System/Library/Fonts/Supplemental/Avenir.ttc",
    "/System/Library/Fonts/Supplemental/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
]


def load_font(paths: Iterable[str], size: int) -> ImageFont.FreeTypeFont:
    for path in paths:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def diagonal_gradient(size: Tuple[int, int], start: Tuple[int, int, int], end: Tuple[int, int, int]) -> Image.Image:
    w, h = size
    x = np.linspace(0.0, 1.0, w, dtype=np.float32)
    y = np.linspace(0.0, 1.0, h, dtype=np.float32)
    mix = (0.6 * x[None, :] + 0.4 * y[:, None])
    mix = (mix - mix.min()) / (mix.max() - mix.min())
    start_arr = np.array(start, dtype=np.float32)
    end_arr = np.array(end, dtype=np.float32)
    arr = start_arr + (end_arr - start_arr) * mix[..., None]
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, mode="RGB").convert("RGBA")


def build_icon() -> Image.Image:
    icon = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    grad = diagonal_gradient((ICON_SIZE, ICON_SIZE), GRADIENT_START, GRADIENT_END)
    mask = Image.new("L", (ICON_SIZE, ICON_SIZE), 0)
    mask_draw = ImageDraw.Draw(mask)
    m_shape = [
        (80, 720),
        (80, 200),
        (270, 150),
        (360, 360),
        (430, 220),
        (520, 150),
        (780, 220),
        (780, 720),
        (600, 720),
        (600, 360),
        (430, 540),
        (250, 360),
        (250, 720),
    ]
    mask_draw.polygon(m_shape, fill=255)
    grad.putalpha(mask)
    icon.alpha_composite(grad)

    draw = ImageDraw.Draw(icon, "RGBA")
    center = (430, 380)
    arc_colors = [
        (255, 255, 255, 180),
        (255, 255, 255, 140),
        (255, 255, 255, 90),
    ]
    for idx, radius in enumerate((210, 290, 360)):
        box = [center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius]
        draw.arc(box, start=215, end=335, fill=arc_colors[idx], width=8 - idx * 2)

    dot_radius = 16
    draw.ellipse(
        [center[0] + 240 - dot_radius, center[1] - 40 - dot_radius,
         center[0] + 240 + dot_radius, center[1] - 40 + dot_radius],
        fill=(255, 255, 255, 220),
    )

    icon = icon.filter(ImageFilter.GaussianBlur(radius=0.5))
    return icon


def add_text(base: Image.Image, title_color: Tuple[int, int, int], tagline_color: Tuple[int, int, int]) -> None:
    title_font = load_font(TITLE_FONTS, 180)
    tagline_font = load_font(TITLE_FONTS, 70)
    draw = ImageDraw.Draw(base)
    draw.text(TITLE_POS, "ModernReader", font=title_font, fill=title_color)
    draw.text(TAGLINE_POS, "Sweet · Watch · Experience · Enjoy · Tell", font=tagline_font, fill=tagline_color)


def gradient_background(size: Tuple[int, int], top: Tuple[int, int, int], bottom: Tuple[int, int, int]) -> Image.Image:
    w, h = size
    gradient = np.linspace(0.0, 1.0, h, dtype=np.float32)[:, None]
    top_arr = np.array(top, dtype=np.float32)
    bottom_arr = np.array(bottom, dtype=np.float32)
    arr = top_arr + (bottom_arr - top_arr) * gradient
    arr = np.tile(arr[:, None, :], (1, w, 1)).astype(np.uint8)
    return Image.fromarray(arr, mode="RGB").convert("RGBA")


def compose_logo(background: Image.Image, icon: Image.Image, title_color, tagline_color) -> Image.Image:
    canvas = background.copy()
    canvas.alpha_composite(icon, dest=ICON_POS)
    add_text(canvas, title_color, tagline_color)
    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(
        [
            ICON_POS[0] - 40,
            ICON_POS[1] - 80,
            ICON_POS[0] + ICON_SIZE + 40,
            ICON_POS[1] + ICON_SIZE + 80,
        ],
        fill=(255, 255, 255, 40),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=60))
    canvas = Image.alpha_composite(canvas, glow)
    return canvas


def main() -> None:
    icon = build_icon()

    light_bg = Image.new("RGBA", CANVAS, LIGHT_BG + (255,))
    light_logo = compose_logo(light_bg, icon, title_color=(30, 36, 44), tagline_color=(80, 84, 96))
    light_logo.save("modernreader_logo_light.png")

    dark_bg = gradient_background(CANVAS, DARK_BG_TOP, DARK_BG_BOTTOM)
    dark_logo = compose_logo(dark_bg, icon, title_color=(255, 255, 255), tagline_color=(196, 208, 255))
    dark_logo.save("modernreader_logo_dark.png")

    icon.save("modernreader_logo_mark.png")
    print("✅ Generated logos: modernreader_logo_light.png, modernreader_logo_dark.png, modernreader_logo_mark.png")


if __name__ == "__main__":
    main()
