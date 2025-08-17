package ru.ak.lawcrmsystem3.view.legaldocumentdata;

import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.dependency.CssImport;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.frontend.installer.FileDownloader;
import io.jmix.flowui.Notifications;
import io.jmix.flowui.component.richtexteditor.RichTextEditor;
import io.jmix.flowui.download.DownloadFormat;
import io.jmix.flowui.download.Downloader;
import io.jmix.flowui.view.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import ru.ak.lawcrmsystem3.app.DocumentGeneratorService;
import ru.ak.lawcrmsystem3.entity.LegalDocumentData;
import ru.ak.lawcrmsystem3.view.main.MainView;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Route(value = "legal-document-datas/:id", layout = MainView.class)
@ViewController(id = "LegalDocumentData.detail")
@ViewDescriptor(path = "legal-document-data-detail-view.xml")
@EditedEntityContainer("legalDocumentDataDc")
public class LegalDocumentDataDetailView extends StandardDetailView<LegalDocumentData> {

    @ViewComponent
    protected RichTextEditor toField;
    @ViewComponent
    protected RichTextEditor fromField;
    @ViewComponent
    protected RichTextEditor participantsField;
    @ViewComponent
    protected RichTextEditor otherInfoField;
    @ViewComponent
    protected RichTextEditor titleField;
    @ViewComponent
    protected RichTextEditor contentField;
    @ViewComponent
    protected RichTextEditor requestsField;
    @ViewComponent
    protected RichTextEditor attachmentsField;
    @ViewComponent
    protected RichTextEditor signatoriesField;

    @Autowired
    private DocumentGeneratorService documentGeneratorService;

    @Autowired
    private Notifications notifications;

    @Autowired
    private Downloader downloader;


    @Subscribe
    protected void onInit(InitEvent event) {
        toField.setValue("""
                <h1>H1</h1>
                <h2>H2</h2>
                <h3>H3</h3>
                <ul>
                <li><b>Bold</b></li>
                <li><i>Italic</i></li>
                <li><u>Underline</u></li>
                </ul>
                <ol>
                <li><s>Strikethrough</s></li>
                <li>Sub<sub>script</sub></li>
                <li>Super<sup>script</sup></li>
                <li><a href="https://www.jmix.io/" rel="nofollow">Link</a>
                </li>
                </ol>
                <pre>&lt;code-block/&gt;</pre>
                <blockquote>Blockquote</blockquote>
                """);
        fromField.setValue("""
                <h1>H1</h1>
                <h2>H2</h2>
                <h3>H3</h3>
                <ul>
                <li><b>Bold</b></li>
                <li><i>Italic</i></li>
                <li><u>Underline</u></li>
                </ul>
                <ol>
                <li><s>Strikethrough</s></li>
                <li>Sub<sub>script</sub></li>
                <li>Super<sup>script</sup></li>
                <li><a href="https://www.jmix.io/" rel="nofollow">Link</a>
                </li>
                </ol>
                <pre>&lt;code-block/&gt;</pre>
                <blockquote>Blockquote</blockquote>
                """);
        participantsField.setValue("""
                <h1>H1</h1>
                <h2>H2</h2>
                <h3>H3</h3>
                <ul>
                <li><b>Bold</b></li>
                <li><i>Italic</i></li>
                <li><u>Underline</u></li>
                </ul>
                <ol>
                <li><s>Strikethrough</s></li>
                <li>Sub<sub>script</sub></li>
                <li>Super<sup>script</sup></li>
                <li><a href="https://www.jmix.io/" rel="nofollow">Link</a>
                </li>
                </ol>
                <pre>&lt;code-block/&gt;</pre>
                <blockquote>Blockquote</blockquote>
                """);
        otherInfoField.setValue("""
                <h1>H1</h1>
                <h2>H2</h2>
                <h3>H3</h3>
                <ul>
                <li><b>Bold</b></li>
                <li><i>Italic</i></li>
                <li><u>Underline</u></li>
                </ul>
                <ol>
                <li><s>Strikethrough</s></li>
                <li>Sub<sub>script</sub></li>
                <li>Super<sup>script</sup></li>
                <li><a href="https://www.jmix.io/" rel="nofollow">Link</a>
                </li>
                </ol>
                <pre>&lt;code-block/&gt;</pre>
                <blockquote>Blockquote</blockquote>
                """);
        titleField.setValue("""
                <h1>H1</h1>
                <h2>H2</h2>
                <h3>H3</h3>
                <ul>
                <li><b>Bold</b></li>
                <li><i>Italic</i></li>
                <li><u>Underline</u></li>
                </ul>
                <ol>
                <li><s>Strikethrough</s></li>
                <li>Sub<sub>script</sub></li>
                <li>Super<sup>script</sup></li>
                <li><a href="https://www.jmix.io/" rel="nofollow">Link</a>
                </li>
                </ol>
                <pre>&lt;code-block/&gt;</pre>
                <blockquote>Blockquote</blockquote>
                """);
        contentField.setValue("""
                <h1>H1</h1>
                <h2>H2</h2>
                <h3>H3</h3>
                <ul>
                <li><b>Bold</b></li>
                <li><i>Italic</i></li>
                <li><u>Underline</u></li>
                </ul>
                <ol>
                <li><s>Strikethrough</s></li>
                <li>Sub<sub>script</sub></li>
                <li>Super<sup>script</sup></li>
                <li><a href="https://www.jmix.io/" rel="nofollow">Link</a>
                </li>
                </ol>
                <pre>&lt;code-block/&gt;</pre>
                <blockquote>Blockquote</blockquote>
                """);
        requestsField.setValue("""
                <h1>H1</h1>
                <h2>H2</h2>
                <h3>H3</h3>
                <ul>
                <li><b>Bold</b></li>
                <li><i>Italic</i></li>
                <li><u>Underline</u></li>
                </ul>
                <ol>
                <li><s>Strikethrough</s></li>
                <li>Sub<sub>script</sub></li>
                <li>Super<sup>script</sup></li>
                <li><a href="https://www.jmix.io/" rel="nofollow">Link</a>
                </li>
                </ol>
                <pre>&lt;code-block/&gt;</pre>
                <blockquote>Blockquote</blockquote>
                """);
        attachmentsField.setValue("""
                <h1>H1</h1>
                <h2>H2</h2>
                <h3>H3</h3>
                <ul>
                <li><b>Bold</b></li>
                <li><i>Italic</i></li>
                <li><u>Underline</u></li>
                </ul>
                <ol>
                <li><s>Strikethrough</s></li>
                <li>Sub<sub>script</sub></li>
                <li>Super<sup>script</sup></li>
                <li><a href="https://www.jmix.io/" rel="nofollow">Link</a>
                </li>
                </ol>
                <pre>&lt;code-block/&gt;</pre>
                <blockquote>Blockquote</blockquote>
                """);
        signatoriesField.setValue("""
                <h1>H1</h1>
                <h2>H2</h2>
                <h3>H3</h3>
                <ul>
                <li><b>Bold</b></li>
                <li><i>Italic</i></li>
                <li><u>Underline</u></li>
                </ul>
                <ol>
                <li><s>Strikethrough</s></li>
                <li>Sub<sub>script</sub></li>
                <li>Super<sup>script</sup></li>
                <li><a href="https://www.jmix.io/" rel="nofollow">Link</a>
                </li>
                </ol>
                <pre>&lt;code-block/&gt;</pre>
                <blockquote>Blockquote</blockquote>
                """);
    }

//    @Subscribe("generateDocumentBtn")
//    public void onGenerateDocumentBtnClick(ClickEvent<Button> event) {
//        try {
//            LegalDocumentData documentData = getEditedEntity();
//
//            // Извлекаем HTML-содержимое из RichTextEditor'ов
//            String toHtml = toField.getValue();
//            String fromHtml = fromField.getValue();
//            String participantsHtml = participantsField.getValue();
//            String otherInfoHtml = otherInfoField.getValue();
//            String titleHtml = titleField.getValue();
//            String contentHtml = contentField.getValue();
//            String requestsHtml = requestsField.getValue();
//            String attachmentsHtml = attachmentsField.getValue();
//            String signatoriesHtml = signatoriesField.getValue();
//
//            // Удаляем HTML-теги перед сохранением в entity
//            documentData.setTo(stripHtmlTags(toHtml));
//            documentData.setFrom(stripHtmlTags(fromHtml));
//            documentData.setParticipants(stripHtmlTags(participantsHtml));
//            documentData.setOtherInfo(stripHtmlTags(otherInfoHtml));
//            documentData.setTitle(stripHtmlTags(titleHtml));
//            documentData.setContent(stripHtmlTags(contentHtml));
//            documentData.setRequests(stripHtmlTags(requestsHtml));
//            documentData.setAttachments(stripHtmlTags(attachmentsHtml));
//            documentData.setSignatories(stripHtmlTags(signatoriesHtml));
//
//
//            // Генерируем временный файл
//            String fileName = generateFileName(documentData);
//            Path tempFile = Files.createTempFile("law_doc_", ".docx");
//
//            // Генерируем документ
//            documentGeneratorService.generateLegalDocument(documentData, tempFile.toString());
//
//            // Предлагаем скачать
//            downloader.download(
//                    Files.readAllBytes(tempFile),
//                    fileName,
//                    DownloadFormat.DOCX
//            );
//
//            notifications.create("Документ успешно сгенерирован")
//                    .show();
//
//        } catch (IOException e) {
//            notifications.create("Ошибка при генерации документа: " + e.getMessage())
//                    .show();
//            e.printStackTrace();
//        }
//    }

    @Subscribe("generateDocumentBtn")
    public void onGenerateDocumentBtnClick(ClickEvent<Button> event) {
        try {
            LegalDocumentData documentData = getEditedEntity();

            // Извлекаем HTML-содержимое из RichTextEditor'ов
            String toHtml = toField.getValue();
            String fromHtml = fromField.getValue();
            String participantsHtml = participantsField.getValue();
            String otherInfoHtml = otherInfoField.getValue();
            String titleHtml = titleField.getValue();
            String contentHtml = contentField.getValue();
            String requestsHtml = requestsField.getValue();
            String attachmentsHtml = attachmentsField.getValue();
            String signatoriesHtml = signatoriesField.getValue();

            // ⚠️ Ключевое изменение: НЕ удаляем HTML-теги для поля content.
            // Передаем полный HTML в сервис.
            documentData.setContent(contentHtml);

            // Для остальных полей, где изображения не ожидаются,
            // оставляем удаление тегов.
            documentData.setTo(stripHtmlTags(toHtml));
            documentData.setFrom(stripHtmlTags(fromHtml));
            documentData.setParticipants(stripHtmlTags(participantsHtml));
            documentData.setOtherInfo(stripHtmlTags(otherInfoHtml));
            documentData.setTitle(stripHtmlTags(titleHtml));
            documentData.setRequests(stripHtmlTags(requestsHtml));
            documentData.setAttachments(stripHtmlTags(attachmentsHtml));
            documentData.setSignatories(stripHtmlTags(signatoriesHtml));


            // Генерируем временный файл
            String fileName = generateFileName(documentData);
            Path tempFile = Files.createTempFile("law_doc_", ".docx");

            // Генерируем документ
            documentGeneratorService.generateLegalDocument(documentData, tempFile.toString());

            // Предлагаем скачать
            downloader.download(
                    Files.readAllBytes(tempFile),
                    fileName,
                    DownloadFormat.DOCX
            );

            notifications.create("Документ успешно сгенерирован")
                    .show();

        } catch (IOException e) {
            notifications.create("Ошибка при генерации документа: " + e.getMessage())
                    .show();
            e.printStackTrace();
        }
    }

//    @Subscribe("generateDocumentBtn")
//    public void onGenerateDocumentBtnClick(ClickEvent<Button> event) {
//        try {
//            LegalDocumentData documentData = getEditedEntity();
//
//            // Извлекаем HTML-содержимое из RichTextEditor'ов
//            String toHtml = toField.getValue();
//            String fromHtml = fromField.getValue();
//            String participantsHtml = participantsField.getValue();
//            String otherInfoHtml = otherInfoField.getValue();
//            String titleHtml = titleField.getValue();
//            String contentHtml = contentField.getValue();
//            String requestsHtml = requestsField.getValue();
//            String attachmentsHtml = attachmentsField.getValue();
//            String signatoriesHtml = signatoriesField.getValue();
//
//            // Вместо удаления HTML-тегов, сохраняйте полное HTML-содержимое для поля content
//            documentData.setTo(stripHtmlTags(toHtml));
//            documentData.setFrom(stripHtmlTags(fromHtml));
//            documentData.setParticipants(stripHtmlTags(participantsHtml));
//            documentData.setOtherInfo(stripHtmlTags(otherInfoHtml));
//            documentData.setTitle(stripHtmlTags(titleHtml));
//            // ➡️ Вот ключевое изменение: передаём contentHtml напрямую
//            documentData.setContent(contentHtml);
//            documentData.setRequests(stripHtmlTags(requestsHtml));
//            documentData.setAttachments(stripHtmlTags(attachmentsHtml));
//            documentData.setSignatories(stripHtmlTags(signatoriesHtml));
//
//            // Дальнейший код остаётся без изменений...
//            String fileName = generateFileName(documentData);
//            Path tempFile = Files.createTempFile("law_doc_", ".docx");
//
//            documentGeneratorService.generateLegalDocument(documentData, tempFile.toString());
//
//            downloader.download(
//                    Files.readAllBytes(tempFile),
//                    fileName,
//                    DownloadFormat.DOCX
//            );
//
//            notifications.create("Документ успешно сгенерирован")
//                    .show();
//
//        } catch (IOException e) {
//            notifications.create("Ошибка при генерации документа: " + e.getMessage())
//                    .show();
//            e.printStackTrace();
//        }
//    }

    /**
     * Вспомогательный метод для удаления HTML-тегов из строки.
     * Используется регулярное выражение для удаления всех тегов <...>
     * и замены HTML-сущностей на соответствующие символы.
     *
     * @param htmlString Строка, содержащая HTML-разметку.
     * @return Строка без HTML-тегов.
     */
    private String stripHtmlTags(String htmlString) {
        if (htmlString == null || htmlString.isEmpty()) {
            return "";
        }
        // Удаляем все HTML-теги, включая атрибуты.
        // Пример: <p style="color:red;"> -> ""
        String noTags = htmlString.replaceAll("<[^>]*>", "");

        // Заменяем HTML-сущности на обычные символы (например, &amp; на &, &lt; на < и т.д.)
        // Это простой способ, для более полного списка сущностей может потребоваться библиотека Apache Commons Text.
        noTags = noTags.replace("&amp;", "&");
        noTags = noTags.replace("&lt;", "<");
        noTags = noTags.replace("&gt;", ">");
        noTags = noTags.replace("&nbsp;", " ");
        noTags = noTags.replace("&quot;", "\"");
        noTags = noTags.replace("&apos;", "'");
        // Можно добавить другие часто встречающиеся сущности, если необходимо.

        return noTags.trim(); // Удаляем пробелы в начале и конце
    }


    private String generateFileName(LegalDocumentData documentData) {
        String title = documentData.getTitle() != null ? documentData.getTitle() : "Без названия";

        // Заменяем все запрещенные символы на символ подчеркивания
        // Учитываем, что title теперь может быть получен из RichTextEditor,
        // но stripHtmlTags() уже позаботится об удалении HTML.
        String cleanedTitle = title.replaceAll("[\\\\/:*?\"<>|]", "_");

        return String.format("Документ_%s_%s.docx",
                cleanedTitle,
                LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")));
    }

}