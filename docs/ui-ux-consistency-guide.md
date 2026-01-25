# Rententio UI/UX Consistency Guide

Purpose: Ensure all AI agents and contributors build consistent, high-quality UI that aligns with Rententio’s retention-first product thesis and brand kit.

Scope: This guide defines UX principles, layout rules, UI patterns, component standards, content guidelines, and a Mobbin + AI workflow for sourcing best-in-class patterns without copying aesthetics.

---

## 1) Product & UX North Star

Rententio is the AI editor that edits for attention. The UI should communicate:
- Calm confidence: “AI is handling this; you’re in control.”
- Speed to value: fast progress, quick wins, minimal friction.
- Data-guided editing: insights are clear, not intimidating.

### Non-negotiables
- One primary action per screen.
- Always show progress for long-running tasks.
- Manual override is always visible.
- Data should guide, not overwhelm.

---

## 2) UX Flow Guardrails

Primary flow (happy path):
Upload → Analyze → Retention View → Reorder → Subtitles → Export

Each step must:
- Have a single, obvious primary CTA.
- Show where the user is in the flow.
- Provide a minimal, helpful explanation in plain language.

---

## 3) Layout & Information Hierarchy Rules

### Page structure
- Header: app name, workspace context, minimal global actions.
- Main area: primary task and content.
- Side or bottom panel: optional detail and manual overrides.

### Hierarchy
- H1: page goal (e.g., “Analyze Clips”).
- H2: section blocks (e.g., “Segments”, “Retention Score”).
- H3: sub-details (e.g., “Top Moments”).

### Density
- Default to spacious spacing and short blocks.
- Avoid stacking multiple graphs or dense tables on one screen.
- Limit to one data visualization per screen unless explicitly needed.

---

## 4) Component Standards

### Buttons
- Primary CTA: filled button, high contrast.
- Secondary: outline or ghost, lower emphasis.
- One primary CTA per screen; never more than two total CTAs in a single view.

### Inputs
- Label above field; concise placeholder.
- Use helper text sparingly; avoid long explanations under inputs.

### Progress / Loading
- Always show state changes.
- Use progress bars for long tasks, spinners for short tasks.
- Include status narration (e.g., “Analyzing clips for hooks”).

### Lists & cards
- Use cards for segments and retention scores.
- Card layout: title → short metadata → action(s).

### Modals
- Only for destructive actions or confirmations.
- Never block active progress flows with modals.

---

## 5) Retention Score UX Rules

Retention is the key differentiator. It must be:
- Explainable in 3 seconds.
- Consistent across all views.
- Shown with a short explanation and what to do next.

**Display format**
- Numeric score (0–100) + label (e.g., “Strong”, “Needs Work”).
- Short explanation under the score (1–2 lines max).
- Optional tooltip for deeper detail.

**Do not**
- Hide the score behind clicks.
- Show complex math or unfamiliar terms.
- Present it without a suggested action.

---

## 6) Copy & Tone

Tone: intelligent, clear, human. Never over-technical.

### Microcopy rules
- Use declarative language: “Analyzing clips” vs “We are currently analyzing…”
- Tell users what’s happening, not how it’s built.
- Keep labels short (1–3 words).
- Use calm error copy: “Upload failed. Try again or check your file format.”

---

## 7) Visual Direction (Structure Only)

These are structure-level rules; colors and exact fonts belong in design tokens.
- Emphasize clarity and contrast in primary actions.
- Use consistent spacing between repeated elements.
- Use monospaced typography for numeric scores, timestamps, and analytics.

---

## 8) Mobbin + AI Workflow (Recommended)

Mobbin is for pattern recognition, not copying. Use this repeatable loop:

1) Define UX question
- Example: “How do top apps show progress during long processing?”

2) Curate 5–7 reference screens max
- 2–3 apps, 1–2 screens each.

3) AI pattern extraction prompt
- “Analyze these screens and extract recurring patterns for hierarchy, spacing, CTA placement, loading feedback, and microcopy. Ignore colors and branding.”

4) Derive 3–5 rules for Rententio
- Example: “Single central progress indicator; CTA disabled until completion; short status narration.”

5) Apply in Figma or code
- Do not reuse exact layouts or copy; adapt patterns to Rententio’s flow.

---

## 9) Component Consistency Checklist

Use this checklist before merging a UI change:
- [ ] One primary action per screen.
- [ ] Manual override is visible and easy to access.
- [ ] Progress state is visible for any async task.
- [ ] Retention score has a label and short explanation.
- [ ] No more than one data visualization per screen.
- [ ] Microcopy is calm, short, and consistent.

---

## 10) Agent Instructions (When Building UI)

When an AI agent builds or proposes UI:
1) Start from the current screen goal.
2) Identify primary action and required states.
3) Choose existing components before creating new ones.
4) Preserve spacing and hierarchy rules.
5) If adding new UI patterns, update this guide with the pattern rationale.

---

## 11) Deliverables Per Screen

Each new screen should include:
- Goal statement (1 sentence).
- Primary action.
- States: empty, loading, error, success.
- Retention score placement (if relevant).
- Notes on manual override control.

---

## 12) Open Questions

To finalize the design system:
- What are the exact design tokens (spacing, font sizes, colors)?
- What component library (if any) should we standardize on?
- What is the expected platform target (web only vs mobile web)?

---

End of guide.
