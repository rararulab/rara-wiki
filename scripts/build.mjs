import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";

const root = process.cwd();
const distDir = path.join(root, "dist");
const assetDir = path.join(root, "site");
const markdownRoots = ["wiki", "raw", "schema"];
const basePath = normalizeBasePath(process.env.BASE_PATH || "");
let runtimePageMap = new Map();

const md = new MarkdownIt({
  html: true,
  linkify: false,
  typographer: true
}).use(markdownItAnchor, {
  slugify: slugify,
  permalink: markdownItAnchor.permalink.headerLink()
});

const defaultLinkOpen =
  md.renderer.rules.link_open ??
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet("href") || "";
  const resolved = rewriteStandardLink(href, env.page);
  if (resolved) {
    tokens[idx].attrSet("href", resolved);
  }

  const finalHref = tokens[idx].attrGet("href") || "";
  if (/^https?:\/\//.test(finalHref)) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noreferrer");
  }

  return defaultLinkOpen(tokens, idx, options, env, self);
};

await buildSite();

async function buildSite() {
  const markdownFiles = await collectMarkdownFiles();
  const pages = await Promise.all(markdownFiles.map(loadPage));
  const basenameCounts = countBasenames(pages);
  const pageMap = new Map();

  for (const page of pages) {
    page.aliases = [page.key];
    if (basenameCounts.get(page.basenameKey) === 1) {
      page.aliases.push(page.basenameKey);
    }
    for (const alias of page.aliases) {
      pageMap.set(alias, page);
    }
  }

  runtimePageMap = pageMap;

  for (const page of pages) {
    page.outgoing = collectWikilinks(page.body).map((link) => {
      const target = resolvePage(link.target, page, pageMap);
      return {
        label: link.label,
        rawTarget: link.target,
        target
      };
    });
  }

  for (const page of pages) {
    page.backlinks = [];
  }

  for (const page of pages) {
    for (const link of page.outgoing) {
      if (link.target) {
        link.target.backlinks.push(page);
      }
    }
  }

  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });
  await copyAssets();

  const logPage = pageMap.get("wiki/log");
  const logEntries = parseLogEntries(logPage?.body || "");
  const wikiPages = pages
    .filter((page) => page.area === "wiki")
    .sort(sortPagesByDate);
  const tagMap = buildTagMap(pages);
  const searchIndex = buildSearchIndex(pages);

  await fs.writeFile(
    path.join(distDir, "assets", "search-index.json"),
    `${JSON.stringify(searchIndex, null, 2)}\n`,
    "utf8"
  );

  const siteContext = {
    basePath,
    pages,
    tagMap,
    wikiPages,
    logEntries
  };

  for (const page of pages) {
    const html = renderMarkdownPage(page, siteContext, pageMap);
    await writeOutput(page.outputFile, html);
  }

  await writeOutput(
    path.join(distDir, "wiki", "index.html"),
    renderCollectionPage("Wiki", "Knowledge pages, concepts, syntheses, and log entries.", wikiPages, siteContext)
  );
  await writeOutput(
    path.join(distDir, "raw", "index.html"),
    renderCollectionPage(
      "Raw Sources",
      "Source material preserved in the repository before it is compiled into the wiki.",
      pages.filter((page) => page.area === "raw").sort(sortPagesByDate),
      siteContext
    )
  );
  await writeOutput(
    path.join(distDir, "schema", "index.html"),
    renderCollectionPage(
      "Schema",
      "Operating conventions, workflows, and structure definitions for the wiki.",
      pages.filter((page) => page.area === "schema").sort(sortPagesByDate),
      siteContext
    )
  );
  await writeOutput(
    path.join(distDir, "tags", "index.html"),
    renderTagsIndexPage(siteContext)
  );

  for (const [tag, taggedPages] of tagMap.entries()) {
    await writeOutput(
      path.join(distDir, "tags", slugify(tag), "index.html"),
      renderTagPage(tag, taggedPages, siteContext)
    );
  }

  await writeOutput(
    path.join(distDir, "404.html"),
    renderShell({
      title: "Not Found",
      description: "The page you requested does not exist in Rara Wiki.",
      currentNav: "",
      content: `
        <section class="hero">
          <p class="eyebrow">404</p>
          <h1>Page not found</h1>
          <p class="hero-copy">The site built correctly, but this route does not map to a markdown page yet.</p>
          <div class="hero-actions">
            <a class="button" href="${withBasePath("/")}">Back to home</a>
            <a class="button ghost" href="${withBasePath("/wiki/")}">Browse wiki pages</a>
          </div>
        </section>
      `,
      rail: renderSidebar(siteContext, "")
    })
  );
}

async function collectMarkdownFiles() {
  const files = ["README.md"];
  for (const dir of markdownRoots) {
    const dirPath = path.join(root, dir);
    try {
      files.push(...(await walkMarkdown(dirPath)));
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }
  return files.map((file) => path.relative(root, file));
}

async function walkMarkdown(dir) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkMarkdown(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

async function loadPage(relativeFile) {
  const fullPath = path.join(root, relativeFile);
  const raw = await fs.readFile(fullPath, "utf8");
  const parsed = matter(raw);
  const key = normalizeKey(relativeFile.replace(/\.md$/i, ""));
  const area = relativeFile === "README.md" ? "home" : relativeFile.split(path.sep)[0];
  const basenameKey = path.posix.basename(key);
  const title = parsed.data.title || extractTitle(parsed.content) || humanizeTitle(basenameKey);
  const description = summarize(parsed.content);
  const date = parsed.data.date
    ? parsed.data.date instanceof Date
      ? parsed.data.date.toISOString().slice(0, 10)
      : String(parsed.data.date)
    : null;
  const tags = normalizeList(parsed.data.tags);
  const sources = normalizeList(parsed.data.sources);
  const status = parsed.data.status ? String(parsed.data.status) : null;
  const outputFile =
    relativeFile === "README.md"
      ? path.join(distDir, "index.html")
      : path.join(distDir, relativeFile.replace(/\.md$/i, ""), "index.html");

  return {
    area,
    basenameKey,
    body: parsed.content.trim(),
    date,
    description,
    file: relativeFile,
    key,
    outputFile,
    status,
    sources,
    tags,
    title,
    type: derivePageType(area, tags, key)
  };
}

function countBasenames(pages) {
  const counts = new Map();
  for (const page of pages) {
    counts.set(page.basenameKey, (counts.get(page.basenameKey) || 0) + 1);
  }
  return counts;
}

function collectWikilinks(markdown) {
  const links = [];
  const regex = /\[\[([^[\]]+?)\]\]/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const [target, label] = match[1].split("|");
    links.push({
      target: target.trim(),
      label: (label || target).trim()
    });
  }
  return links;
}

function resolvePage(rawTarget, currentPage, pageMap) {
  const target = normalizeKey(rawTarget);
  const candidates = new Set([target]);

  if (!target.includes("/")) {
    if (currentPage.area !== "home") {
      candidates.add(normalizeKey(`${currentPage.area}/${target}`));
    }
    candidates.add(normalizeKey(`wiki/${target}`));
    candidates.add(normalizeKey(`raw/${target}`));
    candidates.add(normalizeKey(`schema/${target}`));
  }

  for (const candidate of candidates) {
    if (pageMap.has(candidate)) {
      return pageMap.get(candidate);
    }
  }

  return null;
}

function renderMarkdownPage(page, siteContext, pageMap) {
  const markdown = injectWikilinks(page.body, page, pageMap);
  const contentHtml = md.render(markdown, { page });
  const heroMeta = renderHeroMeta(page);
  const rail = renderPageRail(page);
  const introPanels = page.area === "home" ? renderHomePanels(siteContext) : "";
  const collections =
    page.area === "home"
      ? renderCollectionHighlights(siteContext)
      : "";
  const sources = renderSourceLinks(page, pageMap);

  return renderShell({
    title: page.title,
    description: page.description,
    currentNav: page.area,
    content: `
      <section class="hero">
        <p class="eyebrow">${escapeHtml(page.type)}</p>
        <h1>${escapeHtml(page.title)}</h1>
        <p class="hero-copy">${escapeHtml(page.description || "Markdown-native knowledge, compiled into a navigable wiki.")}</p>
        <div class="hero-meta">${heroMeta}</div>
      </section>
      ${introPanels}
      ${collections}
      <section class="page-frame">
        <article class="prose">
          ${contentHtml}
        </article>
        ${sources}
      </section>
    `,
    rail: renderSidebar(siteContext, page.area) + rail
  });
}

function renderCollectionPage(title, description, pages, siteContext) {
  return renderShell({
    title,
    description,
    currentNav: title.toLowerCase(),
    content: `
      <section class="hero">
        <p class="eyebrow">Collection</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="hero-copy">${escapeHtml(description)}</p>
      </section>
      <section class="collection-grid">
        ${renderPageCards(groupPages(pages))}
      </section>
    `,
    rail: renderSidebar(siteContext, title.toLowerCase())
  });
}

function renderTagsIndexPage(siteContext) {
  const tags = [...siteContext.tagMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return renderShell({
    title: "Tags",
    description: "Browse Rara Wiki by tag.",
    currentNav: "tags",
    content: `
      <section class="hero">
        <p class="eyebrow">Catalog</p>
        <h1>Tags</h1>
        <p class="hero-copy">A compact view into the concepts, domains, and workflows used across the wiki.</p>
      </section>
      <section class="tag-cloud">
        ${tags
          .map(
            ([tag, pages]) => `
              <a class="tag-pill" href="${withBasePath(`/tags/${slugify(tag)}/`)}">
                <span>${escapeHtml(tag)}</span>
                <strong>${pages.length}</strong>
              </a>
            `
          )
          .join("")}
      </section>
    `,
    rail: renderSidebar(siteContext, "tags")
  });
}

function renderTagPage(tag, pages, siteContext) {
  return renderShell({
    title: `Tag: ${tag}`,
    description: `Pages tagged ${tag}.`,
    currentNav: "tags",
    content: `
      <section class="hero">
        <p class="eyebrow">Tag</p>
        <h1>${escapeHtml(tag)}</h1>
        <p class="hero-copy">${pages.length} page${pages.length === 1 ? "" : "s"} carry this tag.</p>
      </section>
      <section class="collection-grid">
        ${renderFlatCards(pages)}
      </section>
    `,
    rail: renderSidebar(siteContext, "tags")
  });
}

function renderShell({ title, description, currentNav, content, rail }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)} | Rara Wiki</title>
    <meta name="description" content="${escapeHtml(description || "Rara's markdown-native wiki frontend")}">
    <link rel="stylesheet" href="${withBasePath("/assets/site.css")}">
    <script type="module" src="${withBasePath("/assets/site.js")}"></script>
  </head>
  <body data-base-path="${escapeHtml(basePath)}">
    <div class="canvas canvas-one"></div>
    <div class="canvas canvas-two"></div>
    <header class="site-header">
      <a class="brand" href="${withBasePath("/")}">
        <span class="brand-mark">RW</span>
        <span>
          <strong>Rara Wiki</strong>
          <small>Compiled knowledge, public surface</small>
        </span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        ${renderNavLink("Home", "/", currentNav === "home")}
        ${renderNavLink("Wiki", "/wiki/", currentNav.includes("wiki"))}
        ${renderNavLink("Raw", "/raw/", currentNav.includes("raw"))}
        ${renderNavLink("Schema", "/schema/", currentNav.includes("schema"))}
        ${renderNavLink("Tags", "/tags/", currentNav === "tags")}
      </nav>
      <div class="header-tools">
        <label class="search-field">
          <span>Search</span>
          <input id="search-input" type="search" placeholder="Find pages, tags, text">
        </label>
        <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Toggle theme">Theme</button>
      </div>
    </header>
    <main class="site-layout">
      <div class="content-column">
        ${content}
      </div>
      <aside class="rail-column">
        ${rail}
        <section id="search-results" class="panel search-results" hidden>
          <h2>Search results</h2>
          <div class="search-results-list"></div>
        </section>
      </aside>
    </main>
  </body>
</html>
`;
}

function renderNavLink(label, href, active) {
  return `<a ${active ? 'aria-current="page"' : ""} href="${withBasePath(href)}">${label}</a>`;
}

function renderSidebar(siteContext, currentNav) {
  const latestPages = siteContext.wikiPages.slice(0, 5);
  const topTags = [...siteContext.tagMap.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, 8);
  const logEntries = siteContext.logEntries.slice(0, 4);

  return `
    <section class="panel">
      <h2>Collections</h2>
      <ul class="list-plain">
        <li><a ${currentNav === "home" ? 'aria-current="page"' : ""} href="${withBasePath("/")}">Overview</a></li>
        <li><a href="${withBasePath("/wiki/")}">Wiki pages <strong>${siteContext.pages.filter((page) => page.area === "wiki").length}</strong></a></li>
        <li><a href="${withBasePath("/raw/")}">Raw sources <strong>${siteContext.pages.filter((page) => page.area === "raw").length}</strong></a></li>
        <li><a href="${withBasePath("/schema/")}">Schema docs <strong>${siteContext.pages.filter((page) => page.area === "schema").length}</strong></a></li>
        <li><a href="${withBasePath("/tags/")}">Tags <strong>${siteContext.tagMap.size}</strong></a></li>
      </ul>
    </section>
    <section class="panel">
      <h2>Latest updates</h2>
      <ul class="list-plain compact">
        ${logEntries
          .map(
            (entry) => `
              <li>
                <strong>${escapeHtml(entry.date)}</strong>
                <span>${escapeHtml(entry.title)}</span>
              </li>
            `
          )
          .join("")}
      </ul>
    </section>
    <section class="panel">
      <h2>Field tags</h2>
      <div class="tag-row">
        ${topTags
          .map(
            ([tag, pages]) => `
              <a class="tag-pill" href="${withBasePath(`/tags/${slugify(tag)}/`)}">
                <span>${escapeHtml(tag)}</span>
                <strong>${pages.length}</strong>
              </a>
            `
          )
          .join("")}
      </div>
    </section>
    <section class="panel">
      <h2>Recent pages</h2>
      <ul class="list-plain compact">
        ${latestPages
          .map(
            (page) => `
              <li>
                <a href="${pageUrl(page)}">${escapeHtml(page.title)}</a>
                <span>${escapeHtml(page.date || page.type)}</span>
              </li>
            `
          )
          .join("")}
      </ul>
    </section>
  `;
}

function renderPageRail(page) {
  const backlinks = page.backlinks
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(
      (source) => `
        <li>
          <a href="${pageUrl(source)}">${escapeHtml(source.title)}</a>
          <span>${escapeHtml(source.type)}</span>
        </li>
      `
    )
    .join("");

  return `
    <section class="panel">
      <h2>Page metadata</h2>
      <ul class="list-plain compact">
        <li><strong>Source</strong><span>${escapeHtml(page.file)}</span></li>
        <li><strong>Type</strong><span>${escapeHtml(page.type)}</span></li>
        ${page.date ? `<li><strong>Date</strong><span>${escapeHtml(page.date)}</span></li>` : ""}
        ${page.status ? `<li><strong>Status</strong><span>${escapeHtml(page.status)}</span></li>` : ""}
      </ul>
    </section>
    <section class="panel">
      <h2>Backlinks</h2>
      ${
        backlinks
          ? `<ul class="list-plain compact">${backlinks}</ul>`
          : '<p class="muted">No backlinks yet. This page has not been referenced from another wiki page.</p>'
      }
    </section>
  `;
}

function renderHeroMeta(page) {
  const parts = [];
  if (page.date) {
    parts.push(`<span>${escapeHtml(page.date)}</span>`);
  }
  if (page.status) {
    parts.push(`<span>${escapeHtml(page.status)}</span>`);
  }
  if (page.tags.length) {
    parts.push(
      page.tags
        .map((tag) => `<a href="${withBasePath(`/tags/${slugify(tag)}/`)}">${escapeHtml(tag)}</a>`)
        .join("")
    );
  }
  return parts.join("");
}

function renderHomePanels(siteContext) {
  const totalPages = siteContext.pages.length;
  const wikiPages = siteContext.pages.filter((page) => page.area === "wiki").length;
  const rawPages = siteContext.pages.filter((page) => page.area === "raw").length;
  const schemaPages = siteContext.pages.filter((page) => page.area === "schema").length;

  return `
    <section class="summary-grid">
      <article class="panel stat-card">
        <span>Total pages</span>
        <strong>${totalPages}</strong>
      </article>
      <article class="panel stat-card">
        <span>Wiki notes</span>
        <strong>${wikiPages}</strong>
      </article>
      <article class="panel stat-card">
        <span>Raw sources</span>
        <strong>${rawPages}</strong>
      </article>
      <article class="panel stat-card">
        <span>Schema docs</span>
        <strong>${schemaPages}</strong>
      </article>
    </section>
  `;
}

function renderCollectionHighlights(siteContext) {
  const conceptPages = siteContext.pages.filter((page) => page.type === "Concept").slice(0, 6);
  const schemaPages = siteContext.pages.filter((page) => page.area === "schema").slice(0, 4);
  return `
    <section class="split-panels">
      <article class="panel">
        <h2>Concept trail</h2>
        <div class="collection-grid compact-grid">
          ${renderFlatCards(conceptPages)}
        </div>
      </article>
      <article class="panel">
        <h2>Operating schema</h2>
        <div class="collection-grid compact-grid">
          ${renderFlatCards(schemaPages)}
        </div>
      </article>
    </section>
  `;
}

function renderPageCards(groups) {
  return groups
    .map(
      ([group, pages]) => `
        <section class="collection-section">
          <h2>${escapeHtml(group)}</h2>
          <div class="card-grid">
            ${renderFlatCards(pages)}
          </div>
        </section>
      `
    )
    .join("");
}

function renderFlatCards(pages) {
  return pages
    .map(
      (page) => `
        <a class="page-card" href="${pageUrl(page)}">
          <p class="eyebrow">${escapeHtml(page.type)}</p>
          <h3>${escapeHtml(page.title)}</h3>
          <p>${escapeHtml(page.description || "No summary yet.")}</p>
          <div class="chip-row">
            ${page.tags.slice(0, 4).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
          </div>
        </a>
      `
    )
    .join("");
}

function groupPages(pages) {
  const groups = new Map();
  for (const page of pages) {
    const bucket = groups.get(page.type) || [];
    bucket.push(page);
    groups.set(page.type, bucket);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function renderSourceLinks(page, pageMap) {
  if (!page.sources.length) {
    return "";
  }
  return `
    <section class="panel source-panel">
      <h2>Sources</h2>
      <ul class="list-plain compact">
        ${page.sources
          .map((source) => {
            const target = resolvePage(source, page, pageMap);
            const href = target
              ? pageUrl(target)
              : /^https?:\/\//.test(source)
                ? source
                : null;
            const attrs = href && /^https?:\/\//.test(href) ? ' target="_blank" rel="noreferrer"' : "";
            return `<li>${
              href
                ? `<a href="${escapeHtml(href)}"${attrs}>${escapeHtml(source)}</a>`
                : `<span>${escapeHtml(source)}</span>`
            }</li>`;
          })
          .join("")}
      </ul>
    </section>
  `;
}

function injectWikilinks(markdown, page, pageMap) {
  return markdown.replace(/\[\[([^[\]]+?)\]\]/g, (match, inner) => {
    const [rawTarget, rawLabel] = inner.split("|");
    const target = resolvePage(rawTarget.trim(), page, pageMap);
    const label = (rawLabel || rawTarget).trim();

    if (!target) {
      return `<span class="broken-link">${escapeHtml(label)}</span>`;
    }

    return `[${escapeMarkdownLabel(label)}](${pageUrl(target)})`;
  });
}

function rewriteStandardLink(href, page) {
  if (!href || href.startsWith("#") || /^([a-z]+:)?\/\//i.test(href) || href.startsWith("mailto:")) {
    return null;
  }

  const [targetPart, hash = ""] = href.split("#");
  const rawTarget = targetPart.endsWith(".md")
    ? targetPart
    : `${targetPart}`;
  const currentDir = page.file === "README.md" ? "" : path.posix.dirname(page.file);
  const absoluteTarget = normalizeKey(
    path.posix.normalize(path.posix.join(currentDir.replaceAll(path.sep, "/"), rawTarget))
  );
  const directTarget = normalizeKey(rawTarget);
  const resolved =
    directTarget && directTarget !== "."
      ? null
      : null;

  const lookup = [absoluteTarget, directTarget].find((candidate) => candidate && candidate !== ".");
  if (!lookup) {
    return null;
  }

  const candidatePage = runtimePageMap.get(lookup);
  if (!candidatePage) {
    return null;
  }

  return `${pageUrl(candidatePage)}${hash ? `#${slugify(hash)}` : ""}`;
}

function buildTagMap(pages) {
  const tagMap = new Map();
  for (const page of pages) {
    for (const tag of page.tags) {
      const bucket = tagMap.get(tag) || [];
      bucket.push(page);
      tagMap.set(tag, bucket.sort(sortPagesByDate));
    }
  }
  return tagMap;
}

function buildSearchIndex(pages) {
  return pages.map((page) => ({
    title: page.title,
    type: page.type,
    url: pageUrl(page),
    tags: page.tags,
    text: page.body.replace(/\s+/g, " ").trim(),
    description: page.description
  }));
}

function parseLogEntries(markdown) {
  const entries = [];
  const regex = /^##\s+\[(.+?)\]\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    entries.push({
      date: match[1],
      title: match[2]
    });
  }
  return entries;
}

async function copyAssets() {
  await fs.mkdir(path.join(distDir, "assets"), { recursive: true });
  await fs.copyFile(path.join(assetDir, "site.css"), path.join(distDir, "assets", "site.css"));
  await fs.copyFile(path.join(assetDir, "site.js"), path.join(distDir, "assets", "site.js"));
}

async function writeOutput(targetFile, contents) {
  await fs.mkdir(path.dirname(targetFile), { recursive: true });
  await fs.writeFile(targetFile, contents, "utf8");
}

function derivePageType(area, tags, key) {
  if (area === "home") {
    return "Overview";
  }
  if (area === "raw") {
    return "Raw Source";
  }
  if (area === "schema") {
    return "Schema";
  }
  if (key === "wiki/log") {
    return "Changelog";
  }
  if (tags.includes("entity")) {
    return "Entity";
  }
  if (tags.includes("synthesis")) {
    return "Synthesis";
  }
  if (tags.includes("source")) {
    return "Source";
  }
  if (tags.includes("concept")) {
    return "Concept";
  }
  return "Knowledge";
}

function pageUrl(page) {
  if (page.area === "home") {
    return withBasePath("/");
  }
  return withBasePath(`/${page.file.replace(/\\/g, "/").replace(/\.md$/i, "/")}`);
}

function normalizeKey(value) {
  return value
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\//, "")
    .replace(/\.md$/i, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

function normalizeList(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function normalizeBasePath(value) {
  if (!value || value === "/") {
    return "";
  }
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function withBasePath(relativePath) {
  const normalized = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  if (!basePath) {
    return normalized;
  }
  return `${basePath}${normalized === "/" ? "" : normalized}`;
}

function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

function summarize(markdown) {
  const cleaned = markdown
    .replace(/^---[\s\S]*?---/m, "")
    .replace(/[#>*`\[\]\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 180);
}

function humanizeTitle(value) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugify(value) {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeMarkdownLabel(value) {
  return value.replace(/([\[\]])/g, "\\$1");
}

function sortPagesByDate(a, b) {
  const left = a.date || "";
  const right = b.date || "";
  if (left !== right) {
    return right.localeCompare(left);
  }
  return a.title.localeCompare(b.title);
}
