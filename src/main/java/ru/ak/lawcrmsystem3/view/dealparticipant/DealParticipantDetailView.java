package ru.ak.lawcrmsystem3.view.dealparticipant;

import com.vaadin.flow.router.Route;
import io.jmix.flowui.view.EditedEntityContainer;
import io.jmix.flowui.view.StandardDetailView;
import io.jmix.flowui.view.ViewController;
import io.jmix.flowui.view.ViewDescriptor;
import ru.ak.lawcrmsystem3.entity.DealParticipant;
import ru.ak.lawcrmsystem3.view.main.MainView;

@Route(value = "dealParticipants/:id", layout = MainView.class)
@ViewController(id = "DealParticipant.detail")
@ViewDescriptor(path = "deal-participant-detail-view.xml")
@EditedEntityContainer("dealParticipantDc")
public class DealParticipantDetailView extends StandardDetailView<DealParticipant> {
}