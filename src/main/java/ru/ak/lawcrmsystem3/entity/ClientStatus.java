package ru.ak.lawcrmsystem3.entity;

import io.jmix.core.metamodel.datatype.EnumClass;

import org.springframework.lang.Nullable;


public enum ClientStatus implements EnumClass<String> {

    NEW("новый"),
    REGULAR("постоянный"),
    FORMER("бывший");

    private final String id;

    ClientStatus(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public static ClientStatus fromId(String id) {
        for (ClientStatus at : ClientStatus.values()) {
            if (at.getId().equals(id)) {
                return at;
            }
        }
        return null;
    }
}