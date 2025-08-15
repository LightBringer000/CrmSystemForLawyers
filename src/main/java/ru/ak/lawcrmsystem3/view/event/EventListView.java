package ru.ak.lawcrmsystem3.view.event;

import com.vaadin.flow.router.Route;
import io.jmix.core.security.CurrentAuthentication;
import io.jmix.flowui.model.CollectionContainer;
import io.jmix.flowui.model.DataContext;
import io.jmix.flowui.view.*;
import org.springframework.beans.factory.annotation.Autowired;
import ru.ak.lawcrmsystem3.entity.Event;
import ru.ak.lawcrmsystem3.entity.User;
import ru.ak.lawcrmsystem3.view.main.MainView;

import java.time.*;
import java.util.List;


@Route(value = "events", layout = MainView.class)
@ViewController(id = "Event.list")
@ViewDescriptor(path = "event-list-view.xml")
@LookupComponent("eventsDataGrid")
@DialogMode(width = "64em")
public class EventListView extends StandardListView<Event> {

    @ViewComponent
    private CollectionContainer<Event> eventsDc;
    @ViewComponent
    private DataContext dataContext;
    @Autowired
    private CurrentAuthentication currentAuthentication;

    @Subscribe(target = Target.DATA_CONTEXT)
    public void onPreSave(final DataContext.PreSaveEvent event) {
        List<Event> events = eventsDc.getItems().stream()
                .filter(us -> us.getStartDate() == null)
                .toList();
        if (events.isEmpty()) {
            generateOnboardingResultsMeeting();
        }
    }

    protected void generateOnboardingResultsMeeting() {
        Event event = dataContext.create(Event.class);
        event.setEventTitle("Results meeting");
        event.setUser((User) currentAuthentication.getUser());

        int inDays = OffsetDateTime.now().getDayOfWeek() == DayOfWeek.FRIDAY ? 3 : 1;
        LocalDateTime start = LocalDateTime.of(
                LocalDate.now().plusDays(inDays),
                LocalTime.of(9, 30));

        event.setStartDate(start);
        event.setEndDate(start.plusMinutes(30));
    }
}