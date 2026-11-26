---
name: ralph-init
description: Scaffold the Pocock/Ralph workflow (specs/ layout, ralph-once.sh, afk-ralph.sh, agent-docs block, permission allowlist) into the current repo. Run once per repo, before first use of grill-me/to-spec/to-tickets/implement there.
disable-model-invocation: true
---

# Ralph Init

Scaffold the per-repo pieces of the grill → spec → tickets → loop workflow. The skills
themselves (`grill-me`, `to-spec`, `to-tickets`, `implement`) are user-level and already
available; this sets up what is repo-specific:

1. **The verification gate** — the single command the loop runs to decide "is the work good?"
2. **The loop scripts** — `ralph-once.sh` (supervised) + `afk-ralph.sh` (autonomous), with the gate baked in
3. **The `specs/` convention** — `specs/<slug>/spec.md` + `tickets/` + `progress.txt`
4. **An agent-docs block** — so every fresh loop iteration inherits the conventions
5. **The permission allowlist** — so `claude -p` iterations never stall on prompts

This is a prompt-driven skill, not a deterministic script. Explore, present findings,
confirm with the user, then write.

## Process

### 1. Explore

- **Gate:** look for an obvious single check command — a `check`/`ci`/`verify` script in
  `package.json` / `Makefile` / `justfile` / a repo-root `check.*`; else what CI runs
  (`.github/workflows/*.yml`); else the test + lint + typecheck commands separately.
  Note the exact interpreter path if the repo uses a local venv.
- **Mainline & landing:** default branch name; is it protected / does the repo land via PRs
  (`gh repo view`, branch-protection hints, a merge-queue config like `.mergify.yml`)?
- **Existing state:** `specs/` dir, `ralph-*.sh`, a `CLAUDE.md` or `AGENTS.md`,
  `.claude/settings.local.json` allowlist, whether `claude` and `gh` are on PATH.
- **.gitignore:** should `specs/` be committed (default: yes) — flag if the repo ignores it.

### 2. Confirm (one section at a time, lead with the recommendation)

- **Section A — The gate.** Propose the single command found (compose one if the repo has
  only separate test/lint commands). If the repo has NO tests at all, say so plainly and
  recommend building a minimal gate before ever running `afk-ralph` — an ungated loop
  produces plausible broken code. Offer to proceed with scaffolding anyway (scripts get the
  best available command).
- **Section B — Landing convention.** Recommend: loop runs on a work branch, both scripts
  refuse the default branch, work lands via PR. Only relax the branch guard if the user
  explicitly says they commit straight to the default branch in this repo.
- **Section C — Allowlist.** Propose `.claude/settings.local.json` permission entries for
  the gate command, the test runner, and `git commit`/`git add`. Show the draft before writing.

### 3. Write

- `ralph-once.sh` and `afk-ralph.sh` at the repo root, from the templates in this skill
  folder ([ralph-once.template.sh](./ralph-once.template.sh),
  [afk-ralph.template.sh](./afk-ralph.template.sh)), replacing:
  - `{{GATE}}` → the confirmed gate command
  - `{{MAINLINE}}` → the default branch name
- `specs/.gitkeep` (create the folder; the first `/to-spec` fills it).
- The agent-docs block: if `CLAUDE.md` exists edit it; else if `AGENTS.md` exists edit it;
  if neither, ask which to create. If a `## Ralph workflow` block already exists, update it
  in place — never append a duplicate.

```markdown
## Ralph workflow

Plans live in `specs/<slug>/` — `spec.md` (destination doc, written by /to-spec),
`tickets/NN-*.md` (tracer-bullet vertical slices with blocking edges, written by
/to-tickets; each carries a `Status:` line flipped ready-for-agent → done), and
`progress.txt` (append-only iteration log). The verification gate is `<GATE>` — run it
before every commit. Loop scripts: `./ralph-once.sh specs/<slug>` (one supervised
iteration) and `./afk-ralph.sh <n> specs/<slug>` (bounded autonomous loop); both refuse
to run on `<MAINLINE>`. Work lands via <the confirmed landing convention>.
```

- The allowlist entries into `.claude/settings.local.json` (merge, don't clobber).

### 4. Done

Tell the user: setup complete, and the flow from here is
`/grill-me` → `/to-spec` → `/clear` → `/to-tickets` → branch → `ralph-once` → `afk-ralph` → PR.
Remind them the scripts run from bash (Git Bash on Windows).

## Regras de todo projeto (obrigatórias)
Antes de usar esta skill, aplicar a skill `regras-projeto`: ler todos os documentos do projeto, obedecer as regras dos documentos, nunca inventar valores nem alucinar (evidência `doc:linha`/`arquivo:linha`), perguntar na dúvida, verificar que não quebra homol/deploy/prod (só leitura), testes reais em MySQL conferidos no DBeaver (nunca mock) e validar ponta a ponta com subagentes (skill `verificacao-ponta-a-ponta`). Ser objetivo, realista e assertivo.
