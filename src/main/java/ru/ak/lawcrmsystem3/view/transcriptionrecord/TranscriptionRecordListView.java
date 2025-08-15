package ru.ak.lawcrmsystem3.view.transcriptionrecord;

import com.vaadin.flow.component.upload.SucceededEvent;
import com.vaadin.flow.router.Route;
import io.jmix.core.FileRef;
import io.jmix.core.FileStorage;
import io.jmix.flowui.Notifications;
import io.jmix.flowui.component.grid.DataGrid;
import io.jmix.flowui.component.upload.FileStorageUploadField;
import io.jmix.flowui.download.Downloader;
import io.jmix.flowui.kit.component.upload.event.FileUploadSucceededEvent;
import io.jmix.flowui.model.CollectionLoader;
import io.jmix.flowui.view.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import ru.ak.lawcrmsystem3.app.AudioTranscriptionService;
import ru.ak.lawcrmsystem3.entity.TranscriptionRecord;
import ru.ak.lawcrmsystem3.view.kanban.KanbanView;
import ru.ak.lawcrmsystem3.view.main.MainView;

import java.io.BufferedInputStream;
import java.io.FileDescriptor;
import java.io.InputStream;


@Route(value = "transcription-records", layout = MainView.class)
@ViewController(id = "TranscriptionRecord.list")
@ViewDescriptor(path = "transcription-record-list-view.xml")
@LookupComponent("transcriptionRecordsDataGrid")
@DialogMode(width = "64em")
public class TranscriptionRecordListView extends StandardListView<TranscriptionRecord> {

    private static final Logger log = LoggerFactory.getLogger(TranscriptionRecordListView.class);


    @ViewComponent
    private FileStorageUploadField fileUpload;

    @ViewComponent
    private DataGrid<TranscriptionRecord> transcriptionRecordsDataGrid;

    @ViewComponent
    private CollectionLoader<TranscriptionRecord> transcriptionRecordsDl;

    @Autowired
    private AudioTranscriptionService transcriptionService;

    @Autowired
    private Notifications notifications;

    @Autowired
    private FileStorage fileStorage;

    @Subscribe
    public void onInit(InitEvent event) {
        //fileUpload.setAcceptedFileTypes("audio/mpeg", "audio/wav", "audio/ogg");
        fileUpload.setAcceptedFileTypes("audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a");
        fileUpload.setMaxFileSize(10 * 1024 * 1024); // 10 MB
    }

    @Subscribe("fileUpload")
    public void onFileUpload(FileUploadSucceededEvent<FileStorageUploadField> event) {
        try {
            FileRef fileRef = fileUpload.getValue();
            if (fileRef != null) {
                try (InputStream inputStream = new BufferedInputStream(fileStorage.openStream(fileRef))) {
                    TranscriptionRecord record = transcriptionService.processAudio(inputStream);
                    notifications.create("Transcription completed! Status: " + record.getStatus())
                            .show();

                    // Теперь transcriptionRecordsDl доступен
                    transcriptionRecordsDl.load();
                    transcriptionRecordsDataGrid.getDataProvider().refreshAll();
                }
            }
        } catch (Exception e) {
            notifications.create("Transcription failed: " + e.getMessage())
                    .withType(Notifications.Type.ERROR)
                    .show();
            log.error("Transcription failed", e);
        } finally {
            fileUpload.clear();
        }
    }

    public void setTranscriptionRecordsDataGrid(DataGrid<TranscriptionRecord> transcriptionRecordsDataGrid) {
        this.transcriptionRecordsDataGrid = transcriptionRecordsDataGrid;
    }

}
