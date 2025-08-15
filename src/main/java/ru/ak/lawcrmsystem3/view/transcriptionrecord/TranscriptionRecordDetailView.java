package ru.ak.lawcrmsystem3.view.transcriptionrecord;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.router.Route;
import io.jmix.flowui.Notifications;
import io.jmix.flowui.download.DownloadDataProvider;
import io.jmix.flowui.download.Downloader;
import io.jmix.flowui.model.InstanceContainer;
import io.jmix.flowui.model.InstanceLoader;
import io.jmix.flowui.view.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import ru.ak.lawcrmsystem3.app.AudioTranscriptionService;
import ru.ak.lawcrmsystem3.app.EmailReceiverService;
import ru.ak.lawcrmsystem3.entity.TranscriptionRecord;
import ru.ak.lawcrmsystem3.view.main.MainView;


import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

@Route(value = "transcription-records/:id", layout = MainView.class)
@ViewController(id = "TranscriptionRecord.detail")
@ViewDescriptor(path = "transcription-record-detail-view.xml")
@EditedEntityContainer("transcriptionRecordDc")
public class TranscriptionRecordDetailView extends StandardDetailView<TranscriptionRecord> {

    private static final Logger log = LoggerFactory.getLogger(TranscriptionRecordDetailView.class);


    @ViewComponent
    private Button downloadPdfButton;
    @ViewComponent
    private InstanceLoader<TranscriptionRecord> transcriptionRecordDl;
    @ViewComponent
    private InstanceContainer<TranscriptionRecord> transcriptionRecordDc;
    @Autowired
    private AudioTranscriptionService audioTranscriptionService;
    @Autowired
    private Notifications notifications;

    @Subscribe
    public void onBeforeShow(final BeforeShowEvent event) {
        // При загрузке представления, загружаем данные.
        // Data binding автоматически обновит поля.
        transcriptionRecordDl.load();
    }

    @Subscribe("downloadPdfButton")
    public void onDownloadPdfButtonClick(final ClickEvent<Button> event) {
        TranscriptionRecord transcriptionRecord = transcriptionRecordDc.getItemOrNull();

        if (transcriptionRecord == null) {
            notifications.create("No record selected").show();
            return;
        }

        if (transcriptionRecord.getTextContent() == null || transcriptionRecord.getTextContent().isEmpty()) {
            notifications.create("Text content is empty").show();
            return;
        }

        try {
            // Используем метод из сервиса для генерации PDF
            byte[] pdfBytes = audioTranscriptionService.createPdfWithRussianFont(transcriptionRecord.getTextContent());

            // Показываем PDF в диалоге (как в сервисе)
            audioTranscriptionService.showPdfInDialog(pdfBytes);

        } catch (Exception e) {
            log.error("PDF generation failed", e);
            notifications.create("Failed to generate PDF").show();
        }
    }

    private byte[] generatePdf(String text) throws Exception {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, outputStream);
        document.open();
        document.add(new Paragraph(text));
        document.close();
        return outputStream.toByteArray();
    }

}