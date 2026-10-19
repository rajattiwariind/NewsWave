package com.newswave.news;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface NewsArticleRepository
        extends JpaRepository<NewsArticle, Long> {

    Optional<NewsArticle> findByUrl(String url);

    List<NewsArticle> findTop40ByOrderByPublishedAtDesc();

    List<NewsArticle>
    findByPublishedAtGreaterThanEqualAndPublishedAtLessThanOrderByPublishedAtDesc(
            Instant from,
            Instant to,
            Pageable pageable
    );
}