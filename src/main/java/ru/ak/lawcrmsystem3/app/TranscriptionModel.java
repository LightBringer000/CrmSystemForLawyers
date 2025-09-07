package ru.ak.lawcrmsystem3.app;

import java.io.File;

public interface TranscriptionModel {

    String transcribe(File audioFile) throws Exception;
}
