# Commit Message Rules

Use [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) for every commit.

## Required subject format

```text
<type>[optional scope][!]: <short description>
```

- Start with a type, followed by a colon and one space.
- Use a short, specific description immediately after the prefix.
- Use a scope only when it clearly identifies the affected area; it must be a noun in parentheses, such as `fix(auth):`.
- Split unrelated changes into separate commits whenever practical.

## Types

- `feat`: adds a user-facing feature.
- `fix`: fixes a bug.
- `docs`: documentation only.
- `refactor`: restructures code without changing intended behavior.
- `test`: adds or changes tests.
- `perf`: improves performance.
- `build`: changes build tooling or dependencies.
- `ci`: changes continuous-integration configuration.
- `chore`: maintenance work that does not fit another type.
- `style`: formatting-only changes with no behavior change.
- `revert`: reverts a prior change; include a `Refs:` footer with the reverted commit SHA(s).

Use lowercase types consistently.

## Breaking changes

Mark any incompatible API or behavior change in one of these ways:

```text
feat!: remove legacy configuration
```

```text
feat(config): replace legacy configuration

BREAKING CHANGE: The `legacyConfig` option is no longer supported.
```

- Place `!` immediately before the colon.
- When using a footer, write `BREAKING CHANGE:` in uppercase followed by a description.

## Optional body and footers

Add a body when the subject alone does not explain the why or important implementation context. Start it one blank line after the subject.

Add footers one blank line after the body. Use trailer-style tokens such as:

```text
Reviewed-by: Name
Refs: #123
```

Footer tokens use hyphens instead of spaces, except `BREAKING CHANGE` (or `BREAKING-CHANGE`).

## Examples

```text
feat(search): add saved filters
fix(api): prevent duplicate request retries
docs: clarify local setup instructions
refactor(parser): simplify token handling
feat(api)!: remove v1 endpoints
```
