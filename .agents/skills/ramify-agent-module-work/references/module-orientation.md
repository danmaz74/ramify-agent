# Ramify module orientation

Paths below are relative to a module root:

```text
module.ramify          module declaration and exposures
README.md              module purpose and documentation, when present
src/                   this owner's implementation; focused agent CWD
  interfaces/          optional same-owner contract files
  tests/               same-owner tests, with a separate API view
    .ramify/           generated APIs available to testing source
  .ramify/             generated APIs available to ordinary source
subs/                  child modules, each with its own layout
```

`subs/` is beside `src/`, so a search from a focused `src/` working directory stays in the owner's source rather than descending into child implementations. From `src/`, the module definition is `../module.ramify` and children are beneath `../subs/`.

`module.ramify` declares the module and what it exposes to its parent or descendants. `expose-src` selects owned exports relative to `src/`; `expose-test` selects exports relative to `src/tests/`; `expose-sub` re-exposes symbols received from a direct child. TypeScript exports alone do not establish cross-module availability. See the [module layout and declaration specification](https://github.com/danmaz74/ramify/blob/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5/docs/model/module-description.spec.md) when changing declarations.

From a module's `src/` CWD, search `.ramify/` for ordinary cross-module APIs, or `tests/.ramify/` for testing APIs. Each view is self-contained: `children/` contains APIs owned by descendants; `external/` contains those owned elsewhere in the project, not npm packages. Pass these hidden paths explicitly to `rg`, for example `rg -n -i -C 4 'parser' .ramify/`. Read `_meta.json` for revision and coverage limits. Search the testing view separately; do not use test-only availability in production code.

These catalogs are generated documentation, never source to edit or import. Import the actual defining source using the project's resolution conventions. If a view is absent or stale, refresh with the installed toolkit from the project root: `node_modules/.bin/ramify materialize --view api --from <module-path>/src`. Failed refreshes and incomplete coverage remain limitations, not proof that an API is absent. For details, read the [API-view specification](https://github.com/danmaz74/ramify/blob/1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5/docs/architecture/materialized-api-view.spec.md). Project-wide discovery uses `.ramify-architect/` at the project root; it does not establish requester-specific importability.
