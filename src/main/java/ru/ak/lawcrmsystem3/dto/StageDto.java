package ru.ak.lawcrmsystem3.dto;

import java.time.LocalDate;

public record StageDto(
        String id,
        String stageName,
        String stageDescription,
        String status,
        String processType,
        LocalDate startDate,
        LocalDate endDate
) {
}
