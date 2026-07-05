---
title: "Common Thread: sockpuppet attribution from public signals"
description: "Common Thread pairs a twelve-section methodology paper with a Cloudflare Workers reference implementation: archive public social artifacts, extract deterministic behavioral features, and emit calibrated cluster-level attribution claims with full chain of custody. For journalists, OSINT practitioners, and researchers who need reproducible investigations without platform-internal data."
pubDate: 2026-06-25
updatedDate: 2026-07-05
tags: ["cloudflare", "ai", "osint", "side-project"]
draft: false
---

**Common Thread** is a practitioner's methodology and open-source reference implementation for attributing coordinated inauthentic behavior (sockpuppet networks) to a common operator using only public behavioral signals from social platforms.

It ships as two things that stay in sync:

1. **A methodology paper** (`paper/`, CC-BY-4.0): the spec. Twelve sections, conservative failure modes, explicit audience exclusions.
2. **A reference implementation** (`implementation/` + `web/`, AGPL-3.0): the machinery.

Given a seed set of accounts, the system archives raw artifacts, extracts deterministic stylometric, temporal, network, and visual features, then uses LLM reasoning to emit calibrated probabilistic claims at three confidence bands: `insufficient`, `consistent`, `strongly_consistent`. It stops at cluster-level attribution by design and never identifies natural persons.

## Who it is for

Pro se litigants, small-newsroom journalists, OSINT practitioners, and academics who need documented methodology without platform-internal data or commercial OSINT tooling. Read the paper's audience exclusions before applying it.

## Pipeline

**Archive.** Ingest public posts and media into content-addressed R2 storage. Signed manifests (Ed25519) preserve chain of custody.

**Extract.** Deterministic feature extractors across stylometry, timing, network structure, visuals, metadata leakage, cross-platform links, and account metadata. Pairwise and account-level views.

**Reason.** Triage on Haiku, attribution reasoning on Opus, both via Cloudflare AI Gateway. BYOK supported: API keys are not stored server-side. Reasoning must cite extracted features; the system declines rather than guesses when evidence is thin.

**Export.** Evidence packets as JSON, Markdown, or PDF (when the PDF container is configured).

Ingest can run through Apify upload jobs (Twitter, Reddit, Instagram scrapers) with feature inspection before attribution runs.

## Stack

- Cloudflare Workers backend API + separate web UI Worker (service binding)
- MySQL via Hyperdrive, R2 for artifacts
- Optional Workers VPC containers for Apify JSON ingest and PDF export
- TypeScript, Wrangler, Vitest with the Workers pool

Public UI: [common-thread.skyphusion.org](https://common-thread.skyphusion.org). API: [common-thread-backend.skyphusion.org](https://common-thread-backend.skyphusion.org). Contact the team before leaning on the hosted API in your own project.

v1 is in active stabilization. The paper is the authority; code cites paper sections.

## Update, July 2026: stabilization in practice

The two weeks since this post went up were spent making v1 trustworthy rather than bigger, and reconciling the two halves of the project so they cannot drift:

- **Paper and code reconciled.** The paper's taxonomy now matches the implementation's terminology and the v1 signal set exactly. When the code cites a paper section, the section says what the code does.
- **New extractors, and a correctness fix on an old one.** Support landed for Apify Reddit activity/profile and Instagram profile scrapes (shipped, reverted for a defect, then reworked and re-landed properly). A subtler fix replaced substring URL platform checks with parsed-host matching, so a post that merely mentions another platform's domain can no longer be misclassified.
- **API behavior hardened.** The Workers now return generic 500s (no internal detail leakage) and a clean 400 on malformed JSON bodies, and the web UI's proxy constrains backend overrides and credential forwarding.
- **CI got serious.** The hybrid DB-backed suites now run in CI, a twitter-scrapes suite runs against a synthetic corpus (no real accounts in the fixtures), and unified coverage reporting is wired across the project. For a tool whose output may end up attached to a legal filing, "the tests actually run against a database" is not optional.

The dual-license split (CC-BY-4.0 paper, AGPL-3.0 implementation) is now asserted in a NOTICE file as well.

Code: [github.com/skyphusion-labs/common-thread](https://github.com/skyphusion-labs/common-thread).
