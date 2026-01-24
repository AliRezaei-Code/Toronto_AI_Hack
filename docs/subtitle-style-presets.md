# Subtitle Style Presets

> See [readme.md](readme.md) for overall project context. These presets extend the Retention Editing Corpus with subtitle-specific styling.

## Overview

This document defines the subtitle styling presets available for the video editing pipeline. These presets are stored in the Retention Editing Corpus JSON and applied by the FFmpeg MCP and After Effects MCP.

## Preset Definitions

### Retention Editing Corpus Addition

Add this to the existing Retention Editing Corpus JSON:

```json
{
  "subtitle_styles": {
    "viral_tiktok": {
      "id": "viral_tiktok",
      "name": "Viral TikTok",
      "description": "Bold, centered text with word-by-word highlight animation",
      "platform_optimized": ["tiktok", "reels", "shorts"],
      "font": {
        "family": "Montserrat",
        "weight": "Bold",
        "fallback": ["Arial Black", "Helvetica Bold"]
      },
      "size": {
        "base": 48,
        "min": 36,
        "max": 64,
        "unit": "px",
        "scale_with_resolution": true
      },
      "colors": {
        "primary": "#FFFFFF",
        "highlight": "#FFFF00",
        "outline": "#000000",
        "shadow": "rgba(0,0,0,0.5)"
      },
      "outline": {
        "width": 3,
        "color": "#000000"
      },
      "shadow": {
        "enabled": true,
        "offset_x": 2,
        "offset_y": 2,
        "blur": 4,
        "color": "rgba(0,0,0,0.5)"
      },
      "position": {
        "vertical": "center",
        "horizontal": "center",
        "margin_bottom": 0,
        "margin_sides": 40
      },
      "animation": {
        "type": "word_highlight",
        "highlight_color": "#FFFF00",
        "timing": "sync_with_speech",
        "easing": "ease-out"
      },
      "text_transform": "uppercase",
      "max_chars_per_line": 35,
      "max_lines": 2,
      "line_spacing": 1.2
    },

    "professional": {
      "id": "professional",
      "name": "Professional",
      "description": "Clean, readable subtitles for professional content",
      "platform_optimized": ["youtube", "linkedin", "corporate"],
      "font": {
        "family": "Arial",
        "weight": "Regular",
        "fallback": ["Helvetica", "sans-serif"]
      },
      "size": {
        "base": 32,
        "min": 24,
        "max": 40,
        "unit": "px",
        "scale_with_resolution": true
      },
      "colors": {
        "primary": "#FFFFFF",
        "background": "rgba(0,0,0,0.7)"
      },
      "outline": {
        "width": 0,
        "color": "none"
      },
      "background": {
        "enabled": true,
        "color": "rgba(0,0,0,0.7)",
        "padding": 8,
        "border_radius": 4
      },
      "position": {
        "vertical": "bottom",
        "horizontal": "center",
        "margin_bottom": 60,
        "margin_sides": 20
      },
      "animation": {
        "type": "none"
      },
      "text_transform": "none",
      "max_chars_per_line": 60,
      "max_lines": 2,
      "line_spacing": 1.4
    },

    "minimal": {
      "id": "minimal",
      "name": "Minimal",
      "description": "Subtle, non-intrusive subtitles",
      "platform_optimized": ["any"],
      "font": {
        "family": "Inter",
        "weight": "Medium",
        "fallback": ["SF Pro", "Arial"]
      },
      "size": {
        "base": 28,
        "min": 22,
        "max": 34,
        "unit": "px",
        "scale_with_resolution": true
      },
      "colors": {
        "primary": "#FFFFFF",
        "outline": "#333333"
      },
      "outline": {
        "width": 1,
        "color": "#333333"
      },
      "shadow": {
        "enabled": true,
        "offset_x": 1,
        "offset_y": 1,
        "blur": 2,
        "color": "rgba(0,0,0,0.3)"
      },
      "position": {
        "vertical": "bottom",
        "horizontal": "center",
        "margin_bottom": 40,
        "margin_sides": 30
      },
      "animation": {
        "type": "fade",
        "duration_ms": 150
      },
      "text_transform": "none",
      "max_chars_per_line": 50,
      "max_lines": 2,
      "line_spacing": 1.3
    },

    "karaoke": {
      "id": "karaoke",
      "name": "Karaoke Style",
      "description": "Progressive word reveal like karaoke lyrics",
      "platform_optimized": ["tiktok", "reels", "music"],
      "font": {
        "family": "Poppins",
        "weight": "SemiBold",
        "fallback": ["Montserrat", "Arial Bold"]
      },
      "size": {
        "base": 44,
        "min": 32,
        "max": 56,
        "unit": "px",
        "scale_with_resolution": true
      },
      "colors": {
        "primary": "#CCCCCC",
        "highlight": "#FFFFFF",
        "outline": "#000000"
      },
      "outline": {
        "width": 2,
        "color": "#000000"
      },
      "position": {
        "vertical": "center",
        "horizontal": "center",
        "margin_bottom": 0,
        "margin_sides": 40
      },
      "animation": {
        "type": "karaoke_fill",
        "inactive_color": "#CCCCCC",
        "active_color": "#FFFFFF",
        "timing": "word_by_word",
        "easing": "linear"
      },
      "text_transform": "uppercase",
      "max_chars_per_line": 40,
      "max_lines": 2,
      "line_spacing": 1.2
    },

    "podcast": {
      "id": "podcast",
      "name": "Podcast Clip",
      "description": "Speaker-focused with name labels",
      "platform_optimized": ["youtube", "shorts", "clips"],
      "font": {
        "family": "Roboto",
        "weight": "Regular",
        "fallback": ["Arial", "sans-serif"]
      },
      "size": {
        "base": 36,
        "min": 28,
        "max": 44,
        "unit": "px",
        "scale_with_resolution": true
      },
      "colors": {
        "primary": "#FFFFFF",
        "speaker_label": "#FFD700",
        "background": "rgba(0,0,0,0.8)"
      },
      "background": {
        "enabled": true,
        "color": "rgba(0,0,0,0.8)",
        "padding": 12,
        "border_radius": 8
      },
      "position": {
        "vertical": "bottom",
        "horizontal": "center",
        "margin_bottom": 80,
        "margin_sides": 20
      },
      "animation": {
        "type": "typewriter",
        "speed": "match_speech"
      },
      "speaker_label": {
        "enabled": true,
        "position": "above",
        "font_size": 24,
        "color": "#FFD700"
      },
      "text_transform": "none",
      "max_chars_per_line": 55,
      "max_lines": 3,
      "line_spacing": 1.4
    },

    "gaming": {
      "id": "gaming",
      "name": "Gaming/Streaming",
      "description": "High contrast with glow effects for gaming content",
      "platform_optimized": ["twitch", "youtube", "shorts"],
      "font": {
        "family": "Russo One",
        "weight": "Regular",
        "fallback": ["Impact", "Arial Black"]
      },
      "size": {
        "base": 42,
        "min": 34,
        "max": 52,
        "unit": "px",
        "scale_with_resolution": true
      },
      "colors": {
        "primary": "#00FF00",
        "secondary": "#FFFFFF",
        "outline": "#000000",
        "glow": "#00FF00"
      },
      "outline": {
        "width": 3,
        "color": "#000000"
      },
      "glow": {
        "enabled": true,
        "color": "#00FF00",
        "blur": 10,
        "strength": 0.5
      },
      "position": {
        "vertical": "bottom",
        "horizontal": "center",
        "margin_bottom": 100,
        "margin_sides": 30
      },
      "animation": {
        "type": "pop_in",
        "scale_from": 0.8,
        "duration_ms": 100
      },
      "text_transform": "uppercase",
      "max_chars_per_line": 45,
      "max_lines": 2,
      "line_spacing": 1.1
    }
  }
}
```

## Style Preview Examples

### Viral TikTok Style
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│         THIS IS HOW YOU            │
│         MAKE VIRAL CONTENT          │
│         ────────────────            │
│         (word highlights in yellow) │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Professional Style
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ This is professional text   │   │
│  │ with a background box       │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Animation Types

### `word_highlight`
Each word highlights as it's spoken.

```json
{
  "animation": {
    "type": "word_highlight",
    "highlight_color": "#FFFF00",
    "timing": "sync_with_speech"
  }
}
```

### `karaoke_fill`
Words fill with color progressively like karaoke.

```json
{
  "animation": {
    "type": "karaoke_fill",
    "inactive_color": "#CCCCCC",
    "active_color": "#FFFFFF"
  }
}
```

### `typewriter`
Text appears character by character.

```json
{
  "animation": {
    "type": "typewriter",
    "speed": "match_speech"
  }
}
```

### `pop_in`
Words pop in with scale animation.

```json
{
  "animation": {
    "type": "pop_in",
    "scale_from": 0.8,
    "duration_ms": 100
  }
}
```

### `fade`
Simple fade in/out between subtitle segments.

```json
{
  "animation": {
    "type": "fade",
    "duration_ms": 150
  }
}
```

## FFmpeg Style Conversion

Convert preset to FFmpeg subtitle filter parameters:

```python
def preset_to_ffmpeg_style(preset: dict) -> str:
    """Convert preset to FFmpeg force_style string."""
    style_parts = [
        f"FontName={preset['font']['family']}",
        f"FontSize={preset['size']['base']}",
        f"PrimaryColour=&H{hex_to_bgr(preset['colors']['primary'])}&",
        f"OutlineColour=&H{hex_to_bgr(preset['outline']['color'])}&",
        f"Outline={preset['outline']['width']}",
        f"Alignment={position_to_alignment(preset['position'])}",
        f"MarginV={preset['position']['margin_bottom']}"
    ]

    if preset.get('shadow', {}).get('enabled'):
        style_parts.append("Shadow=1")
        style_parts.append(f"BackColour=&H{hex_to_bgr(preset['shadow']['color'])}&")

    return ",".join(style_parts)


def hex_to_bgr(hex_color: str) -> str:
    """Convert #RRGGBB to BBGGRR for ASS format."""
    hex_color = hex_color.lstrip('#')
    r, g, b = hex_color[0:2], hex_color[2:4], hex_color[4:6]
    return f"{b}{g}{r}"
```

## After Effects Integration

For animated styles, generate AE-compatible keyframe data:

```json
{
  "ae_subtitle_layer": {
    "name": "Subtitles",
    "style_preset": "viral_tiktok",
    "keyframes": [
      {
        "time": 0.0,
        "text": "THIS",
        "properties": {
          "opacity": 100,
          "scale": [100, 100],
          "fill_color": [255, 255, 0]
        }
      },
      {
        "time": 0.3,
        "text": "THIS IS",
        "properties": {
          "word_highlight_index": 1
        }
      }
    ],
    "expressions": {
      "text_animator": "word_highlight_expression.jsx",
      "params": {
        "highlight_color": [255, 255, 0],
        "base_color": [255, 255, 255]
      }
    }
  }
}
```

## Platform-Specific Recommendations

| Platform | Recommended Preset | Notes |
|----------|-------------------|-------|
| TikTok | `viral_tiktok` | Center position, bold, animated |
| Instagram Reels | `viral_tiktok` | Same as TikTok |
| YouTube Shorts | `viral_tiktok` or `gaming` | Depends on content type |
| YouTube (long-form) | `professional` | Clean, readable |
| LinkedIn | `professional` | Corporate-friendly |
| Twitch clips | `gaming` | High contrast, glow |
| Podcast clips | `podcast` | Speaker labels |

## Custom Style API

Users can create custom styles by extending a base preset:

```json
{
  "method": "burn_subtitles",
  "params": {
    "video_url": "...",
    "subtitle_url": "...",
    "style": {
      "base_preset": "viral_tiktok",
      "overrides": {
        "colors": {
          "primary": "#FF6B6B",
          "highlight": "#4ECDC4"
        },
        "font": {
          "family": "Bebas Neue"
        }
      }
    }
  }
}
```

--

**Related Documents:**
- [Transcription MCP Spec](transcription-mcp-spec.md)
- [Architecture Update](architecture-transcription.md)
- [Integration Guide](transcription-integration-guide.md)
- [MongoDB Schema](mongodb-transcription-schema.md)
