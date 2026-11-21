package com.studentmanagement.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class QuizRewardRequest {

    @NotNull(message = "Points are required")
    @Min(value = 1, message = "Points must be at least 1")
    @Max(value = 200, message = "Points cannot exceed 200 per session")
    private Integer points;

    @NotBlank(message = "Topic is required")
    private String topic;

    private Integer score;
    private Integer totalQuestions;

    public QuizRewardRequest() {}

    public QuizRewardRequest(Integer points, String topic, Integer score, Integer totalQuestions) {
        this.points = points;
        this.topic = topic;
        this.score = score;
        this.totalQuestions = totalQuestions;
    }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
}

