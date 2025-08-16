package ru.ak.lawcrmsystem3.view.transcriptionrecord;

import com.vaadin.flow.component.combobox.ComboBox;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.html.Div;
import io.jmix.flowui.UiComponents;
import io.jmix.flowui.action.DialogAction;
import ru.ak.lawcrmsystem3.entity.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.router.Route;
import io.jmix.core.DataManager;
import io.jmix.core.FileRef;
import io.jmix.core.FileStorage;
import io.jmix.flowui.Dialogs;
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
import ru.ak.lawcrmsystem3.entity.Deal;
import ru.ak.lawcrmsystem3.entity.TranscriptionRecord;
import ru.ak.lawcrmsystem3.view.deal.DealListView;
import ru.ak.lawcrmsystem3.view.main.MainView;


import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

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
    //===============
    @ViewComponent
    private Button attachToDealButton; // Новый компонент для кнопки
    @Autowired
    private DataManager dataManager; // Для сохранения изменений
    @Autowired
    private Dialogs dialogs; // Для показа диалога выбора дела
    @Autowired
    private FileStorage fileStorage;
    @Autowired
    private UiComponents uiComponents;

    //===========
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

    @Subscribe("attachToDealButton")
    public void onAttachToDealButtonClick(final ClickEvent<Button> event) {
        TranscriptionRecord transcriptionRecord = transcriptionRecordDc.getItemOrNull();

        if (transcriptionRecord == null) {
            notifications.create("Не выбрана запись транскрипции").show();
            return;
        }

        if (transcriptionRecord.getTextContent() == null || transcriptionRecord.getTextContent().isEmpty()) {
            notifications.create("Текст транскрипции пуст").show();
            return;
        }

        // Загружаем список всех дел
        List<Deal> allDeals = dataManager.load(Deal.class).all().list();

        // Создаем выпадающий список
        ComboBox<Deal> dealComboBox = uiComponents.create(ComboBox.class);
        dealComboBox.setItems(allDeals);
        dealComboBox.setItemLabelGenerator(deal -> deal.getTitle() + " (" + deal.getDealNumber() + ")");
        dealComboBox.setWidthFull();

        // Создаем диалог с использованием ComboBox
        Dialog dialog = new Dialog();
        dialog.add(new Div(dealComboBox));
        dialog.setHeaderTitle("Выберите дело");
        dialog.setWidth("600px");

        Button okButton = new Button("OK", e -> {
            Deal selectedDeal = dealComboBox.getValue();
            if (selectedDeal != null) {
                createAndSaveDocument(transcriptionRecord, selectedDeal);
            }
            dialog.close();
        });

        Button cancelButton = new Button("Отмена", e -> dialog.close());
        dialog.getFooter().add(okButton, cancelButton);

        dialog.open();
    }

    private void createAndSaveDocument(TranscriptionRecord transcriptionRecord, Deal deal) {
        try {
            // Создаем временный файл с текстом транскрипции
            String fileName = "transcription_" + System.currentTimeMillis() + ".txt";
            byte[] contentBytes = transcriptionRecord.getTextContent().getBytes(StandardCharsets.UTF_8);

            // Сохраняем в файловое хранилище
            FileRef fileRef;
            try (InputStream inputStream = new ByteArrayInputStream(contentBytes)) {
                fileRef = fileStorage.saveStream(fileName, inputStream);
            }

            // Создаем новый документ
            Document document = dataManager.create(Document.class);
            document.setTitle("Текстовая версия телефонного разговора, добавленного " + transcriptionRecord.getCreatedDate());
            document.setFile(fileRef);
            document.setMimeType("text/plain");
            document.setDeal(deal);

            // Сохраняем документ
            dataManager.save(document);

            notifications.create("Транскрипция успешно добавлена в дело")
                    .withType(Notifications.Type.SUCCESS)
                    .show();
        } catch (Exception e) {
            log.error("Ошибка при добавлении транскрипции в дело", e);
            notifications.create("Ошибка при добавлении транскрипции в дело")
                    .withType(Notifications.Type.ERROR)
                    .show();
        }
    }

    private byte[] generatePdf(String text) throws Exception {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        com.lowagie.text.Document document = new com.lowagie.text.Document();
        PdfWriter.getInstance(document, outputStream);
        document.open();
        document.add(new Paragraph(text));
        document.close();
        return outputStream.toByteArray();
    }

}