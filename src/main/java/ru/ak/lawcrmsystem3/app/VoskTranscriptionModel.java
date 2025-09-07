package ru.ak.lawcrmsystem3.app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.vosk.Model;
import org.vosk.Recognizer;

import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

@Service
@Profile("transcription")
public class VoskTranscriptionModel implements TranscriptionModel{

    private static final Logger log = LoggerFactory.getLogger(VoskTranscriptionModel.class);


    private Model voskModel;

    @PostConstruct
    public void init() {
        try {
            // Путь можно вынести в application.properties
            voskModel = new Model("C:\\Users\\Flame\\IdeaProjects\\vosk-model-ru-0.22");
        } catch (Exception e) {
            // Вместо простого лога лучше выбросить исключение, чтобы приложение не стартовало без модели
            throw new IllegalStateException("Failed to load Vosk model", e);
        }
    }

    @Override
    public String transcribe(File audioFile) throws Exception {
        try (AudioInputStream ais = AudioSystem.getAudioInputStream(audioFile);
             Recognizer recognizer = new Recognizer(voskModel, 16000)) {

            byte[] buffer = new byte[4096];
            int bytesRead;
            StringBuilder result = new StringBuilder();
            ObjectMapper mapper = new ObjectMapper();

            while ((bytesRead = ais.read(buffer)) >= 0) {
                if (recognizer.acceptWaveForm(buffer, bytesRead)) {
                    String voskResultJson = recognizer.getResult();

                    // Явно декодируем JSON-строку, используя кодировку Windows-1251
                    byte[] jsonBytes = voskResultJson.getBytes("windows-1251");
                    String decodedJsonString = new String(jsonBytes, StandardCharsets.UTF_8);

                    JsonNode rootNode = mapper.readTree(decodedJsonString);
                    String partialText = rootNode.path("text").asText();
                    result.append(partialText).append(" ");
                }
            }

            String voskFinalResultJson = recognizer.getFinalResult();

            // Явно декодируем финальную JSON-строку, используя кодировку Windows-1251
            byte[] finalJsonBytes = voskFinalResultJson.getBytes("windows-1251");
            String finalDecodedJsonString = new String(finalJsonBytes, StandardCharsets.UTF_8);

            JsonNode finalNode = mapper.readTree(finalDecodedJsonString);
            String finalText = finalNode.path("text").asText();
            result.append(finalText);

            String finalTranscription = result.toString().trim();

            // Логируем сырые байты для диагностики
            log.debug("Raw bytes: {}", Arrays.toString(finalTranscription.getBytes(StandardCharsets.UTF_8)));

            return finalTranscription;
        }
    }
}
