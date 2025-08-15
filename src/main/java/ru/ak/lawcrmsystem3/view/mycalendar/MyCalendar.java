package ru.ak.lawcrmsystem3.view.mycalendar;

import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.dependency.CssImport;
import com.vaadin.flow.router.Route;
import io.jmix.core.DataManager;
import io.jmix.core.Messages;
import io.jmix.core.Metadata;
import io.jmix.core.security.CurrentAuthentication;
import io.jmix.core.security.SecurityContextHelper;
import io.jmix.flowui.Dialogs;
import io.jmix.flowui.Notifications;
import io.jmix.flowui.UiComponents;
import io.jmix.flowui.action.DialogAction;
import io.jmix.flowui.app.inputdialog.DialogActions;
import io.jmix.flowui.component.combobox.JmixComboBox;
import io.jmix.flowui.component.textfield.TypedTextField;
import io.jmix.flowui.model.CollectionContainer;
import io.jmix.flowui.model.CollectionLoader;
import io.jmix.flowui.view.*;
import io.jmix.fullcalendarflowui.component.FullCalendar;
import io.jmix.fullcalendarflowui.component.contextmenu.FullCalendarContextMenu;
import io.jmix.fullcalendarflowui.component.contextmenu.event.FullCalendarCellContext;
import io.jmix.fullcalendarflowui.component.data.CalendarEvent;
import io.jmix.fullcalendarflowui.component.data.EntityCalendarEvent;
import io.jmix.fullcalendarflowui.component.data.SimpleCalendarEvent;
import io.jmix.fullcalendarflowui.component.event.*;
import io.jmix.fullcalendarflowui.kit.component.model.CalendarDisplayModes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import ru.ak.lawcrmsystem3.entity.Event;
import ru.ak.lawcrmsystem3.entity.User;
import ru.ak.lawcrmsystem3.view.main.MainView;

import io.jmix.fullcalendarflowui.component.model.DayOfWeek;

//import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import static io.jmix.flowui.app.inputdialog.InputParameter.*;
import static io.jmix.fullcalendarflowui.kit.component.model.CalendarDisplayModes.*;

import io.jmix.fullcalendarflowui.component.event.DayCellClassNamesContext;
import io.jmix.fullcalendarflowui.component.event.DayHeaderClassNamesContext;



@Route(value = "my-calendar", layout = MainView.class)
@ViewController(id = "MyCalendar")
@ViewDescriptor(path = "my-calendar.xml")
public class MyCalendar extends StandardView {

    private static final String TODAY_CLASS_NAME = "uisamples-today";
    private static final String WEEKEND_CLASS_NAME = "uisamples-weekend";
    private static final String DAY_HEADER_CLASS_NAME = "uisamples-day-header";

    @ViewComponent
    private CollectionContainer<Event> eventsDc;
    @ViewComponent
    private MessageBundle messageBundle;
    @Autowired
    private Metadata metadata;
    @Autowired
    private Dialogs dialogs;
    @Autowired
    private UiComponents uiComponents;
    @Autowired
    private DataManager dataManager;
    @Autowired
    private CurrentAuthentication currentAuthentication;
    @ViewComponent
    private JmixComboBox<CalendarDisplayModes> displayModesBox;
    @Autowired
    private Messages messages;
    @Autowired
    private Notifications notifications;
    @ViewComponent
    private FullCalendar calendar;
    @ViewComponent
    private CollectionLoader<Event> eventsDl;

    @Subscribe
    public void onBeforeShow(final BeforeShowEvent event) {
        final User user = (User) currentAuthentication.getUser();
        eventsDl.setParameter("user", user);
        eventsDl.load();

    }

    @Subscribe
    public void onInit(final InitEvent event) {
        FullCalendarContextMenu contextMenu = calendar.getContextMenu(); //
        contextMenu.setContentMenuHandler(this::contextMenuHandler); //
        displayModesBox.setItems(CalendarDisplayModes.values());
        displayModesBox.setLabel("Выбор вида календаря");
        displayModesBox.setWidth("300px");
        displayModesBox.addValueChangeListener(e ->
                calendar.setCalendarDisplayMode(e.getValue() == null ? MULTI_MONTH_YEAR : e.getValue()));
        calendar.addDateClickListener(this::onDateClick);
        displayModesBox.setItems(MULTI_MONTH_YEAR, DAY_GRID_DAY, DAY_GRID_WEEK, DAY_GRID_MONTH, DAY_GRID_YEAR, TIME_GRID_DAY, TIME_GRID_WEEK, LIST_DAY, LIST_WEEK, LIST_MONTH, LIST_YEAR);
        displayModesBox.setItemLabelGenerator(messages::getMessage);
        displayModesBox.setValue(MULTI_MONTH_YEAR);

    }

    private void onDateClick(DateClickEvent event) {
        LocalDateTime clickedDate = event.getDateTime(); // Get clicked date & time
    }


    private boolean contextMenuHandler(FullCalendarCellContext context) {
        FullCalendarContextMenu contextMenu = calendar.getContextMenu();

        EntityCalendarEvent<Event> calendarEvent = context.getCalendarEvent();
        if (calendarEvent != null) {
            contextMenu.removeAll();

            contextMenu.addItem(messageBundle.getMessage("contextMenu.edit"),
                    clickEvent -> showEditDialog(context));
            contextMenu.addItem(messageBundle.getMessage("contextMenu.remove"),
                    clickEvent -> deleteEvent(calendarEvent)); // Вызов метода удаления

            return true;
        } else if (context.getDayCell() != null) {
            contextMenu.removeAll();
            contextMenu.addItem(messageBundle.getMessage("contextMenu.create"),
                    clickEvent -> showEditDialog(context));

            return true;
        }
        return false;
    }

    private void showEditDialog(FullCalendarCellContext context) {
        CalendarEvent calendarEvent = context.getCalendarEvent();

        dialogs.createInputDialog(this)
                .withHeader(messageBundle.getMessage("dialog.header"))
                .withParameters(
                        stringParameter("title")
                                .withLabel(messageBundle.getMessage("dialog.title.label"))
                                .withField(() -> {
                                    TypedTextField<String> field = uiComponents.create(TypedTextField.class);
                                    field.setWidthFull();
                                    field.setTypedValue(calendarEvent == null ? null : calendarEvent.getTitle());
                                    field.setEnabled(calendarEvent == null);
                                    field.setRequired(true);
                                    return field;
                                }),
                        booleanParameter("allDay")
                                .withLabel(messageBundle.getMessage("dialog.allDay.label"))
                                .withDefaultValue(calendarEvent == null ? null : calendarEvent.getAllDay()),
                        localDateTimeParameter("startDate")
                                .withLabel(messageBundle.getMessage("dialog.startDate.label"))
                                .withDefaultValue(calendarEvent == null ? null : calendarEvent.getStartDateTime())
                                .withRequired(true),
                        localDateTimeParameter("endDate")
                                .withLabel(messageBundle.getMessage("dialog.endDate.label"))
                                .withDefaultValue(calendarEvent == null ? null : calendarEvent.getEndDateTime())
                                .withRequired(true),
                        entityParameter("user", User.class)
                                .withLabel(messageBundle.getMessage("dialog.user.label"))
                                .withDefaultValue(calendarEvent == null ? ((User) currentAuthentication.getUser()) : (calendarEvent instanceof EntityCalendarEvent) ? ((Event) ((EntityCalendarEvent) calendarEvent).getEntity()).getUser() : ((User) currentAuthentication.getUser()))
                                .withField(() -> {
                                    JmixComboBox<User> userComboBox = uiComponents.create(JmixComboBox.class);
                                    userComboBox.setWidthFull();
                                    if (!isAdmin()) {
                                        userComboBox.setItems((User) currentAuthentication.getUser());
                                        userComboBox.setValue((User) currentAuthentication.getUser()); // Автоматически устанавливаем значение
                                        userComboBox.setReadOnly(true);
                                    } else {
                                        userComboBox.setItems(dataManager.load(User.class).all().list());
                                        userComboBox.setValue((User) currentAuthentication.getUser());
                                    }
                                    return userComboBox;
                                }))
                .withActions(DialogActions.OK_CANCEL, result -> {
                    if (result.getCloseActionType() == DialogAction.Type.OK) {
                        User selectedUser = result.getValue("user");
                        if (calendarEvent == null) {
                            Event event = metadata.create(Event.class);
                            event.setEventTitle(result.getValue("title"));
                            event.setAllDay(result.getValue("allDay"));
                            event.setStartDate(result.getValue("startDate"));
                            event.setEndDate(result.getValue("endDate"));
                            event.setUser(selectedUser);
                            eventsDc.getMutableItems().add(event);
                            try {
                                dataManager.save(event);
                                notifications.show("События успешно добавлено!");
                            } catch (Exception e) {
                                notifications.show("При обавлении события произошла ошибка: " + e.getMessage(), String.valueOf(Notifications.Type.ERROR));
                            }
                        } else {
                            calendarEvent.setAllDay(result.getValue("allDay"));
                            calendarEvent.setStartDateTime(result.getValue("startDate"));
                            calendarEvent.setEndDateTime(result.getValue("endDate"));

                            Event existingEvent = eventsDc.getItem(calendarEvent.getId());
                            if (existingEvent != null) {
                                existingEvent.setEventTitle(result.getValue("title"));
                                existingEvent.setAllDay(result.getValue("allDay"));
                                existingEvent.setStartDate(result.getValue("startDate"));
                                existingEvent.setEndDate(result.getValue("endDate")); // Используем полученное значение endDate
                                existingEvent.setUser(selectedUser);
                                try {
                                    dataManager.save(existingEvent);
                                    notifications.show("Event updated successfully");
                                } catch (Exception e) {
                                    notifications.show("Error updating event: " + e.getMessage(), String.valueOf(Notifications.Type.ERROR));
                                }
                            }

                        }
                    }
                })
                .open();
    }


    private boolean isAdmin() {
        Collection<? extends GrantedAuthority> authorities = SecurityContextHelper.getAuthentication().getAuthorities();
        return authorities.stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_system-full-access"));
    }

    private void deleteEvent(EntityCalendarEvent<Event> calendarEvent) {
        Event existingEvent = eventsDc.getItem(calendarEvent.getEntity().getId());
        if (existingEvent != null) {
            try {
                dataManager.remove(existingEvent);
                eventsDc.getMutableItems().remove(existingEvent);
                notifications.show("Событие успешно удалено!");
            } catch (Exception e) {
                notifications.show("При удалении события произошла ошибка: " + e.getMessage(), String.valueOf(Notifications.Type.ERROR));
            }
        }
    }

// Окраска календаря
    @Install(to = "calendar", subject = "dayCellClassNamesGenerator")
    private List<String> calendarDayCellClassNamesGenerator(final DayCellClassNamesContext context) {
        List<String> classes = new ArrayList<>(2);

        DayOfWeek dow = context.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            classes.add(WEEKEND_CLASS_NAME);
        }
        if (context.getDate().isEqual(LocalDate.now())) {
            classes.add(TODAY_CLASS_NAME);
        }
        return classes;
    }

    @Install(to = "calendar", subject = "dayHeaderClassNamesGenerator")
    private List<String> calendarDayHeaderClassNamesGenerator(final DayHeaderClassNamesContext context) {
        List<String> classes = new ArrayList<>(2);
        classes.add(DAY_HEADER_CLASS_NAME);

        DayOfWeek dow = context.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            classes.add(WEEKEND_CLASS_NAME);
        }
        if (dow == DayOfWeek.fromDayOfWeek(LocalDate.now().getDayOfWeek())) {
            classes.add(TODAY_CLASS_NAME);
        }
        return classes;
    }

}