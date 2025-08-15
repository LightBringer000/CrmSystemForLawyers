package ru.ak.lawcrmsystem3.view.emaillist;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaadin.flow.component.ClientCallable;
import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.html.Anchor;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.page.Page;
import com.vaadin.flow.router.Route; // Для Vaadin Flow
import com.vaadin.flow.server.StreamResource;
import io.jmix.core.DataManager;
import io.jmix.email.EmailException;
import io.jmix.email.EmailInfo;
import io.jmix.email.EmailInfoBuilder;
import io.jmix.email.Emailer;
import io.jmix.flowui.component.layout.ViewLayout;
import io.jmix.flowui.view.*;
import org.springframework.beans.factory.annotation.Autowired;
import ru.ak.lawcrmsystem3.app.EmailReceiverService;
import ru.ak.lawcrmsystem3.app.EmailSenderService;
import ru.ak.lawcrmsystem3.entity.EmailAttachment;
import ru.ak.lawcrmsystem3.entity.EmailEntityBrowse;
import ru.ak.lawcrmsystem3.entity.ReceivedEmail;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import ru.ak.lawcrmsystem3.view.main.MainView;

@Route(value = "EmailListView", layout = MainView.class)
@ViewController(id = "EmailListView")
@ViewDescriptor(path = "email-list-view.xml")
public class EmailListView extends StandardView  {

    private static final Logger log = LoggerFactory.getLogger(EmailListView.class);

    private final EmailReceiverService emailReceiverService;
    private final ObjectMapper objectMapper; // Добавляем ObjectMapper для сериализации в JSON
   

    @Autowired
    private DataManager dataManager;

    // Внедряем ObjectMapper через конструктор
    public EmailListView(EmailReceiverService emailReceiverService, ObjectMapper objectMapper) {
        this.emailReceiverService = emailReceiverService;
        this.objectMapper = objectMapper; // Инициализируем ObjectMapper
    }

    @Override
    @NonNull
    protected ViewLayout initContent() {
        ViewLayout content = super.initContent();

        String htmlContent = loadHtmlContent("/static/emailListView.html");
        Html html = new Html(htmlContent);
        content.add(html);

        Page page = UI.getCurrent().getPage();
        page.addJavaScript("/js/purify.min.js");
        page.addJavaScript("/js/emailListView.js");

        return content;
    }

    private String loadHtmlContent(String resourcePath) {
        try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {
            if (inputStream == null) {
                throw new IOException("HTML file not found: " + resourcePath);
            }
            byte[] bytes = inputStream.readAllBytes();
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("Failed to load HTML file: {}", resourcePath, e);
            throw new RuntimeException("Failed to load HTML file: " + resourcePath, e);
        }
    }

    /**
     * Серверный метод, который будет вызываться из JavaScript для получения писем.
     * Теперь возвращает String (JSON-строку).
     */

    @ClientCallable
    public String fetchEmailsForDisplay() {
        try {
            List<ReceivedEmail> emails = emailReceiverService.receiveNewEmails();

            List<Map<String, Object>> emailData = emails.stream().map(email -> {
                Map<String, Object> data = new HashMap<>();
                data.put("uid", email.getUid());
                data.put("from", email.getFrom());
                data.put("subject", email.getSubject());
                data.put("sentDate", email.getSentDate());
                data.put("receivedDate", email.getReceivedDate());
                return data;
            }).collect(Collectors.toList());

            return new ObjectMapper().writeValueAsString(emailData);
        } catch (JsonProcessingException e) {
            log.error("JSON processing error", e);
            return "{\"error\":\"Failed to process emails\"}";
        } catch (Exception e) {
            log.error("Unexpected error", e);
            return "{\"error\":\"Server error\"}";
        }
    }

    // EmailData class remains the same
    public static class EmailData {
        private String from;
        private String subject;
        private String sentDate;
        private String receivedDate;
        private String textContent;

        public EmailData(String from, String subject, String sentDate, String receivedDate, String textContent) {
            this.from = from;
            this.subject = subject;
            this.sentDate = sentDate;
            this.receivedDate = receivedDate;
            this.textContent = textContent;
        }

        // Getters (and setters, if needed by ObjectMapper for deserialization, but for serialization, getters are primary)
        public String getFrom() { return from; }
        public String getSubject() { return subject; }
        public String getSentDate() { return sentDate; }
        public String getReceivedDate() { return receivedDate; }
        public String getTextContent() { return textContent; }

        public void setFrom(String from) { this.from = from; }
        public void setSubject(String subject) { this.subject = subject; }
        public void setSentDate(String sentDate) { this.sentDate = sentDate; }
        public void setReceivedDate(String receivedDate) { this.receivedDate = receivedDate; }
        public void setTextContent(String textContent) { this.textContent = textContent; }
    }

    private EmailData mapToEmailData(ReceivedEmail email) {
        String sentDateStr = email.getSentDate() != null ? email.getSentDate().toString() : "";
        String receivedDateStr = email.getReceivedDate() != null ? email.getReceivedDate().toString() : "";

        return new EmailData(
                email.getFrom(),
                email.getSubject(),
                sentDateStr,
                receivedDateStr,
                email.getTextContent()
        );
    }

    @ClientCallable
    public String getEmailContent(long uid) {
        try {
            ReceivedEmail email = emailReceiverService.receiveEmailByUid(uid);
            if (email == null) {
                return "{\"error\":\"Email not found\"}";
            }

            ObjectMapper mapper = new ObjectMapper();
            return mapper.writeValueAsString(Map.of(
                    "id", email.getId(),
                    "from", email.getFrom() != null ? email.getFrom() : "",
                    "subject", email.getSubject() != null ? email.getSubject() : "",
                    "sentDate", email.getSentDate() != null ? email.getSentDate().toString() : "",
                    "textContent", email.getTextContent() != null ? email.getTextContent() : "",
                    "htmlContent", email.getHtmlContent() != null ? email.getHtmlContent() : "",
                    "attachments", email.getAttachments() != null ? email.getAttachments().stream()
                            .map(a -> Map.of(
                                    "id", a.getId(),
                                    "fileName", a.getFileName(),
                                    "fileSize", a.getFileSize(),
                                    "mimeType", a.getMimeType()
                            )).collect(Collectors.toList()) : Collections.emptyList()
            ));
        } catch (Exception e) {
            return "{\"error\":\"" + e.getMessage() + "\"}";
        }
    }


@ClientCallable
public String downloadAttachment(long emailUid, String attachmentName) {
    try {
        byte[] attachmentData = emailReceiverService.downloadAttachment(emailUid, attachmentName);
        return attachmentData != null ? Base64.getEncoder().encodeToString(attachmentData) : null;
    } catch (Exception e) {
        log.error("Error downloading attachment", e);
        return null;
    }
}



}