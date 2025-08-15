package ru.ak.lawcrmsystem3.view.legaldocumentdata;

import com.vaadin.flow.router.Route;
import io.jmix.flowui.view.*;
import ru.ak.lawcrmsystem3.entity.LegalDocumentData;
import ru.ak.lawcrmsystem3.view.main.MainView;


@Route(value = "legal-document-datas", layout = MainView.class)
@ViewController(id = "LegalDocumentData.list")
@ViewDescriptor(path = "legal-document-data-list-view.xml")
@LookupComponent("legalDocumentDatasDataGrid")
@DialogMode(width = "64em")
public class LegalDocumentDataListView extends StandardListView<LegalDocumentData> {
}