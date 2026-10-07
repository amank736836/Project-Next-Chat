# Project Harness — Stealthy Note (Chat Next Frontend)

## What Is This?

This `harness/` folder is the single organized source of truth for understanding, testing, and maintaining the **Stealthy Note** project. It contains project documentation, feature inventories, test scenarios, test cases, automation scripts, test data, test results, evidence, bug tracking, and AI testing instructions.

## How Is It Organized?

```
harness/
├── README.md                  ← You are here
├── PROJECT_OVERVIEW.md        ← What the project does, tech stack, architecture
├── ARCHITECTURE.md            ← System architecture, data flow, deployment
├── TESTING_STRATEGY.md        ← Overall testing approach
├── TESTING_STATUS.md          ← Current testing status and gaps
│
├── requirements/              ← Functional & non-functional requirements
│   ├── functional-requirements.md
│   ├── non-functional-requirements.md
│   └── business-rules.md
│
├── features/                  ← Feature-by-feature documentation
│   ├── README.md              ← Feature inventory with IDs
│   ├── authentication/        ← Auth feature docs + tests
│   ├── chat/                  ← Chat feature docs + tests
│   ├── groups/                ← Group chat docs + tests
│   ├── ai/                    ← AI features docs + tests
│   ├── admin/                 ← Admin dashboard docs + tests
│   ├── board/                 ← Board/Q&A docs + tests
│   ├── widget/                ← Embed widget docs + tests
│   ├── question-pool/         ← Question pool system docs
│   ├── showcase/              ← Showcase feature docs
│   ├── embed/                 ← Embed page docs
│   └── profile/               ← Profile feature docs
│
├── test-scenarios/            ← Scenario-level test plans
│   ├── smoke.md
│   ├── regression.md
│   ├── functional.md
│   ├── negative.md
│   ├── edge-cases.md
│   ├── integration.md
│   ├── api.md
│   ├── database.md
│   ├── ui.md
│   ├── performance.md
│   └── security.md
│
├── test-cases/                ← Detailed test cases by module
│   ├── authentication/
│   ├── chat/
│   ├── groups/
│   ├── ai/
│   ├── admin/
│   ├── board/
│   ├── widget/
│   └── question-pool/
│
├── test-tools/                ← Testing tool documentation
│   └── setup.md
│
├── automation/                ← Automated test scripts
│   ├── scripts/
│   └── utilities/
│
├── test-data/                 ← Reusable test data
│   ├── fixtures/
│   ├── valid/
│   ├── invalid/
│   └── edge-cases/
│
├── test-results/              ← Execution results
│   ├── latest/
│   └── historical/
│
├── evidence/                  ← Test evidence (screenshots, logs, responses)
│   ├── screenshots/
│   ├── logs/
│   └── api-responses/
│
├── bugs/                      ← Bug tracking
│   ├── open/
│   ├── resolved/
│   └── known-issues.md
│
├── reports/                   ← Summary reports
│   ├── test-summary.md
│   ├── coverage.md
│   ├── traceability.md
│   ├── regression-report.md
│   └── release-readiness.md
│
└── ai/                        ← AI agent instructions
    ├── test-agent-instructions.md
    ├── test-prompts.md
    └── test-generation-rules.md
```

## Quick Start

### For Developers

1. Read `PROJECT_OVERVIEW.md` to understand what the app does.
2. Read `ARCHITECTURE.md` for system design.
3. Check `features/README.md` for the feature inventory.

### For Testers

1. Read `TESTING_STRATEGY.md` for the testing approach.
2. Read `TESTING_STATUS.md` for current status.
3. Browse `test-scenarios/` for scenario plans.
4. Browse `test-cases/` for detailed test cases.
5. Run tests using commands in `test-tools/setup.md`.
6. Record results in `test-results/latest/`.

### For AI Agents

1. Read `ai/test-agent-instructions.md` for complete instructions.
2. Read `PROJECT_OVERVIEW.md` and `ARCHITECTURE.md` for context.
3. Follow the Analyze → Plan → Test → Record → Verify → Report cycle.

## Where Is Everything?

| What | Where |
|------|-------|
| Feature documentation | `features/<feature-name>/` |
| Test scenarios | `test-scenarios/` |
| Test cases | `test-cases/<module>/` |
| Automated tests | `automation/` and project `__tests__/` directories |
| Test data | `test-data/` |
| Test results | `test-results/latest/` |
| Evidence | `evidence/` |
| Bugs | `bugs/open/` and `bugs/resolved/` |
| Coverage reports | `reports/coverage.md` |
| AI instructions | `ai/` |

## How Do I Add a New Feature?

1. Create a new folder under `features/<feature-name>/`.
2. Document requirements, behavior, acceptance criteria.
3. Add test scenarios in `test-scenarios/`.
4. Add test cases in `test-cases/<feature-name>/`.
5. Update `reports/coverage.md`.

## How Do I Add a New Test?

1. Write the test case in `test-cases/<module>/`.
2. If automatable, add the script in `automation/`.
3. Link the test case to its requirement in `reports/traceability.md`.
4. Record the result in `test-results/latest/`.

## How Do I Record a Bug?

1. Create a file in `bugs/open/` using the format in `bugs/README.md`.
2. Assign a Bug ID (BUG-001, BUG-002, ...).
3. Link to the failing test case.
4. Update `reports/test-summary.md`.

## ID Conventions

- `REQ-xxx` — Requirements
- `FEAT-xxx` — Features
- `SCN-xxx` — Test Scenarios
- `TC-xxx` — Test Cases
- `BUG-xxx` — Bugs
- `RUN-xxx` — Test Runs