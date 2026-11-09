# Loop Engineering Specification

This repository implements a formal **Loop Engineering** operational framework for autonomous agent cycles, continuous verification, and regression prevention.

---

## 1. Loop Topology

```
[ 1. Discovery & Triage ] ──> [ 2. Bounded Assignment ] ──> [ 3. Maker (Minimal Fix) ]
                                                                       │
[ 5. State & Release ]   <── [ 4. Checker (Verifier) ]  <──────────────┘
```

### Stage 1: Discovery & Triage
- Automated detection of test regressions, build failures, accessibility/visual bugs, and dependency security alerts.

### Stage 2: Bounded Work Assignment
- Scope is strictly constrained to specific components.
- Zero unrelated refactoring or cosmetic churn allowed.

### Stage 3: Execution (Maker)
- Implements minimal atomic changes adhering to established EGM contracts.
- Complies with local styles, CSP constraints, and architecture invariants.

### Stage 4: Verification (Checker)
- Independent verifier operates with default stance of `REJECT`.
- Complete Playwright test execution (`npx playwright test`) validating:
  - Functional flows (recording modes, audio mixer, canvas tools, timer).
  - Visual contracts (theme switch transitions, modal states).
  - Security invariants (CSP compliance, absence of secrets).

### Stage 5: State & Reporting
- Updates `STATE.md` with execution trace, test results, and release provenance.

---

## 2. Verification Scoring Metrics
- **Test Pass Rate**: 100% required (76/76 passing tests).
- **Security Check**: TruffleHog secrets scan = 0 findings; CSP enabled.
- **Binary Integrity**: Both NSIS Setup and Portable binaries built and hashed.

