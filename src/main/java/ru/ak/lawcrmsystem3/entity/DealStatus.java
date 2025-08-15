package ru.ak.lawcrmsystem3.entity;

import io.jmix.core.metamodel.datatype.EnumClass;

import org.springframework.lang.Nullable;


public enum DealStatus implements EnumClass<String> {


    OPENED("открыто"),
    IN_PROCESS("в_процессе"),
    CLOSED("завершено");

    private final String id;

    DealStatus(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public static DealStatus fromId(String id) {
        for (DealStatus at : DealStatus.values()) {
            if (at.getId().equals(id)) {
                return at;
            }
        }
        return null;
    }
}