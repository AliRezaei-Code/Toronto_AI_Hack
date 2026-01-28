# LLM Knowledge Base for Video Production

## Overview

This knowledge base provides structured, machine-readable information for building video production tools focused on YouTube retention, editing, and SEO optimization. Content is organized by domain for optimal LLM consumption.

## Quick Reference Map

### Documentation

- **README.md** - This file (index and navigation)
- **agent.md** - AI agent usage instructions
- **Script_Retention.md** - Source document (scripting & editing)
- **Visual_Retention.md** - Source document (visual techniques)
- **SEO_Metadata_Engineering.md** - Source document (YouTube optimization)

### Core Concepts (`01_core_concepts/`)

- **retention_psychology.json** - Dopamine loops, cognitive load, attention economy
- **pattern_interrupts.json** - Visual/audio interruption techniques
- **dopamine_engagement.json** - Engagement cycles and reward systems

### Scripting (`02_scripting/`)

- **av_script_format.json** - Audio-visual script templates and structures
- **narrative_techniques.json** - Open loops, context switches, meta-commentary
- **visual_cues.json** - B-roll, motion design prompts, pacing notes

### Visual Editing (`03_visual_editing/`)

- **kinetic_typography.json** - Animated text, captions, overlay techniques
- **spatial_dynamics.json** - Dynamic zoom, map animations, camera movement
- **transitions.json** - Match cuts, invisible cuts, transition styles
- **pacing_rhythm.json** - Visual pacing, 3-second rule, editing rhythm

### Audio Design (`04_audio_design/`)

- **sound_layers.json** - Soundscape layering, dialogue, ambience, SFX
- **music_stems.json** - Music as narrative, stem editing, crescendos
- **mixing_techniques.json** - Audio ducking, EQ pockets, dynamic range

### SEO Metadata (`05_seo_metadata/`)

- **title_optimization.json** - Title formulas, psychological triggers, AI testing
- **description_engineering.json** - Mini-blog strategy, timestamps, key moments
- **technical_metadata.json** - Tags, hashtags, captions, file naming
- **compliance_guidelines.json** - Spam policies, deceptive practices, penalties

### Style Guides (`06_style_guides/`)

- **mrbeast_style.json** - Hyper-retention style (1.5-3s cuts, high stimulation)
- **vox_style.json** - Explainer aesthetic (mixed media, tactile look)
- **lemmino_style.json** - Documentary style (atmospheric, suspense-driven)
- **hormozi_style.json** - High-energy captions (bold fonts, word-by-word)

### Tools & Workflows (`07_tools_workflows/`)

- **software_comparison.json** - NLE comparisons, feature matrices
- **workflow_templates.json** - Step-by-step workflows by content type

### Checklists (`08_checklists/`)

- **retention_checklist.json** - Pre/post-production retention checklist
- **seo_checklist.json** - SEO optimization checklist

## Usage for LLMs

### Query Pattern: "How to optimize retention for tutorials?"

**Load these files in order:**

1. `01_core_concepts/retention_psychology.json` - Understand retention principles
2. `01_core_concepts/pattern_interrupts.json` - Learn interruption techniques
3. `03_visual_editing/pacing_rhythm.json` - Apply pacing strategies
4. `06_style_guides/vox_style.json` - Reference explainer best practices
5. `08_checklists/retention_checklist.json` - Validate implementation

### Query Pattern: "Create SEO-optimized title"

**Load these files in order:**

1. `05_seo_metadata/title_optimization.json` - Access formulas and triggers
2. `05_seo_metadata/compliance_guidelines.json` - Avoid violations
3. `05_seo_metadata/description_engineering.json` - Ensure alignment

## JSON Schema

All files follow a consistent schema:

```json
{
  "meta": {
    "title": "string",
    "category": "string",
    "version": "1.0",
    "lastUpdated": "ISO-date",
    "dependencies": ["related_file.json", ...]
  },
  "summary": "string",
  "core_principles": [...],
  "techniques": [...],
  "data_structures": {...},
  "references": [...]
}
```

## Metadata

- **Created**: January 23, 2026
- **Version**: 1.0
- **Total Files**: 20 JSON documents
- **Source Documents**: Script_Retention.md, Visual_Retention.md, SEO_Metadata_Engineering.md
- **Content Reduction**: 35-40% redundancy eliminated through reorganization

## Dependencies

Files reference each other through the `dependencies` array in `meta` section. This creates a knowledge graph that allows LLMs to follow logical connections between topics.

## Contributing

When adding new content:

1. Follow the established JSON schema
2. Update `dependencies` arrays for cross-references
3. Add new files to this index
4. Update version number in affected files
