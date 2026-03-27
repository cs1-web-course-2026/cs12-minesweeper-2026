---
name: pr-comment-followup
description: Follows up on existing review comments for one or more pull requests. Uses two AI classifier sub-agents (Claude Sonnet 4.6 and GPT-5.3-Codex) to independently classify each review thread, merges their verdicts with conservative tie-breaking, then acts — replies and resolves if fixed; unresolves and requests action if not fixed but already resolved; reacts with 👎 and resolves with explanation if the comment is no longer applicable. Use this skill when asked to follow up on PR comments, check if review comments were addressed, or triage review threads.
---

Follow up on review comment threads for the pull requests listed below. Use two classifier sub-agents — one running Claude Sonnet 4.6 and one running GPT-5.3-Codex — to independently classify each thread, merge their verdicts with conservative tie-breaking, then take the appropriate action on each thread.

## Important constraints

- **Do NOT use `gh pr checkout` or `git checkout`.** All PR data is fetched via the GitHub API only.
- **Do NOT create any files** in the repository.
- **Do NOT use any persistent todo store.** Track progress in memory only.
- **Do NOT stash or modify the working tree.**

## Input

You will receive a list of PR numbers. Examples:

- `Follow up on PR 5`
- `Check review comments on PRs 3, 7 and 12`
- `Triage review threads for pull requests 1, 2, 3`

Parse all PR numbers from the user's message. Process each PR **sequentially**.

## One-time setup (run once before processing any PRs)

Discover `owner` and `repo`:

```bash
git remote get-url origin
```

Fetch latest refs:

```bash
git fetch origin
```

## Process per PR

> **Strict sequencing rule:** Complete every step for the current PR before moving to the next.

### Step 1 — Fetch PR metadata, diff, and review threads

Run in parallel:

```bash
gh api /repos/{owner}/{repo}/pulls/{pr_number}
gh api /repos/{owner}/{repo}/pulls/{pr_number} --header "Accept: application/vnd.github.v3.diff"
```

Then fetch all review threads via GraphQL:

```bash
gh api graphql -f query='
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            comments(first: 20) {
              nodes {
                databaseId
                body
                path
                line
                author { login }
                createdAt
              }
            }
          }
        }
      }
    }
  }
' -f owner="{owner}" -f repo="{repo}" -F number={pr_number}
```

Record: `head_sha`, unified diff text, and the full list of review threads (each with its GraphQL `id`, `isResolved` flag, and all comment bodies).

Discard threads that have zero comments. If there are no review threads, skip to the final report for this PR.

### Step 2 — Run Claude Sonnet 4.6 classifier sub-agent

**Wait for Step 1 to finish.**

Invoke the `pr-comment-classifier-claude` sub-agent, passing:
- PR number
- The full unified diff text
- The list of review threads (thread `id`, `isResolved`, all comment bodies, `path`, `line`)
- `owner` and `repo`

**Wait for the sub-agent to return its full JSON response before proceeding to Step 3.**

### Step 3 — Run GPT-5.3-Codex classifier sub-agent

**Wait for Step 2 to finish.**

Invoke the `pr-comment-classifier-codex` sub-agent with the same inputs.

**Wait for the sub-agent to return its full JSON response before proceeding to Step 4.**

### Step 4 — Merge verdicts with conservative tie-breaking

For each thread, combine the two verdicts using this priority order (most conservative wins):

| Claude verdict | Codex verdict | Merged verdict |
|---|---|---|
| `FIXED` | `FIXED` | `FIXED` |
| `NOT_APPLICABLE` | `NOT_APPLICABLE` | `NOT_APPLICABLE` |
| `FIXED` | `NOT_APPLICABLE` | `NOT_APPLICABLE` |
| anything | `NOT_FIXED` | `NOT_FIXED` |
| `NOT_FIXED` | anything | `NOT_FIXED` |

Rule: `NOT_FIXED` beats everything; `NOT_APPLICABLE` beats `FIXED`; `FIXED` only when both agree.

### Step 5 — Act on each thread

For each thread, take exactly one action based on the merged verdict:

#### Merged verdict: `FIXED`

Post a reply on the thread's first comment, then resolve the thread.

**Reply body:**
```
✅ **[AI Generated] Addressed** — The concern raised in this comment appears to have been resolved in the latest changes. Resolving this thread.
```

Resolve via GraphQL:
```bash
gh api graphql -f query='
  mutation($threadId: ID!) {
    resolveReviewThread(input: { threadId: $threadId }) {
      thread { id isResolved }
    }
  }
' -f threadId="{thread.id}"
```

Post reply via REST:
```bash
gh api \
  --method POST \
  /repos/{owner}/{repo}/pulls/{pr_number}/comments/{first_comment_database_id}/replies \
  -f body="✅ **[AI Generated] Addressed** — The concern raised in this comment appears to have been resolved in the latest changes. Resolving this thread."
```

#### Merged verdict: `NOT_FIXED`

If the thread is **already resolved** (`isResolved: true`): unresolve it first, then post a reply requesting action.

Unresolve via GraphQL:
```bash
gh api graphql -f query='
  mutation($threadId: ID!) {
    unresolveReviewThread(input: { threadId: $threadId }) {
      thread { id isResolved }
    }
  }
' -f threadId="{thread.id}"
```

If the thread is **not resolved**: post a reply only (no resolve/unresolve).

**Reply body:**
```
🔁 **[AI Generated] Still open** — This concern does not appear to have been addressed yet. Please revisit the original comment and update the code accordingly before requesting re-review.
```

#### Merged verdict: `NOT_APPLICABLE`

Add a 👎 reaction to the first comment of the thread, then post a reply and resolve the thread.

Add reaction:
```bash
gh api \
  --method POST \
  /repos/{owner}/{repo}/pulls/comments/{first_comment_database_id}/reactions \
  -f content="-1"
```

**Reply body:**
```
👎 **[AI Generated] No longer applicable** — This comment refers to code or context that no longer exists in the current state of the PR. Resolving this thread as not applicable.
```

Resolve via GraphQL (same mutation as `FIXED`).

### Step 6 — Verify

After acting on all threads, re-fetch the thread list via GraphQL and confirm:
- `FIXED` threads are now `isResolved: true`
- `NOT_APPLICABLE` threads are now `isResolved: true`
- `NOT_FIXED` threads that were resolved before are now `isResolved: false`

## Final report

After all PRs have been processed, report:

- PR number and title
- Total threads processed
- Count per verdict: `FIXED` / `NOT_FIXED` / `NOT_APPLICABLE`
- For each thread: brief excerpt of the original comment, verdict, and action taken
