package com.newswave.news;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NewsArticleRepository extends JpaRepository<NewsArticle, Long> {
    Optional<NewsArticle> findByUrl(String url);
    List<NewsArticle> findTop40ByOrderByPublishedAtDesc();
}
