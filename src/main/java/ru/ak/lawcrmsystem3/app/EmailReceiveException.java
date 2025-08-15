package ru.ak.lawcrmsystem3.app;

import org.springframework.stereotype.Component;


public class EmailReceiveException extends RuntimeException {
    public EmailReceiveException(String message, Throwable cause) {
        super(message, cause);
    }
}