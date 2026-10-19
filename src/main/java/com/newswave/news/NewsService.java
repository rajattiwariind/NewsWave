package com.newswave.news;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.data.domain.PageRequest;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class NewsService {
    private final RestClient restClient;
    private final NewsArticleRepository repository;
    private final String apiKey;
    private final String country;


    public List<NewsArticle> archive(
            LocalDate from,
            LocalDate to,
            int page) {

        Instant start = from.atStartOfDay(ZoneOffset.UTC).toInstant();

        // Exclusive end includes all times on the selected "to" date.
        Instant end = to.plusDays(1)
                .atStartOfDay(ZoneOffset.UTC)
                .toInstant();

        return repository
                .findByPublishedAtGreaterThanEqualAndPublishedAtLessThanOrderByPublishedAtDesc(
                        start,
                        end,
                        PageRequest.of(page - 1, 20)
                );
    }


    public NewsService(RestClient.Builder builder,
                       NewsArticleRepository repository,
                       @Value("${newsapi.base-url}") String baseUrl,
                       @Value("${newsapi.api-key:}") String apiKey,
                       @Value("${newsapi.country:in}") String country) {
        this.restClient = builder.baseUrl(baseUrl).build();
        this.repository = repository;
        this.apiKey = apiKey;
        this.country = country;
    }

    public List<NewsArticle> headlines(String category, int page) {
        String normalized = normalizeCategory(category);
        if (apiKey.isBlank()) {
            return repository.findTop40ByOrderByPublishedAtDesc();
        }
        try {
            NewsApiResponse response = restClient.get()
                    .uri(uri -> {
                        var builder = uri.path("/top-headlines")
                                .queryParam("country", country)
                                .queryParam("pageSize", 20)
                                .queryParam("page", Math.max(1, page));
                        if (!normalized.equals("general")) builder.queryParam("category", normalized);
                        return builder.build();
                    })
                    .header("X-Api-Key", apiKey)
                    .retrieve().body(NewsApiResponse.class);
            return storeAndReturn(response, normalized);
        } catch (RestClientResponseException ex) {
            throw new NewsApiException("News provider returned HTTP " + ex.getStatusCode().value()
                    + ". Check your API key, plan, and request limits.");
        } catch (Exception ex) {
            List<NewsArticle> cached = repository.findTop40ByOrderByPublishedAtDesc();
            if (!cached.isEmpty()) return cached;
            throw new NewsApiException("Could not reach the news provider. Check your internet connection and API key.");
        }
    }

    public List<NewsArticle> search(String query, int page) {
        if (query == null || query.isBlank()) throw new NewsApiException("Enter a search keyword.");
        if (query.length() > 100) throw new NewsApiException("Search must be 100 characters or fewer.");
        if (apiKey.isBlank()) return repository.findTop40ByOrderByPublishedAtDesc().stream()
                .filter(a -> (safe(a.getTitle()) + " " + safe(a.getDescription())).toLowerCase(Locale.ROOT)
                        .contains(query.toLowerCase(Locale.ROOT))).toList();
        try {
            NewsApiResponse response = restClient.get()
                    .uri(uri -> uri.path("/everything").queryParam("q", query)
                            .queryParam("language", "en").queryParam("sortBy", "publishedAt")
                            .queryParam("pageSize", 20).queryParam("page", Math.max(1, page)).build())
                    .header("X-Api-Key", apiKey)
                    .retrieve().body(NewsApiResponse.class);
            return storeAndReturn(response, "search");
        } catch (RestClientResponseException ex) {
            throw new NewsApiException("News provider returned HTTP " + ex.getStatusCode().value()
                    + ". Check your API key, plan, and request limits.");
        } catch (Exception ex) {
            throw new NewsApiException("Search failed. Please try again in a moment.");
        }
    }

    private List<NewsArticle> storeAndReturn(NewsApiResponse response, String category) {
        if (response == null || response.articles() == null) return List.of();
        List<NewsArticle> saved = response.articles().stream()
                .filter(a -> a.url() != null && a.url().startsWith("http"))
                .filter(a -> a.title() != null && !a.title().equals("[Removed]"))
                .map(a -> {
                    String source = a.source() == null ? "News source" : safe(a.source().name());
                    Instant published = a.publishedAt() == null ? Instant.now() : a.publishedAt();
                    NewsArticle entity = repository.findByUrl(a.url()).orElseGet(() ->
                            new NewsArticle(a.url(), a.title(), a.description(), a.imageUrl(),
                                    source, a.author(), category, published));
                    entity.setTitle(a.title());
                    entity.setDescription(a.description());
                    entity.setImageUrl(a.imageUrl());
                    entity.setSourceName(source);
                    entity.setAuthor(a.author());
                    entity.setCategory(category);
                    entity.setPublishedAt(published);
                    return repository.save(entity);
                }).toList();
        return saved;
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) return "general";
        String value = category.toLowerCase(Locale.ROOT).trim();
        return switch (value) {
            case "business", "entertainment", "general", "health", "science", "sports", "technology" -> value;
            default -> throw new NewsApiException("Unsupported category. Choose business, entertainment, general, health, science, sports, or technology.");
        };
    }

    private String safe(String value) { return value == null ? "" : value; }
}
