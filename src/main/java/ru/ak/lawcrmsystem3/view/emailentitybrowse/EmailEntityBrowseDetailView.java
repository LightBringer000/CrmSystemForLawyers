package ru.ak.lawcrmsystem3.view.emailentitybrowse;

import com.vaadin.flow.component.ClientCallable;
import com.vaadin.flow.component.Component;
import com.vaadin.flow.router.Route;
import io.jmix.core.Resources;
import io.jmix.email.EmailAttachment;
import io.jmix.email.EmailInfo;
import io.jmix.email.EmailInfoBuilder;
import io.jmix.email.Emailer;
import io.jmix.flowui.Dialogs;
import io.jmix.flowui.action.DialogAction;
import io.jmix.flowui.model.DataContext;
import io.jmix.flowui.view.*;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.multipart.MultipartFile;
import ru.ak.lawcrmsystem3.app.EmailReceiverService;
import ru.ak.lawcrmsystem3.app.EmailSenderService;
import ru.ak.lawcrmsystem3.entity.EmailEntityBrowse;
import ru.ak.lawcrmsystem3.view.main.MainView;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.*;

@Route(value = "email-entity-browses/:id", layout = MainView.class)
@ViewController(id = "EmailEntityBrowse.detail")
@ViewDescriptor(path = "email-entity-browse-detail-view.xml")
@EditedEntityContainer("emailEntityBrowseDc")
public class EmailEntityBrowseDetailView extends StandardDetailView<EmailEntityBrowse> {

    private static final Logger log = LoggerFactory.getLogger(EmailEntityBrowseDetailView.class);


    private boolean justCreated;

    @Inject
    protected Dialogs dialogs;

    @Autowired
    private Emailer emailer;

    @Autowired
    protected Resources resources;

    @Autowired
    private EmailReceiverService emailReceiverService;

    @Autowired
    private EmailSenderService emailSenderService;

    @Subscribe
    public void onInitEntity(InitEntityEvent<EmailEntityBrowse> event) {
        justCreated = true;
        log.info("New email created");

    }

    @Subscribe(target = Target.DATA_CONTEXT)
    public void onPostCommit(DataContext.PostSaveEvent event) {
        if (justCreated) {
            log.info("Making dialog");
            dialogs.createOptionDialog()
                    .withHeader("Email")
                    .withText("Send the news item by email?")
                    .withActions(
                            new DialogAction(DialogAction.Type.YES) {
                                @Override
                                public void actionPerform(Component component) {
                                    try {
                                        sendByEmail();
                                    } catch (IOException e) {
                                        log.error("Error sending email", e);
                                    }
                                }
                            },
                            new DialogAction(DialogAction.Type.NO)
                    )
                    .open();
            log.info("Dialog finished");

        }
    }

    private void sendByEmail() throws IOException {
        EmailEntityBrowse newsItem = getEditedEntity();
        log.info("News item");

        // Проверяем, есть ли прикрепленный файл
        if (newsItem.getAttachedFile() != null && newsItem.getAttachedFile().length > 0) {
            EmailAttachment emailAtt = new EmailAttachment(
                    newsItem.getAttachedFile(),
                    "attachment.pdf",  // Или другое имя файла, можно взять из дополнительного поля
                    "fileAttachment"
            );
            log.info("Email builder");

            EmailInfo emailInfo = EmailInfoBuilder.create()
                    .setAddresses("a-lex.2@mail.ru")
                    .setSubject(newsItem.getCapture())
                    .setFrom("shield_and_sword_company@mail.ru")
                    .setBody(newsItem.getContent())
                    .setAttachments(emailAtt)
                    .build();
            emailer.sendEmailAsync(emailInfo);
        } else {
            // Отправка без вложения, если файла нет
            EmailInfo emailInfo = EmailInfoBuilder.create()
                    .setAddresses(newsItem.getClientEmail())
                    .setSubject(newsItem.getCapture())
                  //  .setFrom("shield-and-sword-company@yandex.ru")
                    .setFrom("shield_and_sword_company@mail.ru")
                    // .setFrom("nomad3951@gail.com")
                    .setBody(newsItem.getContent())
                    .build();
            emailer.sendEmailAsync(emailInfo);
            log.info("Email sent");

        }
    }
}


