package ru.ak.lawcrmsystem3.app;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jmix.core.DataManager;
import jakarta.mail.*;
import jakarta.mail.internet.*;
import jakarta.mail.search.FlagTerm;
import jakarta.mail.search.SearchTerm;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.eclipse.angus.mail.imap.IMAPFolder;
import org.jsoup.Jsoup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import ru.ak.lawcrmsystem3.entity.EmailAttachment;
import ru.ak.lawcrmsystem3.entity.ReceivedEmail;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static com.sun.jna.platform.win32.Kernel32Util.getFileType;


@Component
public class EmailReceiverService {

    private static final Logger log = LoggerFactory.getLogger(EmailReceiverService.class);

    private final String host;
    private final int port; // <-- Добавляем переменную для порта
    private final String username;
    private final String password;
    private final String protocol; // "imaps" или "pop3"
    @Autowired
    protected DataManager dataManager;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private EmailAttachment attachment;

    public EmailReceiverService(
            @Value("${mail.receiver.host}") String host,
            @Value("${mail.receiver.port:993}") int port, // <-- Добавляем порт с дефолтным значением 993
            @Value("${mail.receiver.username}") String username,
            @Value("${mail.receiver.password}") String password,
            @Value("${mail.receiver.protocol:imaps}") String protocol) {
        this.host = host;
        this.port = port; // <-- Инициализируем порт
        this.username = username;
        this.password = password;
        this.protocol = protocol;
        log.info("EmailReceiverService initialized with host: {}, port: {}, username: {}, protocol: {}",
                host, port, username, protocol);
    }

    public List<ReceivedEmail> receiveNewEmails() {
        log.info("Attempting to receive new emails");
        return receiveEmailsSince(null);
    }

    //Метод для поиска только непрочитанных писем
    public List<ReceivedEmail> receiveUnreadEmails() {
        log.info("Attempting to receive unread emails");
        List<ReceivedEmail> emails = new ArrayList<>();
        Store store = null;
        IMAPFolder inbox = null;

        try {
            // 1. Настройка свойств для подключения
            Properties props = new Properties();
            props.put("mail.store.protocol", protocol);
            props.put("mail." + protocol + ".port", String.valueOf(port));
            props.put("mail." + protocol + ".ssl.enable", "true");
            props.put("mail." + protocol + ".timeout", "10000");
            props.put("mail." + protocol + ".connectiontimeout", "10000");

            // 2. Создание сессии и подключение к серверу
            Session session = Session.getInstance(props);
            store = session.getStore();
            store.connect(host, port, username, password);

            // 3. Открытие папки "INBOX"
            inbox = (IMAPFolder) store.getFolder("INBOX");
            inbox.open(Folder.READ_ONLY);

            // 4. Поиск непрочитанных сообщений
            SearchTerm unreadMessages = new FlagTerm(new Flags(Flags.Flag.SEEN), false);
            Message[] messages = inbox.search(unreadMessages);

            // 5. Обработка найденных сообщений
            for (Message message : messages) {
                try {
                    // Конвертация сообщения в наш объект ReceivedEmail
                    ReceivedEmail email = convertToReceivedEmail(message);

                    // Определение уникального идентификатора письма (UID или хэш)
                    if (inbox instanceof UIDFolder) {
                        long uid = ((UIDFolder) inbox).getUID(message);
                        email.setUid(String.valueOf(uid));
                    } else {
                        email.setUid(generateEmailHash(message));
                    }

                    emails.add(email);
                } catch (Exception e) {
                    log.error("Error processing unread message with subject: {}", getSubjectSafe(message), e);
                }
            }

            // 6. Закрытие папки и хранилища
            inbox.close(false);
            store.close();

        } catch (Exception e) {
            log.error("Error receiving unread emails: {}", e.getMessage(), e);
        } finally {
            // 7. Обеспечение закрытия ресурсов в любом случае
            try {
                if (inbox != null && inbox.isOpen()) {
                    inbox.close(false);
                }
                if (store != null && store.isConnected()) {
                    store.close();
                }
            } catch (MessagingException e) {
                log.warn("Error closing resources", e);
            }
        }
        return emails;
    }

    public List<ReceivedEmail> receiveEmailsSince(Date sinceDate) {
        List<ReceivedEmail> emails = new ArrayList<>();
        log.info("Starting email reception process. Retrieving emails since: {}",
                sinceDate != null ? sinceDate : "beginning of time");

        try {
            Properties props = new Properties();
            props.put("mail.store.protocol", protocol);
            props.put("mail." + protocol + ".port", String.valueOf(port));
            props.put("mail." + protocol + ".ssl.enable", "true");
            props.put("mail." + protocol + ".timeout", "10000");
            props.put("mail." + protocol + ".connectiontimeout", "10000");

            Session session = Session.getInstance(props);
            Store store = session.getStore();
            store.connect(host, port, username, password);

            Folder inbox = store.getFolder("INBOX");
            inbox.open(Folder.READ_ONLY);

            if (inbox instanceof IMAPFolder imapFolder) {
                processImapMessages(imapFolder, emails);
            } else {
                processNonImapMessages(inbox, emails);
            }

            inbox.close(false);
            store.close();
        } catch (Exception e) {
            log.error("Error receiving emails: {}", e.getMessage(), e);
        }
        return emails;
    }

    private void processImapMessages(IMAPFolder folder, List<ReceivedEmail> emails) throws MessagingException {
        Message[] messages = folder.getMessages();
        FetchProfile fetchProfile = new FetchProfile();
        fetchProfile.add(UIDFolder.FetchProfileItem.UID);
        folder.fetch(messages, fetchProfile);

        for (Message message : messages) {
            try {
                ReceivedEmail email = convertToReceivedEmail(message);
                long uid = folder.getUID(message);
                email.setUid(String.valueOf(uid));
                emails.add(email);
            } catch (Exception e) {
                log.error("Error processing message with subject: {}", getSubjectSafe(message), e);
            }
        }
    }

    private void processNonImapMessages(Folder folder, List<ReceivedEmail> emails) throws MessagingException {
        Message[] messages = folder.getMessages();
        for (Message message : messages) {
            try {
                ReceivedEmail email = convertToReceivedEmail(message);
                String hash = generateEmailHash(message);
                email.setUid(hash);
                emails.add(email);
            } catch (Exception e) {
                log.error("Error processing message with subject: {}", getSubjectSafe(message), e);
            }
        }
    }

    private String getSubjectSafe(Message message) {
        try {
            return message.getSubject();
        } catch (MessagingException e) {
            return "[Could not read subject]";
        }
    }

    private ReceivedEmail convertToReceivedEmail(Message message) throws MessagingException, IOException {
        ReceivedEmail email = dataManager.create(ReceivedEmail.class);
        processBasicEmailFields(message, email);

        Object content = message.getContent();
        List<EmailAttachment> attachments = new ArrayList<>();

        if (content instanceof String) {
            processSimpleContent((String) content, email);
        } else if (content instanceof MimeMultipart) {
            processMultipartContent((MimeMultipart) content, email, attachments);
        } else if (content instanceof InputStream) {
            processInputStreamContent((InputStream) content, email);
        }

        email.setAttachments(attachments);
        logEmailConversion(email, attachments.size());

        return email;
    }

    private void processBasicEmailFields(Message message, ReceivedEmail email) throws MessagingException {
        Address[] fromAddresses = message.getFrom();
        if (fromAddresses != null && fromAddresses.length > 0) {
            email.setFrom(extractEmailAddress(fromAddresses[0]));
        } else {
            email.setFrom("Unknown sender");
        }

        email.setSubject(decodeHeader(message.getSubject()));
        email.setSentDate(message.getSentDate());
        email.setReceivedDate(message.getReceivedDate());
    }

    private void processSimpleContent(String content, ReceivedEmail email) {
        if (content != null && !content.trim().isEmpty()) {
            email.setTextContent(content);
        }
    }

    private void processInputStreamContent(InputStream is, ReceivedEmail email) throws IOException {
        String content = IOUtils.toString(is, StandardCharsets.UTF_8);
        if (content != null && !content.trim().isEmpty()) {
            email.setTextContent(content);
        }
    }

    private void processMultipartContent(MimeMultipart multipart,
                                         ReceivedEmail email,
                                         List<EmailAttachment> attachments)
            throws MessagingException, IOException {

        boolean textFound = false;
        boolean htmlFound = false;

        for (int i = 0; i < multipart.getCount(); i++) {
            BodyPart bodyPart = multipart.getBodyPart(i);
            String disposition = bodyPart.getDisposition();

            if (bodyPart.isMimeType("text/plain") && !textFound) {
                email.setTextContent(getBodyPartContent(bodyPart));
                textFound = true;
                continue;
            }

            if (bodyPart.isMimeType("text/html") && !htmlFound) {
                email.setHtmlContent(getBodyPartContent(bodyPart));
                htmlFound = true;
                continue;
            }

            if (Part.ATTACHMENT.equalsIgnoreCase(disposition) ||
                    (disposition == null && bodyPart.getFileName() != null)) {
                // Создаем attachment только с метаданными, без содержимого
                attachments.add(createAttachment(bodyPart, email));
            }

            if (bodyPart.getContent() instanceof MimeMultipart) {
                processMultipartContent((MimeMultipart) bodyPart.getContent(), email, attachments);
            }
        }

        if (!textFound && htmlFound && email.getHtmlContent() != null) {
            email.setTextContent(Jsoup.parse(email.getHtmlContent()).text());
        }
    }

    private String getBodyPartContent(BodyPart bodyPart) throws MessagingException, IOException {
        try {
            Object content = bodyPart.getContent();
            if (content instanceof String) {
                return (String) content;
            } else if (content instanceof InputStream) {
                return IOUtils.toString((InputStream) content, getCharset(bodyPart));
            }
            return content != null ? content.toString() : null;
        } catch (Exception e) {
            log.warn("Failed to get content from body part", e);
            return null;
        }
    }

    private EmailAttachment createAttachment(BodyPart bodyPart, ReceivedEmail email)
            throws IOException, MessagingException {

        EmailAttachment attachment = dataManager.create(EmailAttachment.class);
        attachment.setFileName(decodeHeader(bodyPart.getFileName()));
        attachment.setMimeType(bodyPart.getContentType());

        // Убрано сохранение содержимого файла
        attachment.setContent(null); // Не сохраняем содержимое
        attachment.setFileSize(0L); // Размер 0, так как содержимое не загружается
        attachment.setEmail(email);

        return attachment;
    }

    private boolean isValidPdf(byte[] content) {
        return content.length > 4 &&
                content[0] == '%' &&
                content[1] == 'P' &&
                content[2] == 'D' &&
                content[3] == 'F';
    }

    private InputStream getProperlyDecodedStream(BodyPart bodyPart)
            throws MessagingException, IOException {

        InputStream is = bodyPart.getInputStream();
        String contentTransferEncoding = bodyPart.getHeader("Content-Transfer-Encoding")[0];

        if (contentTransferEncoding != null) {
            // Декодируем поток согласно Content-Transfer-Encoding
            return MimeUtility.decode(is, contentTransferEncoding);
        }

        return is;
    }

    private byte[] attemptToFixPdf(byte[] content) {
        // Ищем начало PDF сигнатуры
        for (int i = 0; i < content.length - 4; i++) {
            if (content[i] == '%' && content[i+1] == 'P' &&
                    content[i+2] == 'D' && content[i+3] == 'F') {
                // Возвращаем обрезанный массив, начиная с сигнатуры PDF
                return Arrays.copyOfRange(content, i, content.length);
            }
        }
        return content; // Если не нашли, возвращаем как есть
    }

    private String getCharset(BodyPart part) throws MessagingException {
        String contentType = part.getContentType();
        if (contentType != null) {
            String[] params = contentType.split(";");
            for (String param : params) {
                if (param.trim().startsWith("charset=")) {
                    return param.split("=", 2)[1].trim().replace("\"", "");
                }
            }
        }
        return StandardCharsets.UTF_8.name();
    }

    private String decodeHeader(String header) {
        if (header == null) return null;
        try {
            return MimeUtility.decodeText(header);
        } catch (UnsupportedEncodingException e) {
            log.warn("Failed to decode header: {}", header);
            return header;
        }
    }

    private String extractEmailAddress(Address address) {
        if (address instanceof InternetAddress) {
            return ((InternetAddress) address).getAddress();
        }
        return address.toString();
    }

    private void logEmailConversion(ReceivedEmail email, int attachmentCount) {
        log.debug("Converted email - From: {}, Subject: {}, Text length: {}, Attachments: {}",
                email.getFrom(), email.getSubject(),
                email.getTextContent() != null ? email.getTextContent().length() : 0,
                attachmentCount);
    }

    private String generateEmailHash(Message message) throws MessagingException {
        String uniqueData = Arrays.toString(message.getFrom()) +
                message.getSubject() +
                message.getSentDate();
        return DigestUtils.md5Hex(uniqueData);
    }


public ReceivedEmail receiveEmailByUid(long uid) {
    Store store = null;
    IMAPFolder inbox = null;

    try {
        Properties props = new Properties();
        props.put("mail.store.protocol", protocol);
        props.put("mail." + protocol + ".port", String.valueOf(port));
        props.put("mail." + protocol + ".ssl.enable", "true");
        props.put("mail." + protocol + ".timeout", "10000");
        props.put("mail." + protocol + ".connectiontimeout", "10000");

        Session session = Session.getInstance(props);
        store = session.getStore();
        store.connect(host, port, username, password);

        inbox = (IMAPFolder) store.getFolder("INBOX");
        inbox.open(Folder.READ_ONLY);

        Message message = inbox.getMessageByUID(uid);
        if (message == null) {
            log.warn("Email with UID {} not found", uid);
            return null;
        }

        // Загружаем содержимое сообщения
        FetchProfile fetchProfile = new FetchProfile();
        fetchProfile.add(FetchProfile.Item.CONTENT_INFO);
        fetchProfile.add(FetchProfile.Item.ENVELOPE);
        fetchProfile.add(FetchProfile.Item.FLAGS);
        inbox.fetch(new Message[]{message}, fetchProfile);

        // Конвертируем в наш объект ReceivedEmail
        ReceivedEmail email = convertToReceivedEmail(message);
        email.setUid(String.valueOf(uid));

        // Для IMAP также получаем и сохраняем UID
        if (inbox instanceof UIDFolder) {
            long actualUid = ((UIDFolder) inbox).getUID(message);
            email.setUid(String.valueOf(actualUid));
        }

        return email;
    } catch (Exception e) {
        log.error("Error fetching email by UID: {}", uid, e);
        return null;
    } finally {
        try {
            if (inbox != null && inbox.isOpen()) {
                inbox.close(false);
            }
            if (store != null && store.isConnected()) {
                store.close();
            }
        } catch (MessagingException e) {
            log.warn("Error closing resources", e);
        }
    }
}

    // Новый метод для загрузки вложений
    public byte[] downloadAttachment(long emailUid, String attachmentName) {
        Store store = null;
        IMAPFolder inbox = null;

        try {
            Properties props = new Properties();
            props.put("mail.store.protocol", protocol);
            props.put("mail." + protocol + ".port", String.valueOf(port));
            props.put("mail." + protocol + ".ssl.enable", "true");
            props.put("mail." + protocol + ".timeout", "10000");
            props.put("mail." + protocol + ".connectiontimeout", "10000");

            Session session = Session.getInstance(props);
            store = session.getStore();
            store.connect(host, port, username, password);

            inbox = (IMAPFolder) store.getFolder("INBOX");
            inbox.open(Folder.READ_ONLY);

            Message message = inbox.getMessageByUID(emailUid);
            if (message == null) {
                log.warn("Email with UID {} not found", emailUid);
                return null;
            }

            if (message.getContent() instanceof MimeMultipart) {
                MimeMultipart multipart = (MimeMultipart) message.getContent();
                for (int i = 0; i < multipart.getCount(); i++) {
                    BodyPart bodyPart = multipart.getBodyPart(i);
                    String fileName = decodeHeader(bodyPart.getFileName());

                    if (fileName != null && fileName.equalsIgnoreCase(attachmentName)) {
                        try (InputStream is = bodyPart.getInputStream()) {
                            return IOUtils.toByteArray(is);
                        }
                    }
                }
            }

            log.warn("Attachment {} not found in email with UID {}", attachmentName, emailUid);
            return null;
        } catch (Exception e) {
            log.error("Error downloading attachment '{}' from email UID {}: {}",
                    attachmentName, emailUid, e.getMessage(), e);
            return null;
        } finally {
            try {
                if (inbox != null && inbox.isOpen()) {
                    inbox.close(false);
                }
                if (store != null && store.isConnected()) {
                    store.close();
                }
            } catch (MessagingException e) {
                log.warn("Error closing resources", e);
            }
        }
    }
}