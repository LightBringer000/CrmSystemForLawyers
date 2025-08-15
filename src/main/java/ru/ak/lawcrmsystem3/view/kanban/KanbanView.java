package ru.ak.lawcrmsystem3.view.kanban;

import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.page.Page;
import com.vaadin.flow.router.Route;
import io.jmix.flowui.component.layout.ViewLayout;
import io.jmix.flowui.view.StandardView;
import io.jmix.flowui.view.ViewController;
import io.jmix.flowui.view.ViewDescriptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import ru.ak.lawcrmsystem3.app.UserService;
import ru.ak.lawcrmsystem3.entity.Task;
import ru.ak.lawcrmsystem3.entity.User;
import ru.ak.lawcrmsystem3.repository.UserRepository;
import ru.ak.lawcrmsystem3.view.main.MainView;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.jsoup.nodes.Document.OutputSettings.Syntax.html;

@Route(value = "kanban-view", layout = MainView.class)
@ViewController(id = "KanbanView")
@ViewDescriptor(path = "kanban-view.xml")
public class KanbanView extends StandardView {

    private static final Logger log = LoggerFactory.getLogger(KanbanView.class);

    private final UserService userService;

    public KanbanView(UserRepository userRepository, UserService userService) {
        this.userService = userService;
        String htmlContent = loadHtmlContent("/static/kanban.html");
        Html html = new Html(htmlContent);
        getContent().add(html);
    }

    @Override
    @NonNull
    protected ViewLayout initContent() {
        ViewLayout content = super.initContent();

        // Динамическая загрузка JavaScript-файла
        Page page = UI.getCurrent().getPage();
        page.addJavaScript("/js/script.js");

        // Получение имени пользователя из контекста безопасности Spring Security
        String username = getCurrentUsername();
        User user = userService.findByUsername(username); // new

        log.info("Значение username: {}", username);

        // Вариант 1: Получаем данные отдельными запросами
        UUID userId = userService.findUserIdByUsername(username);
        log.info("UserId is: {}", userId);
        String firstName = userService.findFirstNameByUsername(username);
        log.info("User firstName is: {}", firstName);

        // Передача данных пользователя в JavaScript
        if (username != null) {
          //  UI.getCurrent().getPage().executeJs("window.userData = { firstName: $0 };", firstName);
            UI.getCurrent().getPage().executeJs("window.userData = { firstName: $0, userId: $1 };",
                    firstName, userId.toString());
        }

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
            throw new RuntimeException("Failed to load HTML file", e);
        }
    }

    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        throw new RuntimeException("Ошибка! Пользователь не аутентифицирован!");
    }

    private Set<Task> fetchTasksByUserIdDelegate() {
        Logger log = LoggerFactory.getLogger(getClass()); // Получаем логгер
        try {
            String username = getCurrentUsername();
            log.debug("Fetching tasks for username: {}", username);

            User user = userService.findByUsername(username);
            if (user == null) {
                log.warn("User not found for username: {}", username);
                return Collections.emptySet(); // Возвращаем пустой Set
            }

            Set<Task> tasks = user.getTasks(); // Получаем Set из User
            if(tasks == null){
                tasks = new HashSet<>();
            }
            log.debug("Found {} tasks for user {}", tasks.size(), username);
            return tasks;
        } catch (Exception e) {
            log.error("Error fetching tasks for user", e);
            return Collections.emptySet(); // Возвращаем пустой Set
        }
    }

}