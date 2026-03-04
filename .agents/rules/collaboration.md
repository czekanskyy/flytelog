---
trigger: always_on
---

# AI Agent Rules: Git Workflow & Collaboration (2-Person Team)

You are assisting in a Next.js project developed by a 2-person team. Strict Git discipline is required to avoid merge conflicts.

1. THE "MAIN" BRANCH IS SACRED
- NEVER suggest running `git commit` or `git push` directly to the `main` branch.
- If the current branch is `main`, immediately instruct the user to create a new feature branch before generating or modifying any code.

2. FEATURE BRANCH ISOLATION
- Always use the naming convention: `feature/short-description` or `fix/short-description`.
- STAY IN SCOPE: Only modify files directly related to the specific feature requested by the user. Do not "refactor" or "fix" unrelated files across the project, as the second developer might be working on them.

3. CONTEXT AWARENESS (PRISMA & DB)
- Before generating code that interacts with the database, explicitly ask the user to provide the latest `schema.prisma` file from the `main` branch to ensure you have the correct data relationships.
- Do not invent database columns that do not exist in the provided schema.

4. ATOMIC COMMITS & PULL REQUESTS
- Suggest small, atomic commits. When a specific functional block is complete, provide a git command with a clear, conventional commit message (e.g., `git commit -m "feat(logbook): add BLIK payment modal"`).
- When a feature is complete, remind the user to push the branch and open a Pull Request (PR) for the other developer to review.

5. AVOID BLIND OVERWRITES
- Do not rewrite entire large files if only a few lines need to change. Provide targeted modifications or clearly indicate where the new code should be inserted.