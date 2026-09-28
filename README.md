# devmachine docs

The documentation site for the [devmachine CLI](https://github.com/mydevmachine/devmachine),
served from GitHub Pages at <https://mydevmachine.sh/>.

## What this is

An Astro + Tailwind CSS site with Pagefind search. It renders the CLI's
documentation; it never keeps its own copy. The source of truth for every doc
page stays in `mydevmachine/devmachine`'s `docs/` directory.

## How content is fetched

`scripts/fetch-docs.mjs` copies Markdown from a devmachine CLI checkout into
`src/content/docs/` (gitignored, rebuilt on every `dev` or `build`). It:

- reads from `$DEVMACHINE_CLI_DOCS` (default `../devmachine-cli/docs`);
- rewrites relative `.md` links, anchors included, to site URLs at the site root;
- drops `development.md` and `releasing.md` (maintainer pages) and points a
  "Contributing" link at GitHub instead;
- reads each page's first `# Heading` as its title;
- derives sidebar order from `docs/index.md`'s link order, grouped into
  Getting started, Concepts, How it works, Reference, Troubleshooting.

A new page in the CLI's `docs/` shows up here without any change to this
repository.

## Run locally

Needs a checkout of `mydevmachine/devmachine` next to this repository (or set
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
and every 6 hours. It checks out this repository and `mydevmachine/devmachine`,
builds against the CLI's live docs, and deploys to GitHub Pages. Because the
schedule pulls fresh docs on its own, a doc change in the CLI repository
reaches the site within six hours without touching this one — or immediately,
by triggering `workflow_dispatch`.

## llms.txt

`/llms.txt` and `/llms-full.txt` are generated at build time from the same
content collection: a link index with one-line summaries, and every page's
full Markdown concatenated in sidebar order. `llms.txt` links point at each
page's raw-Markdown URL (see below).

## Every page as Markdown

Each doc page is also served as raw Markdown at its URL plus `.md` (for
example `/getting-started.md`), generated at build time by
`src/pages/[...slug].md.ts` from the same content collection as the HTML
page. Its links are rewritten to absolute `https://mydevmachine.sh/...`
URLs, so a coding agent that fetches one page can follow links to the rest
without knowing the site's base path. Every HTML page links to its Markdown
twin with `<link rel="alternate" type="text/markdown">`, and
`scripts/check-links.mjs` verifies each one exists in the build.
