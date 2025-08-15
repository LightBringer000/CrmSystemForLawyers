package ru.ak.lawcrmsystem3.app;

import io.jmix.core.DataManager;
import io.jmix.email.EmailAttachment;
import io.jmix.email.EmailInfo;
import io.jmix.email.EmailInfoBuilder;
import io.jmix.email.Emailer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import ru.ak.lawcrmsystem3.entity.EmailEntityBrowse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@Component
public class EmailSenderService {

    private static final Logger log = LoggerFactory.getLogger(EmailSenderService.class);

    private final Emailer emailer;

    public EmailSenderService(Emailer emailer) {
        this.emailer = emailer;
    }

    public void sendEmailNotification(EmailEntityBrowse emailEntity) {
        try {
            EmailAttachment emailAtt = null;

            if (emailEntity.getAttachedFile() != null && emailEntity.getAttachedFile().length > 0) {
                byte[] bytes = emailEntity.getAttachedFile();

                // Используем переданные имя и тип файла, или значения по умолчанию
                String fileName = emailEntity.getAttachedFileName() != null ?
                        emailEntity.getAttachedFileName() : "Счёт.pdf";

                String mimeType = emailEntity.getAttachedFileMimeType() != null ?
                        emailEntity.getAttachedFileMimeType() : "application/pdf";

                // Создаем EmailAttachment с использованием правильного конструктора
                emailAtt = new EmailAttachment(bytes, fileName, mimeType);

                log.info("Sending attachment: name={}, type={}, size={} bytes",
                        fileName, mimeType, bytes.length);
            }

            EmailInfo emailInfo = EmailInfoBuilder.create()
                    .setAddresses(emailEntity.getClientEmail())
                    .setSubject(emailEntity.getCapture() != null ?
                            emailEntity.getCapture() : "Исполнитель")
                    .setFrom("shield_and_sword_company@mail.ru")
                    .setBody(emailEntity.getContent())
                    .setAttachments(emailAtt != null ? new EmailAttachment[]{emailAtt} : null)
                    .build();

            emailer.sendEmailAsync(emailInfo);

        } catch (Exception e) {
            log.error("Failed to send email: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send email", e);
        }
    }
}