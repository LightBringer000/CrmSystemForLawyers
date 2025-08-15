package ru.ak.lawcrmsystem3.view.dealparticipant;

import com.vaadin.flow.router.Route;
import io.jmix.flowui.view.*;
import ru.ak.lawcrmsystem3.entity.DealParticipant;
import ru.ak.lawcrmsystem3.view.main.MainView;


@Route(value = "dealParticipants", layout = MainView.class)
@ViewController(id = "DealParticipant.list")
@ViewDescriptor(path = "deal-participant-list-view.xml")
@LookupComponent("dealParticipantsDataGrid")
@DialogMode(width = "64em")
public class DealParticipantListView extends StandardListView<DealParticipant> {
}