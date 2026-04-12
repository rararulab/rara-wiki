const root = document.documentElement;
const body = document.body;
const themeToggle = document.querySelector("#theme-toggle");
const searchInput = document.querySelector("#search-input");
const searchPanel = document.querySelector("#search-results");
const resultsList = document.querySelector(".search-results-list");

const savedTheme = localStorage.getItem("rara-wiki-theme");
if (savedTheme) {
  root.dataset.theme = savedTheme;
}

themeToggle?.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  localStorage.setItem("rara-wiki-theme", nextTheme);
});

let searchIndex = [];
const basePath = body.dataset.basePath || "";

fetch(`${basePath}/assets/search-index.json`)
  .then((response) => response.json())
  .then((data) => {
    searchIndex = data;
  })
  .catch(() => {
    searchIndex = [];
  });

searchInput?.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    searchPanel.hidden = true;
    resultsList.innerHTML = "";
    return;
  }

  const hits = searchIndex
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, query)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (!hits.length) {
    searchPanel.hidden = false;
    resultsList.innerHTML = `<p class="muted">No pages matched “${escapeHtml(query)}”.</p>`;
    return;
  }

  resultsList.innerHTML = hits
    .map(
      ({ entry }) => `
        <a class="search-hit" href="${entry.url}">
          <strong>${escapeHtml(entry.title)}</strong>
          <small>${escapeHtml(entry.type)}${entry.tags.length ? ` · ${escapeHtml(entry.tags.join(", "))}` : ""}</small>
          <p>${escapeHtml(snippet(entry, query))}</p>
        </a>
      `
    )
    .join("");
  searchPanel.hidden = false;
});

function scoreEntry(entry, query) {
  let score = 0;
  const haystack = `${entry.title} ${entry.description} ${entry.tags.join(" ")} ${entry.text}`.toLowerCase();
  if (entry.title.toLowerCase().includes(query)) {
    score += 4;
  }
  if (entry.tags.join(" ").toLowerCase().includes(query)) {
    score += 3;
  }
  if (entry.description.toLowerCase().includes(query)) {
    score += 2;
  }
  if (haystack.includes(query)) {
    score += 1;
  }
  return score;
}

function snippet(entry, query) {
  const haystack = entry.text.replace(/\s+/g, " ").trim();
  const index = haystack.toLowerCase().indexOf(query);
  if (index === -1) {
    return entry.description;
  }
  const start = Math.max(0, index - 70);
  const end = Math.min(haystack.length, index + 110);
  return `${start > 0 ? "…" : ""}${haystack.slice(start, end)}${end < haystack.length ? "…" : ""}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
