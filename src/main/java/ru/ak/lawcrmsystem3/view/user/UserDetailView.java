package ru.ak.lawcrmsystem3.view.user;

import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.combobox.ComboBox;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.textfield.PasswordField;
import com.vaadin.flow.router.Route;
import io.jmix.core.DataManager;
import io.jmix.core.EntityStates;
import io.jmix.core.MessageTools;
import io.jmix.core.security.CurrentAuthentication;
import io.jmix.flowui.Notifications;
import io.jmix.flowui.component.textfield.TypedTextField;
import io.jmix.flowui.kit.action.ActionPerformedEvent;
import io.jmix.flowui.model.InstanceContainer;
import io.jmix.flowui.view.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import ru.ak.lawcrmsystem3.app.UserService;
import ru.ak.lawcrmsystem3.entity.User;
import ru.ak.lawcrmsystem3.view.main.MainView;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.TimeZone;

@Route(value = "users/:id", layout = MainView.class)
@ViewController(id = "User.detail")
@ViewDescriptor(path = "user-detail-view.xml")
@EditedEntityContainer("userDc")
public class UserDetailView extends StandardDetailView<User> {

    @ViewComponent
    private TypedTextField<String> usernameField;
    @ViewComponent
    private PasswordField passwordField;
    @ViewComponent
    private PasswordField confirmPasswordField;
    @ViewComponent
    private ComboBox<String> timeZoneField;
    @ViewComponent
    private Button changePasswordBtn;

    @ViewComponent
    private MessageBundle messageBundle;
    @Autowired
    private MessageTools messageTools;
    @Autowired
    private Notifications notifications;
    @Autowired
    private EntityStates entityStates;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private UserService userService;
    @Autowired
    private DataManager dataManager;

    @Subscribe
    public void onInit(final InitEvent event) {
        timeZoneField.setItems(List.of(TimeZone.getAvailableIDs()));
    }

    @Subscribe
    public void onInitEntity(final InitEntityEvent<User> event) {
        usernameField.setReadOnly(false);
        // Поля пароля видны только при создании нового пользователя
        passwordField.setVisible(true);
        confirmPasswordField.setVisible(true);
    }

    @Subscribe
    public void onReady(final ReadyEvent event) {
        if (entityStates.isNew(getEditedEntity())) {
            usernameField.focus();
        } else {
            // Для существующих пользователей скрываем поля пароля
            passwordField.setVisible(false);
            confirmPasswordField.setVisible(false);
        }
    }

    @Subscribe("changePasswordBtn")
    public void onChangePasswordBtnClick(final ClickEvent<Button> event) {
        // Переключаем видимость полей пароля
        boolean visible = !passwordField.isVisible();
        passwordField.setVisible(visible);
        confirmPasswordField.setVisible(visible);

        if (visible) {
            // Очищаем поля при показе
            passwordField.clear();
            confirmPasswordField.clear();
            passwordField.focus();
        }
    }

    @Subscribe
    public void onValidation(final ValidationEvent event) {
        // Проверка совпадения паролей, если поля видимы
        if ((passwordField.isVisible() || entityStates.isNew(getEditedEntity()))
                && !Objects.equals(passwordField.getValue(), confirmPasswordField.getValue())) {
            event.getErrors().add(messageBundle.getMessage("passwordsDoNotMatch"));
        }

        // Проверка заполнения пароля для нового пользователя
        if (entityStates.isNew(getEditedEntity())){
            if (passwordField.getValue() == null || passwordField.getValue().isEmpty()) {
                event.getErrors().add(messageBundle.getMessage("passwordRequired"));
            }
        } else if (passwordField.isVisible()) {
            // Для существующего пользователя проверяем, что пароль не пустой при изменении
            if (passwordField.getValue() == null || passwordField.getValue().isEmpty()) {
                event.getErrors().add(messageBundle.getMessage("passwordRequired"));
            }
        }

        // Проверка уникальности username
//        User savedUser = userService.saveUser(getEditedEntity());
//        if (savedUser == null) {
//            event.getErrors().add(messageBundle.getMessage("userNotSaved"));
//        }
        // Проверка уникальности username БЕЗ СОХРАНЕНИЯ
        if (getEditedEntity().getUsername() != null && !getEditedEntity().getUsername().isEmpty()) {
            Optional<User> existingUser = dataManager.load(User.class)
                    .query("SELECT u FROM User u WHERE u.username = :username")
                    .parameter("username", getEditedEntity().getUsername())
                    .optional();

            if (existingUser.isPresent() && !existingUser.get().getId().equals(getEditedEntity().getId())) {
                event.getErrors().add(messageBundle.getMessage("userWithUsernameExists"));
            }
        }
    }

    @Subscribe
    public void onBeforeSave(final BeforeSaveEvent event) {
        // Для нового пользователя
        if (entityStates.isNew(getEditedEntity())) {
            getEditedEntity().setPassword(passwordEncoder.encode(passwordField.getValue()));

            String entityCaption = messageTools.getEntityCaption(getEditedEntityContainer().getEntityMetaClass());
            notifications.create(messageBundle.formatMessage("noAssignedRolesNotification", entityCaption))
                    .withType(Notifications.Type.WARNING)
                    .withPosition(Notification.Position.TOP_END)
                    .show();
        }
        // Для существующего пользователя, если пароль был изменён
        else if (passwordField.isVisible() && !passwordField.getValue().isEmpty()) {
            getEditedEntity().setPassword(passwordEncoder.encode(passwordField.getValue()));
        }
    }
}