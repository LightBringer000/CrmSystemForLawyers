package ru.ak.lawcrmsystem3.view.main;

import com.vaadin.flow.component.ClientCallable;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.router.Route;
import io.jmix.flowui.app.main.StandardMainView;
import io.jmix.flowui.view.Subscribe;
import io.jmix.flowui.view.ViewController;
import io.jmix.flowui.view.ViewDescriptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import ru.ak.lawcrmsystem3.app.SchedulerService;


@Route("")
@ViewController(id = "MainView")
@ViewDescriptor(path = "main-view.xml")
public class MainView extends StandardMainView {

    private final Logger log = LoggerFactory.getLogger(MainView.class);


    @Autowired
    private SchedulerService schedulerService;

    @Subscribe
    public void onBeforeShow(BeforeShowEvent event) {
        // Добавляем Font Awesome через JavaScript
        UI.getCurrent().getPage().executeJs("""
            // Проверяем, не добавлен ли уже Font Awesome
            if (!document.querySelector('link[href*=\"font-awesome\"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
                link.integrity = 'sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg==';
                link.crossOrigin = 'anonymous';
                link.referrerPolicy = 'no-referrer';
                document.head.appendChild(link);
            }
        """);

        // Загружаем наш скрипт
        UI.getCurrent().getPage().addJavaScript("/js/tasks-notification.js");
        UI.getCurrent().getPage().addJavaScript("/js/events-notification.js");
        UI.getCurrent().getPage().addJavaScript("/js/emails-notification.js");
    }

//    @ClientCallable
//    public int getUpcomingEventsCount() {
//        try {
//            return (int) schedulerService.getUpcomingEventsCount();
//        } catch (Exception e) {
//            log.error("Error getting upcoming events count", e);
//            return 0;
//        }
//    }

    @ClientCallable
    public int getUnreadEmailsCount() {
        try {
            return (int) schedulerService.getUnreadEmailsCount();
        } catch (Exception e) {
            log.error("Error getting unread emails count", e);
            return 0;
        }
    }
}
