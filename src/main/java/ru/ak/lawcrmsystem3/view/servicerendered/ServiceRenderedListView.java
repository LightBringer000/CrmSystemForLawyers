package ru.ak.lawcrmsystem3.view.servicerendered;

import com.vaadin.flow.router.Route;
import io.jmix.flowui.view.*;
import ru.ak.lawcrmsystem3.entity.ServiceRendered;
import ru.ak.lawcrmsystem3.view.main.MainView;


@Route(value = "service-rendereds", layout = MainView.class)
@ViewController(id = "ServiceRendered.list")
@ViewDescriptor(path = "service-rendered-list-view.xml")
@LookupComponent("serviceRenderedsDataGrid")
@DialogMode(width = "64em")
public class ServiceRenderedListView extends StandardListView<ServiceRendered> {
}