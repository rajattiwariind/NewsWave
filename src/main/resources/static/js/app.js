
/* =========================================================
   NEWSWAVE — Homepage and news feed
   File: src/main/resources/static/js/app.js
   Backend endpoints remain unchanged.
   ========================================================= */

(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const grid = $("#newsGrid");
  const featured = $("#featuredStory");
  const status = $("#statusMessage");
  const sectionTitle = $("#sectionTitle");
  const loadMoreBtn = $("#loadMoreBtn");

  let currentCategory = "general";
  let currentQuery = "";
  let page = 1;
  let isLoading = false;
  let requestNumber = 0;
  let currentStories = [];

  const PAGE_SIZE = 20;
  const POPULAR_KEY = "newswave-story-reads";

  const categoryNames = {
    general: "Top stories",
    business: "Business",
    technology: "Technology",
    science: "Science",
    health: "Health",
    sports: "Sports",
    entertainment: "Culture",
    search: "Search"
  };

  const fallbackImages = [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"
  ];

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function safeImage(value, index = 0) {
    if (value) {
      try {
        const parsed = new URL(value, window.location.origin);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
          return parsed.href;
        }
      } catch (_) {
        // Use a fallback image for invalid URLs.
      }
    }
    return fallbackImages[index % fallbackImages.length];
  }

  function dateLabel(value) {
    if (!value) return "Latest";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Latest";

    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);

    if (minutes >= 0 && minutes < 60) {
      return `${Math.max(1, minutes)} min ago`;
    }

    if (minutes >= 60 && minutes < 1440) {
      return `${Math.floor(minutes / 60)} hr ago`;
    }

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  }

  function fullDate(value) {
    if (!value) return "Latest";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Latest";

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function articleId(article) {
    return String(
      article.url ||
      `${article.sourceName || ""}-${article.title || ""}`
    );
  }

  function storyUrl(article) {
    const params = new URLSearchParams();

    Object.entries(article).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });

    return `/article.html?${params.toString()}`;
  }

  function articleCategory(article) {
    const category = article.category || currentCategory;
    return categoryNames[category] || category || "News";
  }

  function storyLink(article, className = "story-link") {
    return storyUrl(article);
  }

  function renderFeatured(article) {
    if (!article) {
      featured.innerHTML = "";
      return;
    }

    const image = safeImage(article.imageUrl, 0);
    const title = article.title || "Untitled story";
    const source = article.sourceName || "Original publisher";
    const description = article.description ||
      "Explore the original publisher's report for more details.";

    featured.innerHTML = `
      <a class="featured-link story-link"
         href="${escapeHTML(storyUrl(article))}"
         data-story-id="${escapeHTML(articleId(article))}"
         aria-label="Read featured story: ${escapeHTML(title)}">

        <img class="featured-image"
             src="${escapeHTML(image)}"
             alt=""
             fetchpriority="high">

        <div class="featured-overlay"></div>

        <div class="featured-content">
          <div class="featured-badges">
            <span class="featured-label">Featured story</span>
            <span class="featured-live">${escapeHTML(articleCategory(article))}</span>
          </div>

          <h2>${escapeHTML(title)}</h2>

          <p>${escapeHTML(description)}</p>

          <div class="featured-meta">
            <span>${escapeHTML(source)}</span>
            <span>·</span>
            <span>${escapeHTML(dateLabel(article.publishedAt))}</span>
            ${article.author ? `
              <span>·</span>
              <span>${escapeHTML(article.author)}</span>
            ` : ""}
          </div>

          <span class="featured-cta">
            Read the story <span aria-hidden="true">↗</span>
          </span>
        </div>
      </a>
    `;

    const imageElement = featured.querySelector(".featured-image");
    imageElement.addEventListener("error", () => {
      imageElement.src = fallbackImages[0];
    }, { once: true });
  }

  function renderCard(article, index) {
    const title = article.title || "Untitled story";
    const source = article.sourceName || "Original publisher";
    const description = article.description ||
      "Open the original publisher's report for more details.";
    const image = safeImage(article.imageUrl, index + 1);

    return `
      <article class="news-card" style="animation-delay:${Math.min(index * 55, 330)}ms">
        <a class="story-link"
           href="${escapeHTML(storyUrl(article))}"
           data-story-id="${escapeHTML(articleId(article))}"
           aria-label="Read ${escapeHTML(title)}">

          <div class="card-image-wrap">
            <img class="card-image"
                 src="${escapeHTML(image)}"
                 alt=""
                 loading="lazy">
            <span class="card-category">${escapeHTML(articleCategory(article))}</span>
          </div>

          <div class="card-body">
            <div class="card-meta">
              <span>${escapeHTML(dateLabel(article.publishedAt))}</span>
              <span class="meta-dot"></span>
              <span>${escapeHTML(source)}</span>
            </div>

            <h3 class="card-title">${escapeHTML(title)}</h3>
            <p class="card-description">${escapeHTML(description)}</p>

            <div class="card-footer">
              <span class="source-name">${escapeHTML(source)}</span>
              <span class="read-link">Read story <span aria-hidden="true">↗</span></span>
            </div>
          </div>
        </a>
      </article>
    `;
  }

  function renderTrending(stories) {
    const trendingList = $("#trendingList");

    if (!stories.length) {
      trendingList.innerHTML =
        '<p class="panel-placeholder">Trending stories will appear when headlines load.</p>';
      return;
    }

    trendingList.innerHTML = stories.slice(0, 5).map((article, index) => `
      <div class="trending-item">
        <span class="trending-number">${String(index + 1).padStart(2, "0")}</span>
        <a href="${escapeHTML(storyUrl(article))}"
           data-story-id="${escapeHTML(articleId(article))}">
          <h4>${escapeHTML(article.title || "Untitled story")}</h4>
          <p>${escapeHTML(article.sourceName || "News source")} · ${escapeHTML(dateLabel(article.publishedAt))}</p>
        </a>
      </div>
    `).join("");
  }

  function getReadCounts() {
    try {
      const saved = JSON.parse(localStorage.getItem(POPULAR_KEY) || "{}");
      return saved && typeof saved === "object" && !Array.isArray(saved)
        ? saved
        : {};
    } catch (_) {
      return {};
    }
  }

  function renderMostRead() {
    const list = $("#mostReadList");
    const reads = getReadCounts();

    const knownStories = new Map();

    currentStories.forEach((article) => {
      knownStories.set(articleId(article), article);
    });

    const ranked = Object.entries(reads)
      .filter(([id, count]) => Number(count) > 0 && knownStories.has(id))
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 5);

    if (!ranked.length) {
      list.innerHTML = `
        <p class="panel-placeholder">
          Open a few stories and your most-read articles will appear here.
        </p>`;
      return;
    }

    list.innerHTML = ranked.map(([id, count], index) => {
      const article = knownStories.get(id);

      return `
        <div class="most-read-item">
          <span class="most-read-count">${String(index + 1).padStart(2, "0")}</span>
          <div>
            <a href="${escapeHTML(storyUrl(article))}"
               data-story-id="${escapeHTML(id)}">
              ${escapeHTML(article.title || "Untitled story")}
            </a>
            <small>${Number(count)} ${Number(count) === 1 ? "open" : "opens"}</small>
          </div>
        </div>
      `;
    }).join("");
  }

  function updateStatus(message = "", error = false) {
    status.classList.toggle("error", error);

    if (!message) {
      status.innerHTML = "";
      return;
    }

    if (error) {
      status.textContent = message;
      return;
    }

    status.innerHTML = `
      <span class="status-spinner" aria-hidden="true"></span>
      ${escapeHTML(message)}
    `;
  }

  function updateHeading() {
    const heading = currentQuery
      ? `Search results <span class="muted-heading">/ ${escapeHTML(currentQuery)}</span>`
      : `${escapeHTML(categoryNames[currentCategory] || "News")} <span class="muted-heading">/ Latest</span>`;

    sectionTitle.innerHTML = heading;
    $("#tickerText").textContent = currentQuery
      ? `Stories matching "${currentQuery}".`
      : `The latest ${categoryNames[currentCategory] || "news"} from our news sources.`;
  }

  function updateNav() {
    $$(".nav-link").forEach((button) => {
      const isActive = !currentQuery &&
        button.dataset.category === currentCategory;

      button.classList.toggle("active", isActive);
      button.setAttribute("aria-current", isActive ? "page" : "false");
    });
  }

  function updateResultsLabel(count, append = false) {
    if (currentQuery) {
      $("#resultsLabel").textContent = `Search: "${currentQuery}"`;
      return;
    }

    $("#resultsLabel").textContent =
      `${append ? currentStories.length : count} stories · ${categoryNames[currentCategory] || "News"}`;
  }

  async function loadNews({ reset = true } = {}) {


    isLoading = true;
    const thisRequest = ++requestNumber;

    if (reset) {
      page = 1;
      currentStories = [];
      featured.innerHTML = "";
      grid.innerHTML = "";
      loadMoreBtn.style.display = "none";
      updateStatus("Gathering the latest headlines…");
    } else {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = "Loading stories…";
    }

    updateHeading();
    updateNav();

    const endpoint = currentQuery
      ? `/api/news/search?q=${encodeURIComponent(currentQuery)}&page=${page}`
      : `/api/news/headlines?category=${encodeURIComponent(currentCategory)}&page=${page}`;

    try {
      const response = await fetch(endpoint, {
        headers: { Accept: "application/json" }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `News request failed (${response.status}).`);
      }

      if (!Array.isArray(data)) {
        throw new Error("The news API returned an unexpected response format.");
      }

      // Ignore a response if a newer request has superseded it.
      if (thisRequest !== requestNumber) return;

      if (data.length === 0) {
        if (reset) {
          updateStatus("No stories found. Try another category or search term.");
          featured.innerHTML = "";
          grid.innerHTML = "";
          renderTrending([]);
        } else {
          updateStatus("");
          loadMoreBtn.textContent = "You've reached the latest stories";
        }

        loadMoreBtn.style.display = reset ? "none" : "inline-block";
        loadMoreBtn.disabled = true;
        updateResultsLabel(currentStories.length, true);
        renderMostRead();
        return;
      }

      updateStatus("");

      currentStories = reset
        ? data.slice()
        : [...currentStories, ...data];

      // Avoid duplicate stories if the API returns overlapping pages.
      const uniqueStories = [];
      const seen = new Set();

      currentStories.forEach((article) => {
        const id = articleId(article);
        if (!seen.has(id)) {
          seen.add(id);
          uniqueStories.push(article);
        }
      });

      currentStories = uniqueStories;

      // One featured story, followed by the regular article grid.
      renderFeatured(currentStories[0]);
      grid.innerHTML = currentStories.slice(1).map(renderCard).join("");

      renderTrending(currentStories);
      renderMostRead();
      updateResultsLabel(currentStories.length, true);

      loadMoreBtn.style.display = "inline-block";
      loadMoreBtn.disabled = data.length < PAGE_SIZE;
      loadMoreBtn.innerHTML = data.length < PAGE_SIZE
        ? "You've reached the latest stories"
        : 'Load more stories <span aria-hidden="true">↓</span>';

      if (reset) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      if (thisRequest !== requestNumber) return;

      updateStatus(
        `${error.message} Check that Spring Boot is running and the news service is configured.`,
        true
      );

      if (reset) {
        featured.innerHTML = "";
        grid.innerHTML = "";
        renderTrending([]);
      }

      loadMoreBtn.style.display = "none";
    } finally {
      if (thisRequest === requestNumber) {
        isLoading = false;
        if (loadMoreBtn.textContent.includes("Loading stories")) {
          loadMoreBtn.disabled = false;
        }
      }
    }
  }

  function closeMobileMenu() {
    const nav = $("#mainNav");
    const toggle = $("#mobileMenuToggle");

    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
  }

  // Category navigation
  $$(".nav-link").forEach((button) => {
    button.addEventListener("click", () => {
      currentCategory = button.dataset.category;
      currentQuery = "";
      $("#searchInput").value = "";
      closeMobileMenu();
      loadNews();
    });
  });

  // Search — existing backend route remains unchanged.
  $("#searchForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const query = $("#searchInput").value.trim();

    if (!query) {
      $("#searchInput").focus();
      return;
    }

    currentQuery = query;
    closeMobileMenu();
    loadNews();
  });

  // Mobile menu toggle
  $("#mobileMenuToggle").addEventListener("click", () => {
    const nav = $("#mainNav");
    const toggle = $("#mobileMenuToggle");
    const isOpen = nav.classList.toggle("open");

    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  // Load more
  loadMoreBtn.addEventListener("click", () => {
    if (isLoading || loadMoreBtn.disabled) return;
    page += 1;
    loadNews({ reset: false });
  });

  // Refresh
  $("#refreshBtn").addEventListener("click", () => {
    loadNews();
  });

  // Track article opens on this browser only.
  // This is local reading activity, not publisher-wide view analytics.
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-story-id]");
    if (!link) return;

    const id = link.dataset.storyId;
    if (!id) return;

    try {
      const reads = getReadCounts();
      reads[id] = Number(reads[id] || 0) + 1;
      localStorage.setItem(POPULAR_KEY, JSON.stringify(reads));
    } catch (_) {
      // The site remains usable if browser storage is disabled.
    }
  });

  // Keep the most-read panel updated when the page returns to focus.
  window.addEventListener("focus", renderMostRead);

  // Date and footer
  const now = new Date();
  $("#todayLabel").textContent = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
  $("#editionDate").textContent = now.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  $("#year").textContent = now.getFullYear();

  loadNews();
})();
