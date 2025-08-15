package ru.ak.lawcrmsystem3.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

public record StageOrderUpdate(
        @JsonProperty UUID id,
        @JsonProperty int orderIndex
) {
}
