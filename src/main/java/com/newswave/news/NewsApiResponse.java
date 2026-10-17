package com.newswave.news;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record NewsApiResponse(String status, int totalResults, List<NewsApiArticle> articles, String code, String message) {}
