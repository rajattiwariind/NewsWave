
(() => {
  "use strict";

  const API = "/api/news";
  const PAGE_SIZE = 20;
  const KEYS = {
    bookmarks: "newswave-bookmarks",
    reads: "newswave-reads"
  };

  const $ = (selector) => document.querySelector(selector);

  const els = {
    mainNav: $("#mainNav"),
    mobileNav: $("#mobileNav"),
    menuToggle: $("#mobileMenuToggle"),
    searchForm: $("#searchForm"),
    searchInput: $("#searchInput"),
    themeToggle: $("#themeToggle"),
    ticker: $("#tickerText"),
    refresh: $("#refreshBtn"),
    sectionTitle: $("#sectionTitle"),
    sectionEyebrow: $("#sectionEyebrow"),
    resultsLabel: $("#resultsLabel"),
    status: $("#statusMessage"),
    featured: $("#featuredStory"),
    carouselCounter: $("#carouselCounter"),
    prevFeatured: $("#prevFeatured"),
    nextFeatured: $("#nextFeatured"),
    grid: $("#newsGrid"),
    loadMore: $("#loadMoreBtn"),
    trending: $("#trendingList"),
    recent: $("#mostReadList"),
    archiveForm: $("#archiveForm"),
    archiveFrom: $("#archiveFrom"),
    archiveTo: $("#archiveTo"),
    clearArchive: $("#clearArchiveBtn"),
    viewMode: $("#viewMode"),
    bookmarksBtn: $("#bookmarksBtn"),
    savedCount: $("#savedCount"),
    savedSection: $("#savedSection"),
    savedGrid: $("#savedGrid"),
    closeBookmarks: $("#closeBookmarksBtn"),
    scrollTop: $("#scrollTopBtn"),
    backToTop: $("#backToTopBtn"),
    toast: $("#toast")
  };

  const state = {
    category: "general",
    query: "",
    archive: null,
    page: 1,
    loading: false,
    hasMore: true,
    stories: [],
    featuredIndex: 0,
    mode: "latest",
    requestNumber: 0,
    toastTimer: null
  };

  function readStorage(key, fallback = []) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return Array.isArray(fallback) ? (Array.isArray(value) ? value : fallback)
        : (value ?? fallback);
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      showToast("Browser storage is unavailable.");
    }
  }

  function bookmarks() {
    return readStorage(KEYS.bookmarks);
  }

  function recentReads() {
    return readStorage(KEYS.reads);
  }

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function safeUrl(value) {
    try {
      const url = new URL(value, window.location.origin);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function dateValue(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    const date = dateValue(value);
    if (!date) return "Recent";
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function timeAgo(value) {
    const date = dateValue(value);
    if (!date) return "Recently";
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(value);
  }

  function getTitle(article) {
    return article?.title || "Untitled story";
  }

  function getDescription(article) {
    return article?.description || "Open this story to read more from the original source.";
  }

  function getSource(article) {
    return article?.sourceName || "News source";
  }

  function getCategory(article) {
    return (article?.category || state.category || "general").replace(/[-_]/g, " ");
  }

  function storyId(article) {
    return article?.url || `${getTitle(article)}|${article?.publishedAt || ""}`;
  }

  function storyLink(article) {
    const params = new URLSearchParams();
    params.set("url", article?.url || "");
    params.set("title", getTitle(article));
    params.set("description", getDescription(article));
    params.set("image", article?.imageUrl || "");
    params.set("source", getSource(article));
    params.set("publishedAt", article?.publishedAt || "");
    params.set("author", article?.author || "");
    params.set("category", article?.category || state.category);
    return `/article.html?${params.toString()}`;
  }

  function isSaved(article) {
    return bookmarks().some((item) => storyId(item) === storyId(article));
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add("visible");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      els.toast.classList.remove("visible");
    }, 2600);
  }

  function updateBookmarkCount() {
    if (els.savedCount) els.savedCount.textContent = bookmarks().length;
  }

  function updateNav() {
    document.querySelectorAll("[data-category]").forEach((button) => {
      const active = button.dataset.category === state.category && !state.query && !state.archive;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function updateHeading() {
    if (state.mode === "saved") {
      els.sectionTitle.textContent = "Your saved stories";
      els.sectionEyebrow.textContent = "YOUR COLLECTION";
      els.resultsLabel.textContent = `${bookmarks().length} saved stories`;
      return;
    }

    if (state.archive) {
      els.sectionTitle.textContent = "From the archive";
      els.sectionEyebrow.textContent = "THE NEWS ARCHIVE";
      els.resultsLabel.textContent =
        `${state.archive.from} → ${state.archive.to}`;
      return;
    }

    if (state.query) {
      els.sectionTitle.textContent = `Search: ${state.query}`;
      els.sectionEyebrow.textContent = "SEARCH RESULTS";
      els.resultsLabel.textContent = "Stories matching your search";
      return;
    }

    const names = {
      general: "Stories worth your time",
      technology: "The future, unfolding",
      business: "Business in motion",
      science: "Beyond the known",
      health: "Health and wellbeing",
      sports: "The world of sport",
      entertainment: "Culture and entertainment"
    };
    els.sectionTitle.textContent = names[state.category] || "Latest stories";
    els.sectionEyebrow.textContent = "THE LATEST";
    els.resultsLabel.textContent = "Fresh perspectives, updated regularly.";
  }

  function setStatus(message = "") {
    if (els.status) els.status.textContent = message;
  }

  function dedupe(items) {
    const seen = new Set();
    return items.filter((item) => {
      const id = storyId(item);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  async function fetchArticles(page) {
    let url;

    if (state.archive) {
      const params = new URLSearchParams({
        from: state.archive.from,
        to: state.archive.to,
        page: String(page)
      });
      url = `${API}/archive?${params}`;
    } else if (state.query) {
      const params = new URLSearchParams({
        q: state.query,
        page: String(page)
      });
      url = `${API}/search?${params}`;
    } else {
      const params = new URLSearchParams({
        category: state.category,
        page: String(page)
      });
      url = `${API}/headlines?${params}`;
    }

    const response = await fetch(url, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      let message = `News request failed (${response.status}).`;
      try {
        const body = await response.json();
        message = body.message || body.error || message;
      } catch {}
      throw new Error(message);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("The news API returned an unexpected response.");
    }
    return data;
  }

  function renderSkeletons() {
    els.grid.innerHTML = Array.from({ length: 4 }, () => `
      <article class="news-card skeleton-card">
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton-lines"><i></i><i></i><i></i></div>
      </article>
    `).join("");
  }

  async function loadNews({ reset = false } = {}) {
    if (state.loading && !reset) return;
    if (!reset && !state.hasMore) return;

    if (reset) {
      state.page = 1;
      state.stories = [];
      state.hasMore = true;
      state.requestNumber++;
      state.mode = "latest";
      updateHeading();
      renderSkeletons();
    }

    const requestNumber = state.requestNumber;
    state.loading = true;
    els.loadMore.disabled = true;
    els.loadMore.textContent = "Loading stories…";
    setStatus("");

    try {
      const data = await fetchArticles(state.page);

      // Ignore results from a previous category/search request.
      if (requestNumber !== state.requestNumber) return;

      const oldLength = state.stories.length;
      state.stories = dedupe([...state.stories, ...data]);
      state.hasMore = data.length >= PAGE_SIZE && state.stories.length > oldLength;
      if (data.length === 0 || state.stories.length === oldLength) {
        state.hasMore = false;
      }

      if (reset) {
        state.featuredIndex = 0;
        renderFeatured();
        renderTicker();
        renderSidebar();
      }

      renderGrid(els.grid, state.stories);
      updateHeading();

      if (state.stories.length === 0) {
        els.grid.innerHTML = `
          <div class="empty-state">
            <strong>No stories found.</strong>
            <p>Try another topic or date range.</p>
          </div>`;
        setStatus("No articles matched this request.");
      } else if (state.archive && reset) {
        showToast("Archive loaded.");
      }

      state.page++;
    } catch (error) {
      if (requestNumber !== state.requestNumber) return;
      if (reset) {
        els.grid.innerHTML = `
          <div class="empty-state">
            <strong>We couldn't load the news.</strong>
            <p>${escapeHTML(error.message)}</p>
            <button class="button-primary" id="retryNewsBtn">Try again ↻</button>
          </div>`;
      } else {
        setStatus(error.message || "Could not load more stories.");
      }
      setStatus(error.message || "Could not load the news.");
    } finally {
      if (requestNumber === state.requestNumber) {
        state.loading = false;
        els.loadMore.disabled = false;
        els.loadMore.hidden = !state.hasMore;
        els.loadMore.innerHTML = 'Load more stories <span>↓</span>';
      }
    }
  }

  function renderFeatured() {
    if (!state.stories.length) {
      els.featured.innerHTML = "";
      els.carouselCounter.textContent = "00 / 00";
      return;
    }

    const count = Math.min(5, state.stories.length);
    state.featuredIndex = ((state.featuredIndex % count) + count) % count;
    const article = state.stories[state.featuredIndex];
    const image = safeUrl(article.imageUrl);
    const link = storyLink(article);

    els.carouselCounter.textContent =
      `${String(state.featuredIndex + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;

    els.featured.innerHTML = `
      <article class="featured-story">
        <div class="featured-image-wrap">
          ${image
            ? `<img class="featured-image" src="${escapeHTML(image)}" alt="${escapeHTML(getTitle(article))}" fetchpriority="high">`
            : `<div class="featured-image"></div>`}
        </div>
        <div class="featured-content">
          <span class="story-tag">${escapeHTML(getCategory(article))} / Spotlight</span>
          <h3>${escapeHTML(getTitle(article))}</h3>
          <p>${escapeHTML(getDescription(article))}</p>
          <div class="story-meta">
            <span>${escapeHTML(getSource(article))}</span><span class="meta-dot"></span>
            <span>${escapeHTML(timeAgo(article.publishedAt))}</span>
          </div>
          <div class="featured-actions">
            <a class="read-story" href="${escapeHTML(link)}">Read the story <span>↗</span></a>
            <button class="bookmark-button ${isSaved(article) ? "is-saved" : ""}"
              data-bookmark="${escapeHTML(storyId(article))}"
              aria-label="${isSaved(article) ? "Remove bookmark" : "Save story"}"
              title="${isSaved(article) ? "Remove bookmark" : "Save story"}">${isSaved(article) ? "♥" : "♡"}</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderGrid(container, articles) {
    if (!articles.length) {
      container.innerHTML = `<div class="empty-state"><strong>Nothing here yet.</strong><p>Stories you save will appear here.</p></div>`;
      return;
    }

    container.innerHTML = articles.map((article) => {
      const image = safeUrl(article.imageUrl);
      const saved = isSaved(article);
      const id = escapeHTML(storyId(article));

      return `
        <article class="news-card">
          <div class="card-image-wrap">
            ${image
              ? `<img class="card-image" src="${escapeHTML(image)}" alt="${escapeHTML(getTitle(article))}" loading="lazy">`
              : `<div class="card-image"></div>`}
            <span class="card-category">${escapeHTML(getCategory(article))}</span>
            <button class="card-bookmark ${saved ? "is-saved" : ""}"
              data-bookmark="${id}"
              aria-label="${saved ? "Remove bookmark" : "Save story"}"
              title="${saved ? "Remove bookmark" : "Save story"}">${saved ? "♥" : "♡"}</button>
          </div>
          <div class="card-content">
            <div class="card-meta">
              <span>${escapeHTML(timeAgo(article.publishedAt))}</span>
              <span class="meta-dot"></span>
              <span>${escapeHTML(formatDate(article.publishedAt))}</span>
            </div>
            <h3><a href="${escapeHTML(storyLink(article))}" data-read="${id}">${escapeHTML(getTitle(article))}</a></h3>
            <p>${escapeHTML(getDescription(article))}</p>
            <div class="card-footer">
              <span class="card-source">${escapeHTML(getSource(article))}</span>
              <a class="card-read" href="${escapeHTML(storyLink(article))}" data-read="${id}">Read more ↗</a>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderTicker() {
    if (!state.stories.length) return;
    const headlines = state.stories.slice(0, 10).map((item) =>
      `<span>${escapeHTML(getTitle(item))}</span>`
    );
    els.ticker.innerHTML = [...headlines, ...headlines].join(' <span style="color:var(--blue)">　✦　</span> ');
    els.ticker.classList.add("scrolling");
  }

  function renderSidebar() {
    const trending = state.stories.slice(0, 5);
    els.trending.innerHTML = trending.length ? trending.map((article, index) => `
      <div class="trending-item">
        <span class="trending-number">${String(index + 1).padStart(2, "0")}</span>
        <div>
          <a href="${escapeHTML(storyLink(article))}" data-read="${escapeHTML(storyId(article))}">${escapeHTML(getTitle(article))}</a>
          <span>${escapeHTML(getSource(article))} · ${escapeHTML(timeAgo(article.publishedAt))}</span>
        </div>
      </div>
    `).join("") : `<p class="sidebar-loading">No trending stories yet.</p>`;

    const reads = recentReads().slice(0, 4);
    els.recent.innerHTML = reads.length ? reads.map((article, index) => `
      <div class="trending-item">
        <span class="trending-number">${String(index + 1).padStart(2, "0")}</span>
        <div>
          <a href="${escapeHTML(storyLink(article))}">${escapeHTML(getTitle(article))}</a>
          <span>${escapeHTML(getSource(article))}</span>
        </div>
      </div>
    `).join("") : `<p class="sidebar-loading">Open a story to start your reading trail.</p>`;
  }

  function toggleBookmark(id) {
    const all = [...state.stories, ...bookmarks()];
    const article = all.find((item) => storyId(item) === id);
    if (!article) {
      showToast("This story could not be found. Refresh the news and try again.");
      return;
    }

    let list = bookmarks();
    if (list.some((item) => storyId(item) === id)) {
      list = list.filter((item) => storyId(item) !== id);
      showToast("Removed from saved stories.");
    } else {
      list.unshift(article);
      showToast("Story saved for later.");
    }

    writeStorage(KEYS.bookmarks, dedupe(list).slice(0, 100));
    updateBookmarkCount();

    // Repaint cards to update bookmark icons.
    renderFeatured();
    renderGrid(els.grid, state.stories);
    if (state.mode === "saved") renderSaved();
  }

  function renderSaved() {
    const list = bookmarks();
    renderGrid(els.savedGrid, list);
    updateBookmarkCount();
  }

  function openBookmarks() {
    state.mode = "saved";
    els.savedSection.hidden = false;
    els.featured.closest(".featured-section").hidden = true;
    $("#storiesSection").hidden = true;
    els.savedSection.scrollIntoView({ behavior: "smooth", block: "start" });
    renderSaved();
  }

  function closeBookmarks() {
    state.mode = "latest";
    els.savedSection.hidden = true;
    els.featured.closest(".featured-section").hidden = false;
    $("#storiesSection").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function recordRead(id) {
    const article = [...state.stories, ...bookmarks()].find((item) => storyId(item) === id);
    if (!article) return;
    const list = recentReads().filter((item) => storyId(item) !== id);
    list.unshift(article);
    writeStorage(KEYS.reads, list.slice(0, 8));
  }

  function setCategory(category) {
    state.category = category;
    state.query = "";
    state.archive = null;
    state.mode = "latest";
    els.searchInput.value = "";
    els.featured.closest(".featured-section").hidden = false;
    $("#storiesSection").hidden = false;
    els.savedSection.hidden = true;
    updateNav();
    loadNews({ reset: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
    els.mobileNav.classList.remove("open");
    els.menuToggle.setAttribute("aria-expanded", "false");
  }

  function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function setupDates() {
    const today = new Date();
    els.archiveFrom.value = localDateString(new Date(today.getTime() - 7 * 86400000));
    els.archiveTo.value = localDateString(today);
    els.archiveTo.max = localDateString(today);

    $("#todayLabel").textContent = today.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase();
    $("#editionDate").textContent = today.toLocaleDateString(undefined, {
      day: "numeric", month: "long", year: "numeric"
    });
    $("#year").textContent = today.getFullYear();
  }

  function openArchive(from, to) {
    if (!from || !to) {
      showToast("Choose both archive dates.");
      return;
    }
    if (from > to) {
      showToast("The start date must be before the end date.");
      return;
    }
    if (to > localDateString(new Date())) {
      showToast("The end date cannot be in the future.");
      return;
    }

    state.archive = { from, to };
    state.query = "";
    state.mode = "latest";
    els.searchInput.value = "";
    updateNav();
    loadNews({ reset: true });
    $("#storiesSection").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setupReveals() {
    const items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("revealed"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    items.forEach((item) => observer.observe(item));
  }

  // Category navigation.
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => setCategory(button.dataset.category));
  });

  // Search.
  els.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = els.searchInput.value.trim();
    if (!query) {
      showToast("Enter a topic, keyword, or person to search.");
      return;
    }
    if (query.length > 100) {
      showToast("Search must be 100 characters or fewer.");
      return;
    }

    state.query = query;
    state.archive = null;
    state.mode = "latest";
    updateNav();
    loadNews({ reset: true });
    $("#storiesSection").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Archive filters.
  els.archiveForm.addEventListener("submit", (event) => {
    event.preventDefault();
    openArchive(els.archiveFrom.value, els.archiveTo.value);
  });

  els.clearArchive.addEventListener("click", () => {
    state.archive = null;
    state.query = "";
    els.searchInput.value = "";
    els.archiveFrom.value = localDateString(new Date(Date.now() - 7 * 86400000));
    els.archiveTo.value = localDateString(new Date());
    setCategory(state.category);
  });

  // Pagination.
  els.loadMore.addEventListener("click", () => loadNews());

  // Retry button rendered in an error state.
  els.grid.addEventListener("click", (event) => {
    if (event.target.closest("#retryNewsBtn")) loadNews({ reset: true });
  });

  // Featured carousel.
  els.prevFeatured.addEventListener("click", () => {
    state.featuredIndex--;
    renderFeatured();
  });
  els.nextFeatured.addEventListener("click", () => {
    state.featuredIndex++;
    renderFeatured();
  });

  // Delegated bookmark controls.
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-bookmark]");
    if (button) {
      event.preventDefault();
      event.stopPropagation();
      toggleBookmark(button.dataset.bookmark);
    }
  });

  // Record stories when their links are followed.
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-read]");
    if (link) recordRead(link.dataset.read);
  });

  // Bookmarks panel.
  els.bookmarksBtn.addEventListener("click", openBookmarks);
  els.closeBookmarks.addEventListener("click", closeBookmarks);

  // Compact/grid mode.
  els.viewMode.addEventListener("change", () => {
    els.grid.classList.toggle("compact", els.viewMode.value === "compact");
  });

  // Refresh current view.
  els.refresh.addEventListener("click", () => {
    state.featuredIndex = 0;
    loadNews({ reset: true });
  });

  // Mobile navigation.
  els.menuToggle.addEventListener("click", () => {
    const isOpen = els.mobileNav.classList.toggle("open");
    els.menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Scroll controls.
  window.addEventListener("scroll", () => {
    els.scrollTop.classList.toggle("visible", window.scrollY > 450);
  }, { passive: true });

  els.scrollTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  els.backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // Keyboard shortcut: "/" focuses search unless typing in a field.
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      els.searchInput.focus();
    }
    if (event.key === "Escape") {
      els.mobileNav.classList.remove("open");
      els.menuToggle.setAttribute("aria-expanded", "false");
    }
  });

  setupDates();
  setupReveals();
  updateBookmarkCount();
  updateNav();
  loadNews({ reset: true });
})();
