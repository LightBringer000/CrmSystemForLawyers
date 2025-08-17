package ru.ak.lawcrmsystem3.app;

import org.apache.commons.lang3.StringUtils;
import org.apache.poi.util.Units;
import org.apache.poi.xwpf.usermodel.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;
import ru.ak.lawcrmsystem3.entity.LegalDocumentData;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;


@Component
public class DocumentGeneratorService {

    private static final String FONT_FAMILY = "Times New Roman";
    private static final int FONT_SIZE = 12; // В пунктах
    private static final double LINE_SPACING_MULTIPLIER = 1.15; // Интервал между строк
    private static final int PARAGRAPH_LEFT_INDENT_EMU = (int) (1.20 * 360000); // 1.20 см в EMUs для ОБЩЕГО левого отступа
    private static final int PARAGRAPH_FIRST_LINE_INDENT_EMU = (int) (1.20 * 360000); // 1.20 см в EMUs для отступа ПЕРВОЙ СТРОКИ
    private static final int SECTION_SPACING_AFTER = 500; // Дополнительный отступ между секциями (в TWIPs, 1/20 пункта)
    private static final int LIST_ITEM_LEFT_INDENT_EMU = (int) (0.63 * 360000); // Примерно 0.63 см для стандартного списка

    public void generateLegalDocument(LegalDocumentData data, String outputPath) throws IOException {
        XWPFDocument document = new XWPFDocument();

        // 1. Кому: (выравнивание по правому краю, без абзацного отступа)
        if (StringUtils.isNotBlank(data.getTo())) {
            // Для "Кому" не нужен общий отступ, и отступ первой строки тоже не нужен.
            createSimpleSection(document, "Кому:", data.getTo(), ParagraphAlignment.RIGHT, 0, 0);
        }

        // 2. От кого: (по правому краю)
        if (StringUtils.isNotBlank(data.getFrom())) {
            createListSection(document, "От кого:", splitString(data.getFrom()), ParagraphAlignment.RIGHT);
        }

        // 3. Участники: (по правому краю)
        if (StringUtils.isNotBlank(data.getParticipants())) {
            createListSection(document, "Участники:", splitString(data.getParticipants()), ParagraphAlignment.RIGHT);
        }

        // 4. Дополнительная информация: (по правому краю)
        if (StringUtils.isNotBlank(data.getOtherInfo())) {
            createListSection(document, "Дополнительная информация:", splitString(data.getOtherInfo()), ParagraphAlignment.RIGHT);
        }

        // 5. Название документа (по центру)
        if (StringUtils.isNotBlank(data.getTitle())) {
            createTitle(document, data.getTitle());
        }

        // 6. Содержание документа (по ширине, с общим левым отступом и отступом первой строки)
        if (StringUtils.isNotBlank(data.getContent())) {
            createContent(document, data.getContent());
        }
        addSpaceBetweenSections(document); // Пробел после Содержания


        // 7. Просительная часть (по ширине, с общим левым отступом и отступом первой строки)
        if (StringUtils.isNotBlank(data.getRequests())) {
            createRequestSection(document, splitString(data.getRequests()));
        }
        addSpaceBetweenSections(document); // Пробел после Просительной части


        // 8. Приложения (по ширине, с общим левым отступом и отступом первой строки)
        if (StringUtils.isNotBlank(data.getAttachments())) {
            createAttachments(document, splitString(data.getAttachments()));
        }

        // 9. Подписанты (по ширине, с общим левым отступом и отступом первой строки)
        if (StringUtils.isNotBlank(data.getSignatories())) {
            createSignatories(document, splitString(data.getSignatories()));
        }

        // Сохранение
        try (FileOutputStream out = new FileOutputStream(outputPath)) {
            document.write(out);
        }
        document.close();
    }

    /**
     * Добавляет пустой параграф для создания пробела между секциями.
     */
    private void addSpaceBetweenSections(XWPFDocument document) {
        XWPFParagraph paragraph = document.createParagraph();
        paragraph.setSpacingAfter(SECTION_SPACING_AFTER);
        paragraph.setSpacingLineRule(LineSpacingRule.AUTO);
        // setSpacingBetween используется для множителя интервала, а не для конкретного значения.
        // Для double множителя используйте setSpacingBetween с STLineSpacingRule.AT_LEAST или AUTO.
        // Здесь используем STLineSpacingRule.AUTO для гибкости.
        paragraph.setSpacingBetween(LINE_SPACING_MULTIPLIER * 240); // 1 point = 20 TWIPs, 1 TWIP = 1/20 point. 240 EMU per point.
        // Умножаем на 240, чтобы получить TWIPs для множителя
    }

    // Вспомогательный метод для настройки стандартных параметров параграфа
    // Теперь принимает 'leftIndent' (общий левый) и 'firstLineIndent' (отступ первой строки)
    private XWPFParagraph setupParagraph(XWPFDocument document, ParagraphAlignment alignment, int leftIndent, int firstLineIndent) {
        XWPFParagraph paragraph = document.createParagraph();
        paragraph.setAlignment(alignment);
        paragraph.setSpacingLineRule(LineSpacingRule.AUTO);
        paragraph.setSpacingBetween(LINE_SPACING_MULTIPLIER); // Интервал между строк

        // Общий левый отступ для всего абзаца
        if (leftIndent > 0) {
            paragraph.setIndentationLeft(leftIndent);
        } else {
            paragraph.setIndentationLeft(0);
        }

        // Отступ первой строки
        // Положительное значение для обычного отступа, отрицательное для висячего
        paragraph.setIndentationFirstLine(firstLineIndent);
        return paragraph;
    }

    // Вспомогательный метод для настройки стандартных параметров Run
    private void setupRun(XWPFRun run) {
        run.setFontFamily(FONT_FAMILY);
        run.setFontSize(FONT_SIZE);
    }

    // Изменена сигнатура, чтобы передавать firstLineIndent
    private void createSimpleSection(XWPFDocument document, String sectionName, String content, ParagraphAlignment alignment, int leftIndent, int firstLineIndent) {
        // Simple sections (Кому) не нужны отступы, кроме случаев, когда они являются элементом списка.
        // Передаем 0 для leftIndent и firstLineIndent, если не хотим отступов.
        XWPFParagraph paragraph = setupParagraph(document, alignment, leftIndent, firstLineIndent);
        paragraph.setSpacingAfter(200);

        XWPFRun titleRun = paragraph.createRun();
        setupRun(titleRun);
        titleRun.setText(sectionName);
        titleRun.setBold(true);

        XWPFRun contentRun = paragraph.createRun();
        setupRun(contentRun);
        contentRun.setText(" " + content);
    }

    private void createListSection(XWPFDocument document, String sectionName, List<String> items, ParagraphAlignment alignment) {
        // Для заголовка списка не нужен общий отступ или отступ первой строки
        XWPFParagraph titleParagraph = setupParagraph(document, alignment, 0, 0);
        titleParagraph.setSpacingAfter(100);

        XWPFRun titleRun = titleParagraph.createRun();
        setupRun(titleRun);
        titleRun.setText(sectionName);
        titleRun.setBold(true);

        for (String item : items) {
            // Для элементов списка по умолчанию начинаем без общего левого отступа
            XWPFParagraph itemParagraph = setupParagraph(document, alignment, 0, 0);

            if (alignment == ParagraphAlignment.RIGHT) {
                // Для списков по правому краю, может потребоваться отступ от правого края
                itemParagraph.setIndentationRight(LIST_ITEM_LEFT_INDENT_EMU);
                // Если нужен висячий отступ (маркер левее текста), это сложнее с правым выравниванием
                // В этом случае отступ первой строки будет отрицательным относительно setIndentationRight.
                // Для простоты, здесь оставим только правый отступ.
            } else {
                // Для обычных списков по левому краю используем висячий отступ
                itemParagraph.setIndentationLeft(LIST_ITEM_LEFT_INDENT_EMU); // Левый отступ для всего параграфа
                itemParagraph.setIndentationHanging(LIST_ITEM_LEFT_INDENT_EMU); // Смещение первой строки влево (маркера) - делаем его равным левому отступу для правильного выравнивания маркера.
            }
            itemParagraph.setSpacingAfter(100);

            XWPFRun itemRun = itemParagraph.createRun();
            setupRun(itemRun);
            itemRun.setText("• " + item); // Маркер списка
        }

        // Пробел после списка
        XWPFParagraph spaceParagraph = setupParagraph(document, ParagraphAlignment.LEFT, 0, 0);
        spaceParagraph.setSpacingAfter(200);
    }


    private List<String> splitString(String input) {
        if (input == null || input.trim().isEmpty()) {
            return Collections.emptyList();
        }

        return Arrays.stream(input.split("\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private void createTitle(XWPFDocument document, String titleText) {
        // Для заголовка не нужен общий отступ или отступ первой строки
        XWPFParagraph title = setupParagraph(document, ParagraphAlignment.CENTER, 0, 0);
        title.setSpacingAfter(300);
        XWPFRun titleRun = title.createRun();
        setupRun(titleRun);
        titleRun.setText(titleText);
        titleRun.setBold(true);
        titleRun.setFontSize(14);
    }

    // Изменен, чтобы использовать leftIndent и firstLineIndent
    private void createParagraphWithIndent(XWPFDocument document, String text, ParagraphAlignment alignment, int leftIndent, int firstLineIndent) {
        XWPFParagraph paragraph = setupParagraph(document, alignment, leftIndent, firstLineIndent);
        XWPFRun run = paragraph.createRun();
        setupRun(run);
        run.setText(text);
    }

//    private void createContent(XWPFDocument document, String content) {
//        List<String> paragraphs = splitString(content);
//        for (String paraText : paragraphs) {
//            // Для содержания используем общий левый отступ И отступ первой строки
//            createParagraphWithIndent(document, paraText, ParagraphAlignment.BOTH, PARAGRAPH_LEFT_INDENT_EMU, PARAGRAPH_FIRST_LINE_INDENT_EMU);
//        }
//    }

    //=======================new the last
//    private void createContent(XWPFDocument document, String contentHtml) {
//        // 1. Parse the HTML using a library like Jsoup
//        org.jsoup.nodes.Document doc = Jsoup.parse(contentHtml);
//        org.jsoup.select.Elements paragraphs = doc.select("p, h1, h2, h3, ul, ol, img");
//
//        for (org.jsoup.nodes.Element element : paragraphs) {
//            if (element.tagName().equals("p") || element.tagName().startsWith("h")) {
//                // Handle text paragraphs and headings
//                XWPFParagraph paragraph = setupParagraph(document, ParagraphAlignment.BOTH, PARAGRAPH_LEFT_INDENT_EMU, PARAGRAPH_FIRST_LINE_INDENT_EMU);
//                XWPFRun run = paragraph.createRun();
//                setupRun(run);
//
//                // Handle bold, italic, etc., from the HTML
//                if (element.select("b, strong").size() > 0) {
//                    run.setBold(true);
//                }
//                if (element.select("i, em").size() > 0) {
//                    run.setItalic(true);
//                }
//                // You would need to add more logic for other tags like u, s, sup, sub, a...
//
//                run.setText(element.text());
//            } else if (element.tagName().equals("img")) {
//                // Handle images
//                String src = element.attr("src");
//                if (src.startsWith("data:image")) {
//                    // Extract Base64 and image type
//                    String[] parts = src.split(",");
//                    String mimeType = parts[0].split(":")[1].split(";")[0];
//                    String base64Data = parts[1];
//
//                    try {
//                        byte[] imageBytes = Base64.getDecoder().decode(base64Data);
//                        // Create a paragraph for the image
//                        XWPFParagraph paragraph = document.createParagraph();
//                        paragraph.setAlignment(ParagraphAlignment.CENTER); // Center the image
//
//                        // Add the image to the paragraph
//                        XWPFRun run = paragraph.createRun();
//                        run.addPicture(
//                                new ByteArrayInputStream(imageBytes),
//                                getPictureType(mimeType),
//                                "image." + mimeType.substring(mimeType.lastIndexOf("/") + 1),
//                                Units.toEMU(200), // Width in EMU (adjust as needed)
//                                Units.toEMU(200)  // Height in EMU (adjust as needed)
//                        );
//                    } catch (Exception e) {
//                        // Log the error
//                        System.err.println("Error processing image: " + e.getMessage());
//                    }
//                }
//            }
//        }
//    }
//    private int getPictureType(String mimeType) {
//        if (mimeType.contains("jpeg")) {
//            return XWPFDocument.PICTURE_TYPE_JPEG;
//        } else if (mimeType.contains("png")) {
//            return XWPFDocument.PICTURE_TYPE_PNG;
//        } else if (mimeType.contains("gif")) {
//            return XWPFDocument.PICTURE_TYPE_GIF;
//        }
//        return XWPFDocument.PICTURE_TYPE_PICT;
//    }

    private void createContent(XWPFDocument document, String contentHtml) {
        // 1. Parse the HTML using Jsoup
        org.jsoup.nodes.Document doc = Jsoup.parse(contentHtml);
        Elements paragraphs = doc.select("p, h1, h2, h3, ul, ol, img, b, i, strong, em");

        for (Element element : paragraphs) {
            if (element.tagName().equals("p") || element.tagName().startsWith("h")) {
                // Обработка текстовых абзацев и заголовков
                XWPFParagraph paragraph = setupParagraph(document, ParagraphAlignment.BOTH, PARAGRAPH_LEFT_INDENT_EMU, PARAGRAPH_FIRST_LINE_INDENT_EMU);
                XWPFRun run = paragraph.createRun();
                setupRun(run);

                // Обработка форматирования (жирный, курсив и т.д.)
                if (element.select("b, strong").size() > 0) {
                    run.setBold(true);
                }
                if (element.select("i, em").size() > 0) {
                    run.setItalic(true);
                }

                run.setText(element.text());
            } else if (element.tagName().equals("img")) {
                // Обработка изображений
                String src = element.attr("src");
                if (src.startsWith("data:image")) {
                    // Извлечение Base64 и типа изображения
                    String[] parts = src.split(",");
                    String mimeType = parts[0].split(":")[1].split(";")[0];
                    String base64Data = parts[1];

                    try {
                        byte[] imageBytes = Base64.getDecoder().decode(base64Data);

                        // Получаем оригинальные размеры изображения для пропорционального масштабирования
                        BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(imageBytes));
                        if (originalImage == null) {
                            System.err.println("Failed to read image data.");
                            continue;
                        }
                        int originalWidth = originalImage.getWidth();
                        int originalHeight = originalImage.getHeight();

                        // Задаем желаемую ширину в пикселях.
                        // Для формата A4, ширина страницы (без полей) примерно 595 пикселей (при 72 dpi).
                        // Установка 450-500px позволяет изображению вписаться с отступами.
                        int desiredWidthInPx = 450;
                        int desiredHeightInPx = (int) ((double) originalHeight * desiredWidthInPx / originalWidth);

                        // Создаем абзац для изображения и центрируем его
                        XWPFParagraph paragraph = document.createParagraph();
                        paragraph.setAlignment(ParagraphAlignment.CENTER);

                        // Добавляем изображение с вычисленными размерами в EMU
                        XWPFRun run = paragraph.createRun();
                        run.addPicture(
                                new ByteArrayInputStream(imageBytes),
                                getPictureType(mimeType),
                                "image." + mimeType.substring(mimeType.lastIndexOf("/") + 1),
                                Units.toEMU(desiredWidthInPx),
                                Units.toEMU(desiredHeightInPx)
                        );
                    } catch (IOException e) {
                        System.err.println("Error processing image data: " + e.getMessage());
                    } catch (Exception e) {
                        System.err.println("Error processing element: " + e.getMessage());
                    }
                }
            }
            // ... можно добавить обработку других тегов (ul, ol)
        }}
    private int getPictureType(String mimeType) {
        if (mimeType.contains("jpeg")) {
            return XWPFDocument.PICTURE_TYPE_JPEG;
        } else if (mimeType.contains("png")) {
            return XWPFDocument.PICTURE_TYPE_PNG;
        } else if (mimeType.contains("gif")) {
            return XWPFDocument.PICTURE_TYPE_GIF;
        }
        return XWPFDocument.PICTURE_TYPE_PICT;
    }

    //=======================new the last


    private void createRequestSection(XWPFDocument document, List<String> requests) {
        // Для заголовка "ПРОШУ:" не нужен общий отступ или отступ первой строки
        XWPFParagraph titleParagraph = setupParagraph(document, ParagraphAlignment.LEFT, 0, 0);
        XWPFRun titleRun = titleParagraph.createRun();
        setupRun(titleRun);
        titleRun.setText("ПРОШУ:");
        titleRun.setBold(true);

        for (int i = 0; i < requests.size(); i++) {
            // Для пунктов просительной части используем общий левый отступ И отступ первой строки
            XWPFParagraph requestParagraph = setupParagraph(document, ParagraphAlignment.BOTH, PARAGRAPH_LEFT_INDENT_EMU, PARAGRAPH_FIRST_LINE_INDENT_EMU);
            XWPFRun requestRun = requestParagraph.createRun();
            setupRun(requestRun);
            requestRun.setText((i + 1) + ". " + requests.get(i));
        }
    }

    private void createAttachments(XWPFDocument document, List<String> attachments) {
        // Для заголовка "Приложения:" не нужен общий отступ или отступ первой строки
        XWPFParagraph titleParagraph = setupParagraph(document, ParagraphAlignment.LEFT, 0, 0);
        XWPFRun titleRun = titleParagraph.createRun();
        setupRun(titleRun);
        titleRun.setText("Приложения:");
        titleRun.setBold(true);

        for (int i = 0; i < attachments.size(); i++) {
            // Для пунктов приложений используем общий левый отступ И отступ первой строки
            XWPFParagraph attachmentParagraph = setupParagraph(document, ParagraphAlignment.BOTH, PARAGRAPH_LEFT_INDENT_EMU, PARAGRAPH_FIRST_LINE_INDENT_EMU);
            XWPFRun attachmentRun = attachmentParagraph.createRun();
            setupRun(attachmentRun);
            attachmentRun.setText((i + 1) + ". " + attachments.get(i));
        }
    }

    private void createSignatories(XWPFDocument document, List<String> signatories) {
        // Добавляем отступ перед секцией подписантов, если нужно
        addSpaceBetweenSections(document);

        for (String signatory : signatories) {
            // Для подписантов используем выравнивание по ширине (BOTH),
            // общий левый отступ и отступ первой строки,
            // аналогично основному содержанию.
            XWPFParagraph signatoryParagraph = setupParagraph(document, ParagraphAlignment.BOTH, PARAGRAPH_LEFT_INDENT_EMU, PARAGRAPH_FIRST_LINE_INDENT_EMU);
            signatoryParagraph.setSpacingAfter(100); // Небольшой отступ после каждой строки подписанта

            XWPFRun signatoryRun = signatoryParagraph.createRun();
            setupRun(signatoryRun);
            signatoryRun.setText(signatory);
        }
    }

}