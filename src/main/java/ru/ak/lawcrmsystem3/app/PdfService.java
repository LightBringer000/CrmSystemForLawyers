package ru.ak.lawcrmsystem3.app;

import java.io.IOException;
import java.util.List;

public interface PdfService {

    byte[] createPdfWithRussianFont(String text) throws IOException;
    void showPdfInDialog(byte[] pdfBytes);
    List<String> wrapText(String text, int maxLineLength);
}
