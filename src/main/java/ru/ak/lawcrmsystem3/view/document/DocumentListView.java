package ru.ak.lawcrmsystem3.view.document;

import com.vaadin.flow.router.Route;
import io.jmix.flowui.view.*;
import ru.ak.lawcrmsystem3.entity.Document;
import ru.ak.lawcrmsystem3.view.main.MainView;


@Route(value = "documents", layout = MainView.class)
@ViewController(id = "Document.list")
@ViewDescriptor(path = "document-list-view.xml")
@LookupComponent("documentsDataGrid")
@DialogMode(width = "64em")
public class DocumentListView extends StandardListView<Document> {
}