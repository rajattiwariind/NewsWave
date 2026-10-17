package com.newswave.news;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/news")
public class NewsController {
    private final NewsService service;

    public NewsController(NewsService service) { this.service = service; }

    @GetMapping("/headlines")
    public List<NewsArticle> headlines(
            @RequestParam(defaultValue = "general") String category,
            @RequestParam(defaultValue = "1") int page) {
        return service.headlines(category, page);
    }

    @GetMapping("/search")
    public List<NewsArticle> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "1") int page) {
        return service.search(q, page);
    }

    @ExceptionHandler(NewsApiException.class)
    @ResponseStatus(org.springframework.http.HttpStatus.BAD_GATEWAY)
    public ErrorResponse handleNewsError(NewsApiException ex) {
        return new ErrorResponse(ex.getMessage());
    }

    public record ErrorResponse(String message) {}
}
