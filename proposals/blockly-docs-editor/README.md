# Proposal: a "blocky" pipeline editor for the spaCy docs

This directory contains the materials for recommending a **visual, block-based
pipeline builder** ("blocky editor") to the upstream spaCy team for the
documentation site at [spacy.io](https://spacy.io).

It is a *pitch package*, not shipped code. The working code lives in the open
pull requests referenced below; these documents exist to frame that work for
the maintainers and to route it through spaCy's actual contribution process.

## Contents

| File | Purpose |
| --- | --- |
| [`DISCUSSION_POST.md`](./DISCUSSION_POST.md) | Ready-to-paste post for **GitHub Discussions → Ideas**. Start here. |
| [`PROPOSAL.md`](./PROPOSAL.md) | The full write-up: problem, proposal, prototype evidence, integration plan, rollout, risks, and maintenance. Link to this from the Discussion. |
| [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) | A short walkthrough for demoing the prototype live (or recording a screen capture to attach to the Discussion). |

## Why this route, in one paragraph

spaCy has **disabled blank issues** (`.github/ISSUE_TEMPLATE/config.yml`); the
only issue templates are *bug report* and *documentation report*. New feature
ideas are explicitly routed to the
[Discussions board](https://github.com/explosion/spaCy/discussions). spaCy's
`CONTRIBUTING.md` also strongly favors **"show, don't tell"** — a working
prototype and a preview deploy will do far more than prose. So the plan is:
**open an Idea in Discussions, link a live demo, and offer the integration PR**,
rather than opening an issue or a cold pull request.

## How the existing PRs map to this proposal

The prototype already exists across the open PRs in this fork:

- **PR #2** — *Add visual pipeline composer built on Blockly* — the standalone
  drag-and-drop app (`pipeline-composer/`) that produces runnable Python, a
  minimal `config.cfg`, and live displaCy output. This is the reference demo,
  hosted live at <https://spacy.fugl.dev>.
- **PR #4** — *Add placeholder skeleton for Blockly pipeline builder on
  website* — the in-docs integration: a working widget embedded at four docs
  locations (`/usage/spacy-101`, `/usage/processing-pipelines`,
  `/usage/training`, `/api/language`), built to the existing
  `src/widgets/` + `remark.js` pattern, with a documented one-file seam to swap
  in the real Blockly canvas.
- **PR #3** — *Next.js 13 → 16 website migration plan* — establishes that the
  docs site can carry this feature, and sequences it against the other work.
- **PR #5** — *Central TypeScript type definitions* — supporting groundwork for
  the website's React/TS migration that the widget benefits from.

This proposal ties those threads into a single recommendation the maintainers
can say yes/no to.
