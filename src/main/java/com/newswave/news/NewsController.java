
package com.newswave.news;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/news")
public class NewsController {

    private final NewsService service;

    public NewsController(NewsService service) {
        this.service = service;
    }

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

    // Browse previously saved articles by publication date.
    @GetMapping("/archive")
    public List<NewsArticle> archive(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to,

            @RequestParam(defaultValue = "1") int page) {

        if (from.isAfter(to)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "'from' must be on or before 'to'."
            );
        }

        if (page < 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Page must be 1 or greater."
            );
        }

        return service.archive(from, to, page);
    }

    @ExceptionHandler(NewsApiException.class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    public ErrorResponse handleNewsError(NewsApiException ex) {
        return new ErrorResponse(ex.getMessage());
    }

    public record ErrorResponse(String message) {}
}
