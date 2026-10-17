(() => {
  const page = document.getElementById("articlePage");
  const params = new URLSearchParams(location.search);
  const get = key => params.get(key) || "";
  const esc = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const title = get("title") || "News story";
  const source = get("sourceName") || "Original publisher";
  const url = get("url");
  const image = get("imageUrl");
  const date = get("publishedAt");
  const description = get("description");
  const author = get("author");
  document.title = `${title} | NewsWave`;
  const safeUrl = (() => { try { const parsed = new URL(url); return ["http:","https:"].includes(parsed.protocol) ? parsed.href : ""; } catch { return ""; } })();
  page.innerHTML = `<div class="back-row"><a href="/">← All headlines</a> &nbsp; / &nbsp; ${esc(source)}</div>
    ${image ? `<img class="article-hero-image" src="${esc(image)}" alt="" onerror="this.style.display='none'">` : ""}
    <span class="article-category">${esc(get("category") || "News")}</span>
    <h1 class="article-title">${esc(title)}</h1>
    <div class="article-meta"><span>${esc(source)}</span><span>•</span><span>${esc(date ? new Date(date).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"}) : "Latest")}</span>${author ? `<span>•</span><span>By ${esc(author)}</span>` : ""}</div>
    ${description ? `<p class="article-description">${esc(description)}</p>` : ""}
    <div class="article-notice"><strong>Continue with the original report</strong><br>NewsWave displays headlines and available summaries with source attribution. The full article belongs to its publisher and may not be included in the news feed. Follow the link below to read the complete report and see any updates directly from the source.</div>
    ${safeUrl ? `<a class="original-link" href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer">Read full story at ${esc(source)} <span>↗</span></a>` : ""}
    <p class="article-source-note">Source: ${esc(source)}. Headline, image, and summary are supplied by the news provider or publisher.</p>`;
  document.getElementById("year").textContent = new Date().getFullYear();
})();