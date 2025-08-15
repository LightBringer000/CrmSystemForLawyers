package ru.ak.lawcrmsystem3.view.document;

import com.vaadin.flow.component.*;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.IFrame;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.progressbar.ProgressBar;
import com.vaadin.flow.router.Route;
import io.jmix.core.FileRef;
import io.jmix.core.FileStorage;
import io.jmix.flowui.component.upload.FileStorageUploadField;
import io.jmix.flowui.download.Downloader;
import io.jmix.flowui.model.InstanceContainer;
import io.jmix.flowui.view.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import ru.ak.lawcrmsystem3.app.DocToPdfConverter;
import ru.ak.lawcrmsystem3.entity.Document;
import ru.ak.lawcrmsystem3.view.main.MainView;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Scanner;

@Route(value = "documents/:id", layout = MainView.class)
@ViewController(id = "Document.detail")
@ViewDescriptor(path = "document-detail-view.xml")
@EditedEntityContainer("documentDc")
public class DocumentDetailView extends StandardDetailView<Document> {

    private static final Logger logger = LoggerFactory.getLogger(DocumentDetailView.class);

    @ViewComponent
    private InstanceContainer<Document> documentDc;

    @ViewComponent
    private Button viewFileButton;

    @ViewComponent
    private FileStorageUploadField fileField;

    @Autowired
    private Downloader downloader;

    @Autowired
    private FileStorage fileStorage;

    @Autowired
    private DocToPdfConverter docToPdfConverter; // Собственный сервис для конвертации

    @Subscribe
    public void onInit(final InitEvent event) {
        updateViewFileButtonVisibility();
    }

    @Subscribe(id = "documentDc", target = Target.DATA_CONTAINER)
    public void onDocumentDcItemPropertyChange(InstanceContainer.ItemPropertyChangeEvent<Document> event) {
        if ("file".equals(event.getProperty())) {
            updateViewFileButtonVisibility();
        }
    }

    @Subscribe(id = "documentDc", target = Target.DATA_CONTAINER)
    public void onDocumentDcItemChange(InstanceContainer.ItemChangeEvent<Document> event) {
        updateViewFileButtonVisibility();
    }

    private void updateViewFileButtonVisibility() {
        Document document = documentDc.getItemOrNull();
        boolean hasFile = document != null && document.getFile() != null;
        viewFileButton.setEnabled(hasFile);
    }

    @Subscribe("viewFileButton")
    public void onViewFileButtonClick(final ClickEvent<Button> event) {
        try {
            Document document = documentDc.getItemOrNull();
            if (document == null || document.getFile() == null) {
                logger.warn("Документ или файл документа равен null");
                Notification.show("Нет файла для просмотра.");
                return;
            }

            FileRef fileRef = document.getFile();
            String mimeType = document.getMimeType();
            String fileName = fileRef.getFileName();

            // Корректируем MIME-тип
            if (mimeType == null || "application/octet-stream".equals(mimeType)) {
                mimeType = guessMimeType(fileName);
            }

            if (isWordDocument(mimeType)) {
                openDocFileLocally(fileRef);
            } else if (isTextFile(mimeType, fileName)) {
                openTextFileLocally(fileRef);
            } else if (isVideoFile(mimeType, fileName)) {
                openVideoFile(fileRef);
            } else if (isAudioFile(mimeType, fileName)) {  // Новая проверка для аудио
                openAudioFile(fileRef);
            } else {
                downloader.download(fileRef);
            }
        } catch (Exception e) {
            logger.error("Ошибка при обработке файла", e);
            Notification.show("Ошибка при обработке файла: " + e.getMessage());
        }
    }

    private String guessMimeType(String fileName) {
        if (fileName == null) return "application/octet-stream";

        String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        return switch (extension) {
            // Существующие типы
            case "txt" -> "text/plain";
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "pdf" -> "application/pdf";
            case "mp4" -> "video/mp4";
            case "webm" -> "video/webm";
            // Аудио форматы
            case "mp3" -> "audio/mpeg";
            case "wav" -> "audio/wav";
            case "ogg" -> "audio/ogg";  // Обратите внимание: .ogg может быть и видео, и аудио
            case "m4a" -> "audio/mp4";
            case "flac" -> "audio/flac";
            case "aac" -> "audio/aac";
            default -> "application/octet-stream";
        };
    }

    private void openDocFileLocally(FileRef fileRef) {
        try (InputStream fileContent = fileStorage.openStream(fileRef)) {
            // Конвертируем DOCX в PDF
            byte[] pdfBytes = docToPdfConverter.convertToPdf(fileContent);

            // Показываем PDF в диалоговом окне
            showPdfInDialog(pdfBytes);

        } catch (Exception e) {
            logger.error("Ошибка при открытии файла", e);
            Notification.show("Ошибка при открытии файла: " + e.getMessage());
        }
    }

    private void showPdfInDialog(byte[] pdfBytes) {

        Dialog dialog = new Dialog();
        dialog.setModal(true);
        dialog.setHeaderTitle("Загрузка документа...");

        ProgressBar progressBar = new ProgressBar();
        progressBar.setIndeterminate(true);
        dialog.add(progressBar);

        // Открываем диалог сразу
        dialog.open();

        // Загружаем PDF в фоне
        UI ui = UI.getCurrent();
        new Thread(() -> {
            try {
                // Имитация загрузки (можно удалить в реальном коде)
                Thread.sleep(1000);

                ui.access(() -> {
                    dialog.removeAll();
                    dialog.setHeaderTitle("Просмотр документа");

                    String base64Pdf = Base64.getEncoder().encodeToString(pdfBytes);
                    IFrame pdfViewer = new IFrame("data:application/pdf;base64," + base64Pdf);
                    pdfViewer.setWidth("800px");
                    pdfViewer.setHeight("600px");
                    dialog.add(pdfViewer);

                    Button closeButton = new Button("Закрыть", e -> dialog.close());
                    dialog.getFooter().add(closeButton);
                });
            } catch (Exception e) {
                ui.access(() -> {
                    Notification.show("Ошибка: " + e.getMessage(), 5000, Notification.Position.BOTTOM_CENTER);
                    dialog.close();
                });
            }
        }).start();
    }

    private void openTextFileLocally(FileRef fileRef) {
        try {
            logger.info("Открытие текстового файла {}", fileRef.getFileName());

            // Проверки доступности файла
            if (fileStorage == null) {
                throw new IllegalStateException("FileStorage не доступен");
            }
            if (!fileStorage.fileExists(fileRef)) {
                throw new FileNotFoundException("Файл не найден в хранилище");
            }

            // Чтение содержимого файла
            String content;
            try (InputStream is = fileStorage.openStream(fileRef);
                 Scanner scanner = new Scanner(is, StandardCharsets.UTF_8)) {
                content = scanner.useDelimiter("\\A").next();
            }

            // Создание диалога с текстом
            showTextInDialog(content, fileRef.getFileName());

        } catch (Exception e) {
            logger.error("Ошибка при открытии текстового файла", e);
            Notification.show("Ошибка: " + e.getMessage());
        }
    }

//    private void showTextInDialog(String content, String fileName) {
//        Dialog dialog = new Dialog();
//        dialog.setModal(true);
//        dialog.setResizable(true);
//        dialog.setWidth("800px");
//        dialog.setHeight("600px");
//        dialog.setHeaderTitle(fileName);
//
//        // Основной контент с прокруткой
//        Div contentDiv = new Div();
//        contentDiv.setText(content);
//        contentDiv.getStyle()
//                .set("white-space", "pre-wrap")
//                .set("font-family", "monospace")
//                .set("overflow", "auto")
//                .set("height", "100%");
//
//        // Контейнер с padding
//        Div container = new Div(contentDiv);
//        container.setSizeFull();
//        container.getStyle()
//                .set("padding", "15px");
//
//        dialog.add(container);
//
//        // Кнопка закрытия
//        Button closeButton = new Button("Закрыть", e -> dialog.close());
//        dialog.getFooter().add(closeButton);
//
//        // Кнопка копирования
//        Button copyButton = new Button("Копировать", e -> {
//            UI.getCurrent().getPage().executeJs(
//                    "navigator.clipboard.writeText($0).then(() => $1.show())",
//                    content,
//                    new Text("Текст скопирован в буфер обмена")
//            );
//        });
//        dialog.getFooter().add(copyButton);
//
//        dialog.open();
//    }

    private void openVideoFile(FileRef fileRef) {
        try {
            logger.info("Открытие видеофайла {}", fileRef.getFileName());

            long fileSize = getFileSize(fileRef);
            if (fileSize > 20 * 1024 * 1024) {
                Notification.show("Видеофайл слишком большой для просмотра. Скачайте его.");
                downloader.download(fileRef);
                return;
            }

            // Проверки доступности файла
            if (fileStorage == null) {
                throw new IllegalStateException("FileStorage не доступен");
            }
            if (!fileStorage.fileExists(fileRef)) {
                throw new FileNotFoundException("Файл не найден в хранилище");
            }

            // Получаем MIME-тип
            String mimeType = documentDc.getItem().getMimeType();
            if (mimeType == null || "application/octet-stream".equals(mimeType)) {
                mimeType = guessMimeType(fileRef.getFileName());
            }

            // Читаем файл в байтовый массив
            byte[] videoBytes;
            try (InputStream is = fileStorage.openStream(fileRef);
                 ByteArrayOutputStream os = new ByteArrayOutputStream()) {
                is.transferTo(os);
                videoBytes = os.toByteArray();
            }

            // Создаем Data URL для видео
            String base64Video = Base64.getEncoder().encodeToString(videoBytes);
            String dataUrl = "data:" + mimeType + ";base64," + base64Video;

            // Создаем диалог с видео
            showVideoInDialog(dataUrl, fileRef.getFileName());

        } catch (Exception e) {
            logger.error("Ошибка при открытии видеофайла", e);
            Notification.show("Ошибка при открытии видео: " + e.getMessage());
        }
    }

    private void openAudioFile(FileRef fileRef) {
        try {
            logger.info("Открытие аудиофайла {}", fileRef.getFileName());

            long fileSize = getFileSize(fileRef);
            if (fileSize > 10 * 1024 * 1024) {
                Notification.show("Аудиофайл слишком большой для прослушивания. Скачайте его.");
                downloader.download(fileRef);
                return;
            }

            // Проверки доступности файла
            if (fileStorage == null) {
                throw new IllegalStateException("FileStorage не доступен");
            }
            if (!fileStorage.fileExists(fileRef)) {
                throw new FileNotFoundException("Файл не найден в хранилище");
            }

            // Получаем MIME-тип
            String mimeType = documentDc.getItem().getMimeType();
            if (mimeType == null || "application/octet-stream".equals(mimeType)) {
                mimeType = guessMimeType(fileRef.getFileName());
            }

            // Читаем файл в байтовый массив
            byte[] audioBytes;
            try (InputStream is = fileStorage.openStream(fileRef);
                 ByteArrayOutputStream os = new ByteArrayOutputStream()) {
                is.transferTo(os);
                audioBytes = os.toByteArray();
            }

            // Создаем Data URL для аудио
            String base64Audio = Base64.getEncoder().encodeToString(audioBytes);
            String dataUrl = "data:" + mimeType + ";base64," + base64Audio;

            // Создаем диалог с аудиоплеером
            showAudioInDialog(dataUrl, fileRef.getFileName());

        } catch (Exception e) {
            logger.error("Ошибка при открытии аудиофайла", e);
            Notification.show("Ошибка при открытии аудио: " + e.getMessage());
        }
    }

    private void showAudioInDialog(String audioDataUrl, String fileName) {
        Dialog dialog = new Dialog();
        dialog.setModal(true);
        dialog.setResizable(false);
        dialog.setWidth("500px");
        dialog.setHeight("200px");
        dialog.setHeaderTitle("Прослушивание: " + fileName);

        // Создаем HTML-компонент с аудиоплеером
        String audioHtml = String.format(
                "<div style='width:100%%; height:100%%; padding:20px;'>" +
                        "<audio controls autoplay style='width:100%%'>" +
                        "<source src='%s' type='%s'>" +
                        "Ваш браузер не поддерживает аудио элемент." +
                        "</audio>" +
                        "</div>",
                audioDataUrl,
                guessMimeType(fileName)
        );

        Html audioPlayer = new Html(audioHtml);

        // Основной лэйаут
        VerticalLayout layout = new VerticalLayout(audioPlayer);
        layout.setSizeFull();
        layout.setPadding(false);
        layout.setSpacing(false);

        // Кнопка закрытия
        Button closeButton = new Button("Закрыть", e -> dialog.close());
        dialog.getFooter().add(closeButton);

        // Добавляем лэйаут в диалог
        dialog.add(layout);
        dialog.open();
    }

    private long getFileSize(FileRef fileRef) throws IOException {
        try (InputStream is = fileStorage.openStream(fileRef)) {
            return is.available();
        }
    }

    private void showVideoInDialog(String videoDataUrl, String fileName) {
        Dialog dialog = new Dialog();
        dialog.setModal(true);
        dialog.setResizable(true);
        dialog.setWidth("800px");
        dialog.setHeight("650px");
        dialog.setHeaderTitle("Просмотр видео: " + fileName);

        // Создаем HTML-компонент с видеоплеером
        String videoHtml = String.format(
                "<div style='width:100%%; height:100%%; background:black;'>" +
                        "<video width='100%%' height='100%%' controls autoplay>" +
                        "<source src='%s' type='%s'>" +
                        "Ваш браузер не поддерживает воспроизведение видео." +
                        "</video>" +
                        "</div>",
                videoDataUrl,
                guessMimeType(fileName)
        );

        Html videoPlayer = new Html(videoHtml);

        // Основной лэйаут
        VerticalLayout layout = new VerticalLayout(videoPlayer);
        layout.setSizeFull();
        layout.setPadding(false);
        layout.setSpacing(false);

        // Кнопка закрытия
        Button closeButton = new Button("Закрыть", e -> dialog.close());
        dialog.getFooter().add(closeButton);

        // Добавляем лэйаут в диалог
        dialog.add(layout);
        dialog.open();
    }

    private String createHtmlViewer(String textContent, String fileName) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <title>" + escapeHtml(fileName) + "</title>\n" +
                "    <style>\n" +
                "        body { font-family: monospace; white-space: pre-wrap; margin: 20px; }\n" +
                "        .toolbar { margin-bottom: 10px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "<div class=\"toolbar\">\n" +
                "    <button onclick=\"window.close()\">Закрыть</button>\n" +
                "</div>\n" +
                escapeHtml(textContent) + "\n" +
                "</body>\n" +
                "</html>";
    }


    private String escapeHtml(String input) {
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private void openInBrowser(File file) {
        try {
            String fileUrl = file.toURI().toString();
            UI.getCurrent().getPage().open(fileUrl
            );
        } catch (Exception e) {
            logger.error("Ошибка при открытии файла в браузере", e);
            Notification.show("Ошибка при открытии файла");
        }
    }

    private boolean isWordDocument(String mimeType) {
        boolean isWord = mimeType != null &&
                (mimeType.startsWith("application/msword") ||
                        mimeType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));

        logger.debug("Проверка MIME-типа: {} -> isWord={}", mimeType, isWord);
        return isWord;
    }
    private boolean isTextFile(String mimeType, String fileName) {
        if (mimeType == null) {
            mimeType = guessMimeType(fileName);
        }

        // Проверяем по расширению, если MIME-тип generic
        if ("application/octet-stream".equals(mimeType) && fileName != null) {
            String ext = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
            return "txt".equals(ext);
        }

        return mimeType.startsWith("text/");
    }

    private boolean isVideoFile(String mimeType, String fileName) {
        if (mimeType == null) {
            mimeType = guessMimeType(fileName);
        }

        return mimeType.startsWith("video/");
    }

    private boolean isAudioFile(String mimeType, String fileName) {
        if (mimeType == null) {
            mimeType = guessMimeType(fileName);
        }
        return mimeType.startsWith("audio/");
    }

    private void showTextInDialog(String content, String fileName) {
        Dialog dialog = new Dialog();
        dialog.setModal(true);
        dialog.setResizable(true);
        dialog.setWidth("900px");
        dialog.setHeight("700px");
        dialog.setHeaderTitle(fileName);

        // Создаем Div с содержимым
        Div contentDiv = new Div();
        contentDiv.setText(content);
        contentDiv.getStyle()
                .set("white-space", "pre-wrap") // Сохраняем переносы строк
                .set("font-family", "monospace") // Моноширинный шрифт
                .set("overflow", "auto") // Добавляем прокрутку при необходимости
                .set("height", "100%") // Занимаем все доступное пространство
                .set("padding", "10px")
                .set("background-color", "var(--lumo-base-color)");

        // Создаем основной контейнер
        VerticalLayout mainLayout = new VerticalLayout();
        mainLayout.setSizeFull();
        mainLayout.setSpacing(false);
        mainLayout.setPadding(false);
        mainLayout.add(contentDiv);

        // Добавляем контейнер в диалог
        dialog.add(mainLayout);

        // Кнопка закрытия
        Button closeButton = new Button("Закрыть", e -> dialog.close());
        dialog.getFooter().add(closeButton);

        // Открываем диалог
        dialog.open();
    }

}