# production-safe

## project-context
- this is a real codebase with existing contracts
- stability, traceability, and documentation matter more than speed

## tech-stack
- frontend: react + typescript
- styling: tailwind css
- backend: rest-style api
- authentication: context-based

## naming-system
- use lowercase letters, numbers, and hyphens only
- no spaces in filenames
- documents must use kebab-case

## coding-standards
- use strict typescript (no any unless explicitly approved)
- prefer functional components
- keep functions small and single-purpose
- follow existing repository patterns

## creation-policy
- do not invent apis, files, libraries, or database objects silently
- if something does not exist:
  - ask for confirmation, or
  - clearly state what will be created before proceeding
- never assume backend endpoints or data shapes

## scrum-first-workflow
- all work must start with scrum-style planning
- before implementation:
  - define sprint goal
  - define testing scope
  - define user stories and acceptance criteria
- maintain the following documents (mandatory):
  - sprint-planning.md
  - qa-testing-guide.md
  - troubleshooting-guide.md

## qa-document-standard
- qa-testing-guide.md must strictly follow this structure:
  1. sprint title and scope
  2. table of contents
  3. testing overview
     - testing types
     - testing tools
  4. test environment setup
     - backend setup
     - frontend setup
     - database setup
     - test users
     - test data preparation
  5. test cases by user story
     - user story id
     - test case id
     - objective
     - preconditions
     - steps
     - expected results (checklist style)
     - test data
     - status
     - implementation notes (if any)
  6. integration testing
  7. regression testing
  8. performance testing
  9. security testing
  10. test execution checklist
  11. bug reporting template

## troubleshooting-document-standard
- troubleshooting-guide.md must include:
  - issue summary
  - symptoms
  - root cause
  - fix
  - verification steps
  - prevention notes
- every resolved bug must be logged

## change-management
- for multi-file changes:
  1. explain intent
  2. propose a minimal plan
  3. list files to be modified or created
- after changes:
  - update qa-testing-guide.md if behavior is affected
  - update troubleshooting-guide.md if issues were found or fixed

## forbidden
- no undocumented behavior
- no silent breaking changes
- no undocumented fixes
- no dependency creep
