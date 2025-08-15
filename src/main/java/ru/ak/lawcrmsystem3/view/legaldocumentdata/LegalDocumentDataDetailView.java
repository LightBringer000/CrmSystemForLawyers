package ru.ak.lawcrmsystem3.view.legaldocumentdata;

import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.dependency.CssImport;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.frontend.installer.FileDownloader;
import io.jmix.flowui.Notifications;
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


    @Autowired
    private DocumentGeneratorService documentGeneratorService;

    @Autowired
    private Notifications notifications;

    @Autowired
    private Downloader downloader;

    @Subscribe("generateDocumentBtn")
    public void onGenerateDocumentBtnClick(ClickEvent<Button> event) {
        try {
            LegalDocumentData documentData = getEditedEntity();

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

    private String generateFileName(LegalDocumentData documentData) {
        return String.format("Документ_%s_%s.docx",
                documentData.getTitle() != null ? documentData.getTitle() : "Без названия",
                LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")));
    }

}