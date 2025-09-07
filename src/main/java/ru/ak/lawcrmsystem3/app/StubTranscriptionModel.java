package ru.ak.lawcrmsystem3.app;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
@Profile("!transcription")
public class StubTranscriptionModel implements TranscriptionModel{

    private static final Logger log = LoggerFactory.getLogger(StubTranscriptionModel.class);

    @Override
    public String transcribe(File audioFile) {
        log.info("Используется заглушка для транскрибации. Возвращаем тестовый текст.");
        return "Тестовый текст транскрибации. Аудио файл: " + audioFile.getName();
    }
}
