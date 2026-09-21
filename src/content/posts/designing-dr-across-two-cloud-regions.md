---
title: "Designing DR across two cloud regions"
description: "Sample post — replace with real writing. What a two-region disaster recovery design actually has to survive."
date: 2026-09-14
topic: infrastructure
draft: true
---

> **This is a sample post.** It exists so the layout has content while the site
> is being built. It is marked `draft: true`, so it renders in `npm run dev`
> but is excluded from production builds. Delete it when real writing lands.

Every DR design starts with the same uncomfortable question: which region is
allowed to be a smoking crater, and for how long?

## Placeholder structure

Long-form typography lives here. Body text runs around 72 characters per line,
with generous leading for late-night reading. **Bold** carries emphasis,
[links](https://vnick.io) sit on a green underline, and `inline code` gets a
graphite chip.

- Recovery point objective before recovery time objective
- Replication topology, and who owns the failover decision
- The runbook nobody tests until the bad day

```powershell
# Code blocks get a bordered graphite panel with horizontal scroll
Get-ClusterGroup -Name "SQL-PROD" | Move-ClusterGroup -Node "DR-NODE-01"
```

## What broke along the way

A second heading, so the post page shows the full heading scale. That's all a
sample needs to do.
