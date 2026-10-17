package com.newswave.news;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

@JsonIgnoreProperties(ignoreUnknown = true)
public record NewsApiArticle(
        Source source,
        String author,
        String title,
        String description,
        @JsonProperty("urlToImage") String imageUrl,
        String url,
        @JsonProperty("publishedAt") Instant publishedAt,
        String content
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Source(String id, String name) {}
}
