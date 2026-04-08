# TODOS

## Pattern representation format for algorithm lookup

**What:** Design how each coaching case is represented in `stages.json`. What does a pattern look like? Options: wildcards on specific cubie positions in cubing.js notation, function-based matcher per case, or a DSL-style descriptor.

**Why:** Without this, the ~55-case lookup table can't be built. Every coaching card depends on it. It's the data model for the core engine.

**Pros:** Getting this right means adding new cases later is trivial (just add a row to JSON). Getting it wrong means rewriting the coaching engine.

**Cons:** 30-60 minutes of design time upfront. Not needed on day 1 if you start with manual cube input — coaching engine can start with hardcoded cases before the format is finalized.

**Context:** Decided in /plan-eng-review 2026-04-06. Review chose pattern-match + lookup table (not cubing.js solver). Pattern format is the one unresolved implementation detail. Start here before building `stageAlgorithms.ts`.

**Depends on:** cubing.js spike (verify state representation API first, then design patterns around it).
