# devmachine docs

The documentation site for the [devmachine CLI](https://github.com/adevmachine/cli),
served from GitHub Pages at <https://adevmachine.github.io/docs/>.

## What this is

An Astro + Tailwind CSS site with Pagefind search. It renders the CLI's
documentation; it never keeps its own copy. The source of truth for every doc
page stays in `adevmachine/cli`'s `docs/` directory.

## How content is fetched

`scripts/fetch-docs.mjs` copies Markdown from a devmachine CLI checkout into
`src/content/docs/` (gitignored, rebuilt on every `dev` or `build`). It:

- reads from `$DEVMACHINE_CLI_DOCS` (default `../devmachine-cli/docs`);
- rewrites relative `.md` links, anchors included, to site URLs under `/docs`;
- drops `development.md` and `releasing.md` (maintainer pages) and points a
  "Contributing" link at GitHub instead;
- reads each page's first `# Heading` as its title;
- derives sidebar order from `docs/index.md`'s link order, grouped into
  Getting started, Concepts, How it works, Reference, Troubleshooting.

A new page in the CLI's `docs/` shows up here without any change to this
repository.

## Run locally

Needs a checkout of `adevmachine/cli` next to this repository (or set
`DEVMACHINE_CLI_DOCS` to point at its `docs/` directory).

```
npm install
npm run dev
```

`npm run dev` fetches the docs, then starts the Astro dev server. Search does
not work in dev — Pagefind only indexes a production build.

## Build

```
npm run build
```

Fetches the docs, builds the static site into `dist/`, then indexes it with
Pagefind (`postbuild`). Check internal links with:

```
node scripts/check-links.mjs
```

## Deploy

`.github/workflows/deploy.yml` runs on push to `main`, on `workflow_dispatch`,
and every 6 hours. It checks out this repository and `adevmachine/cli`,
builds against the CLI's live docs, and deploys to GitHub Pages. Because the
schedule pulls fresh docs on its own, a doc change in the CLI repository
reaches the site within six hours without touching this one — or immediately,
by triggering `workflow_dispatch`.

## llms.txt

`/llms.txt` and `/llms-full.txt` are generated at build time from the same
content collection: a link index with one-line summaries, and every page's
full Markdown concatenated in sidebar order.
