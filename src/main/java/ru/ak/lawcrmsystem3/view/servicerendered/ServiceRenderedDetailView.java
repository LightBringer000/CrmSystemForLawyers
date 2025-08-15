package ru.ak.lawcrmsystem3.view.servicerendered;

import com.vaadin.flow.router.Route;
import io.jmix.flowui.view.EditedEntityContainer;
import io.jmix.flowui.view.StandardDetailView;
import io.jmix.flowui.view.ViewController;
import io.jmix.flowui.view.ViewDescriptor;
import ru.ak.lawcrmsystem3.entity.ServiceRendered;
import ru.ak.lawcrmsystem3.view.main.MainView;

@Route(value = "service-rendereds/:id", layout = MainView.class)
@ViewController(id = "ServiceRendered.detail")
@ViewDescriptor(path = "service-rendered-detail-view.xml")
@EditedEntityContainer("serviceRenderedDc")
public class ServiceRenderedDetailView extends StandardDetailView<ServiceRendered> {
}