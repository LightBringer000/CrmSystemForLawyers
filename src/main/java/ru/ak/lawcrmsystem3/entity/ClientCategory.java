package ru.ak.lawcrmsystem3.entity;

import io.jmix.core.metamodel.datatype.EnumClass;

import org.springframework.lang.Nullable;


public enum ClientCategory implements EnumClass<String> {

    INDIVIDUAL("Физическое_лицо"),
    ENTREPRENEUR("Индивидуальный_предприниматель"),
    LEGAL_ENTITY("Юридическое_лицо"),
    CORPORATE_CLIEN("Корпоративный_клиент");

    private final String id;

    ClientCategory(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public static ClientCategory fromId(String id) {
        for (ClientCategory at : ClientCategory.values()) {
            if (at.getId().equals(id)) {
                return at;
            }
        }
        return null;
    }
}