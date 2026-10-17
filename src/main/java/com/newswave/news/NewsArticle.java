package com.newswave.news;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "news_articles", uniqueConstraints = @UniqueConstraint(columnNames = "url"))
public class NewsArticle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String url;

    @Column(length = 500)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(length = 1000)
    private String imageUrl;

    @Column(length = 250)
    private String sourceName;

    @Column(length = 250)
    private String author;

    @Column(length = 100)
    private String category;

    private Instant publishedAt;

    public NewsArticle() {}

    public NewsArticle(String url, String title, String description, String imageUrl,
                       String sourceName, String author, String category, Instant publishedAt) {
        this.url = url;
        this.title = title;
        this.description = description;
        this.imageUrl = imageUrl;
        this.sourceName = sourceName;
        this.author = author;
        this.category = category;
        this.publishedAt = publishedAt;
    }

    public Long getId() { return id; }
    public String getUrl() { return url; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public String getSourceName() { return sourceName; }
    public String getAuthor() { return author; }
    public String getCategory() { return category; }
    public Instant getPublishedAt() { return publishedAt; }

    public void setUrl(String url) { this.url = url; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }
    public void setAuthor(String author) { this.author = author; }
    public void setCategory(String category) { this.category = category; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
}
