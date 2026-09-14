# Third-party skills

Every skill folder in this directory is vendored from an upstream project for use while
building this storefront's UI/UX — none are written for this repo specifically. Four
sources, pinned separately. Curated against this repo's actual work (a mobile-first,
TikTok-WebView storefront + a Supabase-backed seller admin console), not copied wholesale —
see `docs/SKILLS-AND-PLUGINS.md`-style reasoning inline below for what was left out and why.

## A · `ui-ux-pro-max` — from `ui-ux-pro-max-skill`

- **Source:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- **Commit:** `7f69fed6a2717900085f1bc3b263721f8ba025e2` (2026-09-10)
- **License:** MIT · **Modification:** none — copied verbatim from
  `.claude/skills/ui-ux-pro-max/`.

The upstream repo ships this as one plugin bundling seven skills
(`ui-ux-pro-max`, `design`, `design-system`, `brand`, `banner-design`, `slides`,
`ui-styling`, ~10 MB total). Only `ui-ux-pro-max` itself is vendored here — it's the
searchable design-intelligence database (styles, palettes, font pairings, UX guidelines,
charts, per-stack implementation notes) the other six lean on; the rest are adjacent
content-generation skills (slide decks, banner ads) this storefront doesn't need.

**Caveat:** the skill's own `SKILL.md` invokes its search script as
`${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/scripts/search.py` — that env var is only
set when the skill is loaded through the Claude Code plugin marketplace mechanism, not when
vendored as a plain repo skill (which is what this is, and deliberately: `.claude/settings.json`
declares no plugin marketplaces, since editing that file's plugin/permission surface is a
self-modification this session's tooling refuses to do unattended — a human running
`/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` then
`/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` gets that resolved automatically instead).
As a vendored skill, invoke the script by its real repo-relative path:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>
```

## B · From `vercel-labs/agent-skills` (3)

- **Source:** https://github.com/vercel-labs/agent-skills
- **Commit:** `063bee94c3f4df8453406c830b0a7df0f2860278` (2026-08-28)
- **License:** MIT · **Modification:** folder renamed to match each skill's own `name:`
  frontmatter (upstream's folder names are shorter than the `vercel-*`-prefixed `name:`
  field; kept the frontmatter name so Claude Code's skill lookup and the description shown
  to the user agree) — file contents otherwise untouched.

`web-design-guidelines`, `vercel-composition-patterns`, `vercel-react-view-transitions`,
`vercel-react-best-practices`.

Chosen against the real stack (React + Vite + Tailwind v4, no Next.js): left out
`deploy-to-vercel`, `vercel-cli-with-tokens`, `vercel-optimize` (this repo deploys via
Vercel's own Git integration per `vercel.json`, not the CLI, and there's no
build-config-level perf lane those skills target here), `react-native-skills` (this is a
WebView storefront, not a native app), and `writing-guidelines` (not a UI/UX skill, and
`CLAUDE.md` already fixes this repo's copy conventions: Burmese UI text, English code).

## C · From `bencium-claude-code-design-skill` (3)

- **Source:** https://github.com/bencium/bencium-claude-code-design-skill
- **Commit:** `8b152ec07240cf671340b96cea6bb3442f697205` (2026-08-30)
- **License:** MIT (Copyright © 2026 bencium.io) · **Modification:** none — copied verbatim.

`bencium-controlled-ux-designer`, `design-audit`, `ui-typography` (upstream's plugin/folder
name is `typography`; its `SKILL.md` frontmatter names it `ui-typography` — vendored under
that name for the same lookup-consistency reason as §B).

The upstream repo is a personal marketplace of 16 plugins; only the three that are actually
UI/UX design tools were taken. Left out as out-of-scope for this repo: `bencium-aeo`
(SEO/AEO content strategy), `bencium-code-conventions`, `bencium-impact-designer` /
`bencium-innovative-ux-designer` / `renaissance-architecture` / `human-architect-mindset`
(overlapping, more opinionated/experimental design-philosophy variants — `design-audit` +
`bencium-controlled-ux-designer` already cover this repo's audit + "ask before deciding"
needs without stacking three similar personas), `relationship-design`,
`adaptive-communication`, `negentropy-lens`, `insurgent-campaign`, `hungarian-humanizer`,
`eu-ai-act-reviewer`, `emotion-statusline`, `vanity-engineering-review` (none are UI/UX
skills).

## D · From `accesslint/claude-marketplace` (5 + 1 shared)

- **Source:** https://github.com/accesslint/claude-marketplace
- **Commit:** `2e9d7336678302d0bc08848e92542560295b34d3` (2026-08-24)
- **License:** MIT · **Modification:** flattened out of the upstream plugin layout
  (`plugins/accesslint/skills/<name>/`, one directory deeper than Claude Code's flat
  `.claude/skills/<name>/SKILL.md` discovery expects) and the shared reference file's folder
  renamed `shared/` → `accesslint-shared/` to avoid colliding with a generic name at this
  level; every `../shared/methodology.md` link in the five `SKILL.md` files was updated to
  `../accesslint-shared/methodology.md` to match. No other content changed.

`accessibility-audit`, `accessibility-inspect`, `accessibility-scan`, `accessibility-fix`,
`accessibility-diff`, plus `accesslint-shared/methodology.md` (WCAG-EM conformance
methodology, severity rubric, and grounding rules the other five all read).

**Caveat:** upstream's live-DOM audits ("auto-launch Chrome, no manual setup") depend on an
MCP server the plugin bundles via its own `.mcp.json` — that only gets registered through a
real plugin install (`/plugin marketplace add accesslint/claude-marketplace` then
`/plugin install accesslint@accesslint`), same reasoning as `ui-ux-pro-max`'s caveat above.
Vendored this way, these five skills still carry the full WCAG 2.2 methodology, severity
rubric, and audit/fix/diff workflow — useful for a manual or Playwright-driven a11y pass
against this storefront's buyer-facing screens — just without the auto-launched browser.

This repo's own `docs/`-equivalent for skill routing is `design/design.md` §6
(Accessibility) — it points here.

## Updating

```bash
git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill /tmp/uupm
diff -r /tmp/uupm/.claude/skills/ui-ux-pro-max .claude/skills/ui-ux-pro-max

git clone --depth 1 https://github.com/vercel-labs/agent-skills /tmp/vercel-skills
diff -r /tmp/vercel-skills/skills/web-design-guidelines .claude/skills/web-design-guidelines
diff -r /tmp/vercel-skills/skills/composition-patterns .claude/skills/vercel-composition-patterns
diff -r /tmp/vercel-skills/skills/react-view-transitions .claude/skills/vercel-react-view-transitions
diff -r /tmp/vercel-skills/skills/react-best-practices .claude/skills/vercel-react-best-practices

git clone --depth 1 https://github.com/bencium/bencium-claude-code-design-skill /tmp/bencium
diff -r /tmp/bencium/bencium-controlled-ux-designer/skills/bencium-controlled-ux-designer .claude/skills/bencium-controlled-ux-designer
diff -r /tmp/bencium/design-audit/skills/design-audit .claude/skills/design-audit
diff -r /tmp/bencium/typography/skills/typography .claude/skills/ui-typography

git clone --depth 1 https://github.com/accesslint/claude-marketplace /tmp/accesslint
diff -r /tmp/accesslint/plugins/accesslint/skills/accessibility-audit .claude/skills/accessibility-audit
# (repeat per accessibility-* folder; re-apply the shared/ -> accesslint-shared/ rename and
# link fix-up in §D when syncing)
```

Bump the commit hashes above when you sync, and re-apply the documented modifications
(§A's invocation-path note is documentation only, nothing to re-apply in the file itself;
§B/§D's renames and §D's link fix-ups need re-doing against the new tree).
