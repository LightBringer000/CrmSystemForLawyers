package ru.ak.lawcrmsystem3.app;

import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.server.StreamResource;
import io.jmix.core.DataManager;
import io.jmix.core.FileStorage;
import io.jmix.flowui.Notifications;
import jakarta.annotation.PostConstruct;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.vosk.Model;
import org.vosk.Recognizer;
import ru.ak.lawcrmsystem3.entity.TranscriptionRecord;

import javax.sound.sampled.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.bytedeco.ffmpeg.global.avcodec;
import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.FFmpegFrameRecorder;
import org.bytedeco.javacv.Frame;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.html.IFrame;
import com.vaadin.flow.component.progressbar.ProgressBar;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.notification.Notification;

@Component
public class AudioTranscriptionService implements PdfService{

    private static final Logger log = LoggerFactory.getLogger(AudioTranscriptionService.class);
    @Autowired
    protected DataManager dataManager;

    public TranscriptionRecord saveRecord(TranscriptionRecord record) {
        return dataManager.save(record);
    }

    @Autowired
    private FileStorage fileStorage; // Jmix FileStorage

    @Autowired
    private Notifications notifications;

    private Model voskModel;

    @PostConstruct
    public void init() {
        try {
            voskModel = new Model("C:\\Users\\Flame\\IdeaProjects\\vosk-model-ru-0.22");
        } catch (Exception e) {
            log.error("Failed to load Vosk model", e);
        }
    }


    public TranscriptionRecord processAudio(InputStream audioStream) {
        TranscriptionRecord record = dataManager.create(TranscriptionRecord.class);
        record.setStatus("PROCESSING");

        File wavFile = null;
        try {
            wavFile = convertToWav(audioStream);

            String garbledText = transcribe(wavFile);
            String correctText = decodeGarbledText(garbledText); // Используем ваш метод для исправления
            record.setTextContent(correctText);
            byte[] pdfBytes = createPdfWithRussianFont(correctText);

            // Показываем PDF пользователю
            showPdfInDialog(pdfBytes);

            record.setStatus("COMPLETED");

        } catch (Exception e) {
            record.setStatus("FAILED");
            Notification.show("Ошибка при создании PDF: " + e.getMessage(),
                    5000, Notification.Position.BOTTOM_CENTER);
            log.error("PDF creation failed", e);
        } finally {
            if (wavFile != null) {
                try {
                    Files.deleteIfExists(wavFile.toPath());
                } catch (IOException e) {
                    log.warn("Failed to delete temporary file", e);
                }
            }
        }

        return dataManager.save(record);
    }

    public static String decodeGarbledText(String garbledText) {
        if (garbledText == null) return null;

        String[] encodings = {"UTF-8", "Windows-1251"};
        String currentText = garbledText;

        // Пробуем несколько комбинаций кодировок
        for (int i = 0; i < 3; i++) {
            for (String encoding : encodings) {
                try {
                    byte[] bytes = currentText.getBytes(encoding);
                    currentText = new String(bytes, StandardCharsets.UTF_8);

                    // Проверяем, появились ли русские буквы
                    if (currentText.matches(".*[а-яА-ЯёЁ]+.*")) {
                        return currentText;
                    }
                } catch (Exception ignored) {}
            }
        }

        return currentText; // Возвращаем последнюю попытку
    }

    @Override
    public byte[] createPdfWithRussianFont(String text) throws IOException {

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            // Загрузка шрифта из ресурсов
            InputStream fontStream = getClass().getResourceAsStream("/fonts/arial.ttf");
            if (fontStream == null) {
                throw new IOException("Russian font not found in resources");
            }

            PDType0Font font = PDType0Font.load(document, fontStream);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(font, 12);
                contentStream.newLineAtOffset(50, 700);
                contentStream.showText("Результат транскрибации:");
                contentStream.newLineAtOffset(0, -20);
                contentStream.setFont(font, 10);

                // Разбиваем текст на строки
                String[] lines = text.split("\n");
                for (String line : lines) {
                    if (line.isEmpty()) continue;

                    // Разбиваем длинные строки
                    List<String> wrappedLines = wrapText(line, 100);
                    for (String wrappedLine : wrappedLines) {
                        contentStream.showText(wrappedLine);
                        contentStream.newLineAtOffset(0, -15);
                    }
                }

                contentStream.endText(); // Важно закрыть text block
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    private byte[] createPdfContent(PDDocument document, PDPage page, PDFont font, String text) throws IOException {
        try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
            contentStream.beginText();
            contentStream.setFont(font, 12);
            contentStream.newLineAtOffset(50, 700);

            // Заголовок
            contentStream.showText("Результат транскрибации:");
            contentStream.newLineAtOffset(0, -25);

            // Основной текст
            contentStream.setFont(font, 10);
            String[] lines = text.split("\n");
            for (String line : lines) {
                if (line.isEmpty()) {
                    contentStream.newLineAtOffset(0, -15);
                    continue;
                }

                // Разбиваем длинные строки
                List<String> wrappedLines = wrapText(line, 100);
                for (String wrappedLine : wrappedLines) {
                    contentStream.showText(wrappedLine);
                    contentStream.newLineAtOffset(0, -15);
                }
            }

            contentStream.endText();
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        document.save(out);
        return out.toByteArray();
    }

    @Override
    public List<String> wrapText(String text, int maxLineLength) {
        List<String> lines = new ArrayList<>();
        if (text.length() <= maxLineLength) {
            lines.add(text);
            return lines;
        }

        int pos = 0;
        while (pos < text.length()) {
            int end = Math.min(pos + maxLineLength, text.length());
            lines.add(text.substring(pos, end));
            pos = end;
        }

        return lines;
    }

    @Override
    public void showPdfInDialog(byte[] pdfBytes) {
        // Создаем диалоговое окно
        Dialog dialog = new Dialog();
        dialog.setModal(true);
        dialog.setCloseOnEsc(true);
        dialog.setCloseOnOutsideClick(false);
        dialog.setWidth("900px");
        dialog.setHeight("700px");

        // Заголовок и индикатор загрузки
        dialog.setHeaderTitle("Подготовка документа...");
        ProgressBar progressBar = new ProgressBar();
        progressBar.setIndeterminate(true);
        dialog.add(progressBar);

        // Кнопка "Отмена" в футере
        Button cancelButton = new Button("Отмена", e -> dialog.close());
        dialog.getFooter().add(cancelButton);

        // Открываем диалог сразу
        dialog.open();

        // Загружаем PDF в фоне
        UI ui = UI.getCurrent();
        new Thread(() -> {
            try {
                // Имитация загрузки (можно удалить в реальном коде)
                Thread.sleep(800);

                ui.access(() -> {
                    try {
                        // Преобразуем PDF в base64
                        String base64Pdf = Base64.getEncoder().encodeToString(pdfBytes);
                        String pdfDataUrl = "data:application/pdf;base64," + base64Pdf;

                        // Создаем PDF-просмотрщик
                        IFrame pdfViewer = new IFrame(pdfDataUrl);
                        pdfViewer.setWidth("100%");
                        pdfViewer.setHeight("100%");
                        pdfViewer.getStyle().set("border", "none");

                        // Обновляем диалог
                        dialog.removeAll();
                        dialog.setHeaderTitle("Результат транскрибации");
                        dialog.add(pdfViewer);

                        // Заменяем кнопку "Отмена" на "Закрыть"
                        dialog.getFooter().removeAll();
                        Button closeButton = new Button("Закрыть", e -> dialog.close());
                        dialog.getFooter().add(closeButton);

                        // Добавляем кнопку скачивания
                        Button downloadButton = new Button("Скачать", e -> {
                            StreamResource resource = new StreamResource(
                                    "transcription_" + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + ".pdf",
                                    () -> new ByteArrayInputStream(pdfBytes)
                            );
                            UI.getCurrent().getPage().open(String.valueOf(resource), "_blank");
                        });
                        dialog.getFooter().add(downloadButton);

                    } catch (Exception e) {
                        dialog.close();
                        Notification.show("Ошибка при отображении PDF", 3000, Notification.Position.BOTTOM_CENTER);
                        log.error("PDF display error", e);
                    }
                });
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                ui.access(() -> {
                    dialog.close();
                    Notification.show("Процесс был прерван", 3000, Notification.Position.BOTTOM_CENTER);
                });
            }
        }).start();
    }


    private String transcribe(File audioFile) throws Exception {
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

    public File convertToWav(InputStream inputStream) throws IOException {
        log.info("Начинаем конвертацию аудио из InputStream.");

        // Создаём временный файл для входных данных
        File inputFile = File.createTempFile("audio-input-", ".tmp");
        log.debug("Создан временный входной файл: {}", inputFile.getAbsolutePath());

        try {
            Files.copy(inputStream, inputFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
            log.debug("Данные из InputStream скопированы во временный файл.");
        } catch (IOException e) {
            log.error("Ошибка при копировании данных во временный файл.", e);
            throw e;
        }

        // Выходной WAV-файл
        File wavFile = File.createTempFile("audio-", ".wav");
        log.debug("Создан временный выходной WAV-файл: {}", wavFile.getAbsolutePath());

        try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(inputFile);
             FFmpegFrameRecorder recorder = new FFmpegFrameRecorder(wavFile, 1)) {

            log.info("Инициализируем FFmpegFrameGrabber для входного файла.");
            grabber.start();
            log.info("Grabber успешно запущен. Длительность: {} секунд, частота дискретизации: {} Hz",
                    grabber.getLengthInTime() / 1_000_000.0, grabber.getSampleRate());

            log.info("Инициализируем FFmpegFrameRecorder для выходного файла.");
            recorder.setAudioChannels(1);
            recorder.setSampleRate(16000);
            recorder.setAudioCodec(avcodec.AV_CODEC_ID_PCM_S16LE);
            recorder.start();
            log.info("Recorder запущен. Настройки: каналы={}, частота={}, кодек={}",
                    recorder.getAudioChannels(), recorder.getSampleRate(), recorder.getAudioCodecName());

            Frame frame;
            int framesRecorded = 0;
            log.info("Начинаем захват и запись аудиофреймов.");
            while ((frame = grabber.grabFrame()) != null) {
                if (frame.samples != null) {
                    recorder.record(frame);
                    framesRecorded++;
                }
            }
            log.info("Записано {} аудиофреймов.", framesRecorded);
        } catch (Exception e) {
            log.error("Произошла ошибка при конвертации аудио.", e);
            // Важно повторно выбросить исключение, чтобы вызывающий метод мог его обработать
            throw new IOException("Ошибка конвертации аудио.", e);
        } finally {
            // Удаляем временный входной файл
            Files.deleteIfExists(inputFile.toPath());
            log.debug("Временный входной файл {} удалён.", inputFile.getAbsolutePath());
        }

        log.info("Конвертация успешно завершена. Результат сохранён в {}", wavFile.getAbsolutePath());
        return wavFile;
    }

}