package ru.ak.lawcrmsystem3.app;

import fr.opensagres.poi.xwpf.converter.pdf.PdfConverter;
import fr.opensagres.poi.xwpf.converter.pdf.PdfOptions;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

@Component
public class DocToPdfConverter {

public byte[] convertToPdf(InputStream docStream) throws Exception {
    try {
        // 1. Загружаем DOCX документ
        XWPFDocument document = new XWPFDocument(docStream);

        // 2. Настраиваем конвертацию
        PdfOptions options = PdfOptions.create();

        // 3. Конвертируем в PDF
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfConverter.getInstance().convert(document, out, options);

        return out.toByteArray();
    } catch (Exception e) {
        throw new RuntimeException("Ошибка конвертации DOCX в PDF", e);
    }
}

}