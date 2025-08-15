
console.log('serviceRendered.js started execution');

// Глобальные переменные для хранения данных счета
let currentInvoiceData = null;
let generatedPdf = null;
let generatedDoc = null;
let invoiceModuleInitialized = false;


// Создаем модальное окно для отображения списка дел
function createDealsModal() {
    console.log('Creating deals modal window');

    const modalHTML = `
    <div id="dealsModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;">
        <div style="background:white;width:90%;max-width:800px;margin:20px auto;padding:20px;border-radius:5px;max-height:80vh;overflow-y:auto;">
            <h2>Список дел</h2>
            <input type="text" id="dealsSearch" placeholder="Поиск по названию или номеру..." style="width:100%;padding:8px;margin:10px 0;">
            <div id="dealsList" style="margin:20px 0;"></div>
            <div style="display:flex;justify-content:space-between;">
                <button id="selectDeal" style="padding:8px 16px;background:#4CAF50;color:white;border:none;border-radius:4px;">Выбрать</button>
                <button id="closeModal" style="padding:8px 16px;background:#ddd;border:none;border-radius:4px;">Закрыть</button>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Обработчики модального окна
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('dealsModal').style.display = 'none';
    });
}

// Инициализация кнопок счета
function initInvoiceButtons() {
    const buttons = ['previewInvoiceBtn', 'generatePdfBtn', 'generateDocBtn', 'sendEmailBtn'];

    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            // Клонируем кнопку для сброса обработчиков
            const newBtn = btn.cloneNode(true);
            btn.replaceWith(newBtn);

            // Добавляем обработчики
            switch(btnId) {
                case 'previewInvoiceBtn':
                    newBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        showInvoicePreview();
                    });
                    break;
                case 'generatePdfBtn':
                    newBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        generatePdfInvoice();
                    });
                    break;
                case 'generateDocBtn':
                    newBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        generateDocInvoice();
                    });
                    break;
                case 'sendEmailBtn':
                    newBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        sendInvoiceByEmail();
                    });
                    break;
            }
        }
    });
}

// Инициализация для Vaadin Flow
if (window.Vaadin && window.Vaadin.Flow) {
    console.log('Vaadin Flow detected, using Flow init');

    window.Vaadin.Flow.initGlobal = function() {
        console.log('Vaadin Flow initialized, starting deal selection');
        handleDealSelection(true);
    };

    // Обработчик навигации
    if (window.Vaadin?.Flow?.navigation) {
        window.Vaadin.Flow.navigation.on('vaadin-navigated', (event) => {
            if (event.detail.route === 'invoice-view') { // Замените на ваш route
                console.log('Invoice route detected, reinitializing...');
                invoiceModuleInitialized = false;
                handleDealSelection(true);
                initInvoiceButtons();
            }
        });
    }
} else {
    // Стандартная инициализация
    console.log('Standard initialization');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM fully loaded');
        handleDealSelection(true);
        initInvoiceButtons();
    });
}

// MutationObserver для отслеживания изменений DOM
const invoiceObserver = new MutationObserver((mutations) => {
    const invoiceContainer = document.getElementById('services-container');
    if (invoiceContainer && !invoiceContainer.dataset.initialized) {
        invoiceContainer.dataset.initialized = true;
        handleDealSelection(true);
        initInvoiceButtons();
    }
});

invoiceObserver.observe(document.body, {
    childList: true,
    subtree: true
});

function calculateTotal() {
    // Получаем значение скидки
    const discountInput = document.getElementById('discount');
    const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;

    // Получаем значение оплаченной суммы
    const paidInput = document.getElementById('paid');
    const paid = paidInput ? parseFloat(paidInput.value) || 0 : 0;

    // Получаем общую сумму из отображения
    const subtotalAmount = document.getElementById('subtotal-amount');
    const subtotalText = subtotalAmount?.textContent || '0';
    const subtotal = parseFloat(subtotalText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

    // Рассчитываем скидку и остаток
    const discountAmount = subtotal * discount / 100;
    const total = subtotal - discountAmount;
    const remaining = total - paid;

    // Обновляем отображение
    const discountDisplay = document.getElementById('discount-display');
    const discountValue = document.getElementById('discount-value');
    const paidAmount = document.getElementById('paid-amount');
    const remainingAmount = document.getElementById('remaining-amount');

    if (discount > 0) {
        discountDisplay.style.display = 'flex';
        discountValue.textContent = formatCurrency(discountAmount);
    } else {
        discountDisplay.style.display = 'none';
    }

    if (paidAmount) {
        paidAmount.textContent = formatCurrency(paid);
    }

    if (remainingAmount) {
        remainingAmount.textContent = formatCurrency(remaining);
        remainingAmount.style.color = remaining > 0 ? 'red' : 'green';
    }
}

function renderAllServices(services) {
    const container = document.getElementById('services-container');
    if (!container) return;

    container.innerHTML = '';

    if (!services || services.length === 0) {
        container.innerHTML = '<p>По этой сделке нет услуг</p>';
        return;
    }

    // Создаем заголовок
    const header = document.createElement('h3');
    header.textContent = 'Перечень услуг оказанных в рамках договора и их стоимость:';
    container.appendChild(header);

    // Создаем таблицу для отображения услуг
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '10px';

    // Заголовки таблицы
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; border: 1px solid #ddd; width: 25%;">Название</th>
            <th style="padding: 8px; border: 1px solid #ddd; width: 30%;">Описание</th>
            <th style="padding: 8px; border: 1px solid #ddd; width: 15%;">Стоимость</th>
            <th style="padding: 8px; border: 1px solid #ddd; width: 10%;">Количество</th>
            <th style="padding: 8px; border: 1px solid #ddd; width: 20%;">Итого</th>
        </tr>
    `;
    table.appendChild(thead);

    // Тело таблицы
    const tbody = document.createElement('tbody');
    services.forEach(service => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #ddd';
        row.innerHTML = `
            <td style="padding: 8px; border: 1px solid #ddd;">${service.serviceName || ''}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${service.description || ''}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(service.serviceCost)}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${service.quantity || '1'}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurrency(service.totalCost)}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // Добавляем таблицу в контейнер
    container.appendChild(table);

    // Блок скидки и оплаты
    const discountSection = document.createElement('div');
    discountSection.className = 'discount-section';
    discountSection.style.margin = '15px 0';
    discountSection.style.padding = '10px';
    discountSection.style.backgroundColor = '#f9f9f9';
    discountSection.style.borderRadius = '4px';

    discountSection.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <label for="discount" style="margin-right: 10px;">Скидка (%):</label>
            <input type="number" id="discount" name="discount" min="0" max="100" value="0" style="width: 60px; padding: 5px;">
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <label for="paid" style="margin-right: 10px;">Оплачено:</label>
            <input type="number" id="paid" name="paid" min="0" step="0.01" value="${services[0]?.paid || 0}" style="width: 100px; padding: 5px;">
        </div>
    `;
    container.appendChild(discountSection);

    // Рассчитываем общие значения
    const subtotal = services.reduce((sum, service) => sum + (parseFloat(service.totalCost) || 0), 0);
    const paid = services.length > 0 ? (parseFloat(services[0].paid) || 0) : 0;

    // Отображаем итоговую информацию
    const totalElement = document.createElement('div');
    totalElement.style.marginTop = '10px';
    totalElement.style.padding = '10px';
    totalElement.style.backgroundColor = '#f9f9f9';
    totalElement.style.borderRadius = '4px';

    totalElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: bold;">Стоимость всех оказанных услуг:</span>
            <span id="subtotal-amount">${formatCurrency(subtotal)}</span>
        </div>
        <div id="discount-display" style="display: none; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: bold;">Скидка:</span>
            <span id="discount-value">0.00 ₽</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: bold;">Оплачено:</span>
            <span id="paid-amount">${formatCurrency(paid)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1.1em;">
            <span style="font-weight: bold;">Итоговая стоимость:</span>
            <span id="remaining-amount" style="color: ${subtotal - paid > 0 ? 'red' : 'green'}; font-weight: bold;">
                ${formatCurrency(subtotal - paid)}
            </span>
        </div>
    `;
    container.appendChild(totalElement);

    // Добавляем кнопки генерации счетов
    const invoiceButtons = document.createElement('div');
    invoiceButtons.style.marginTop = '20px';
    invoiceButtons.style.display = 'flex';
    invoiceButtons.style.gap = '10px';
    invoiceButtons.style.justifyContent = 'flex-end';

    invoiceButtons.innerHTML = `
        <button id="previewInvoiceBtn" style="padding:8px 16px;background:#2196F3;color:white;border:none;border-radius:4px;">
            <i class="fas fa-eye"></i> Предпросмотр
        </button>
        <button id="generatePdfBtn" style="padding:8px 16px;background:#e74c3c;color:white;border:none;border-radius:4px;">
            <i class="fas fa-file-pdf"></i> Скачать PDF
        </button>
        <button id="generateDocBtn" style="padding:8px 16px;background:#3498db;color:white;border:none;border-radius:4px;">
            <i class="fas fa-file-word"></i> Скачать DOC
        </button>
         <button id="sendEmailBtn" style="padding:8px 16px;background:#2ecc71;color:white;border:none;border-radius:4px;">
            <i class="fas fa-paper-plane"></i> Отправить по email
         </button>
    `;
    container.appendChild(invoiceButtons);

    // Обработчики для кнопок
    document.getElementById('discount')?.addEventListener('input', calculateTotal);
    document.getElementById('paid')?.addEventListener('input', calculateTotal);

    // Обработчики для кнопок с блокировкой всплытия
    document.getElementById('previewInvoiceBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    showInvoicePreview();
});

document.getElementById('generatePdfBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    generatePdfInvoice();
});

document.getElementById('generateDocBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    generateDocInvoice();
});

document.getElementById('sendEmailBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    sendInvoiceByEmail();
});


    // Сохраняем данные для генерации счета
    currentInvoiceData = {
        services,
        subtotal,
        paid,
        discount: 0,
        discountAmount: 0,
        total: subtotal,
        remaining: subtotal - paid
    };

    // Вызываем calculateTotal один раз при инициализации
    calculateTotal();
}

// Функция для форматирования денежных значений
function formatCurrency(value) {
    if (!value) return '0.00 ₽';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
}

// Функция для загрузки услуг по сделке
async function fetchDealServices(dealId) {
    try {
        const response = await fetch(`http://localhost:8080/rest/entities/ServiceRendered/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                filter: {
                    conditions: [{
                        property: "deal.id",
                        operator: "=",
                        value: dealId
                    }]
                },
                view: {
                    properties: ['serviceName', 'description', 'serviceCost', 'quantity', 'totalCost', 'paid']
                }
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log('Fetched services:', data);

        if (Array.isArray(data)) {
            return data.map(service => ({
                serviceName: service.serviceName || service.description || 'Без названия',
                description: service.description || '',
                serviceCost: service.serviceCost || 0,
                quantity: service.quantity || 1,
                totalCost: service.totalCost || 0,
                paid: service.paid || 0
            }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching services:', error);
        return [];
    }
}

// Функция для загрузки списка дел
async function fetchAllDeals() {
    console.log('Fetching all deals from API...');

    try {
        const response = await fetch('http://localhost:8080/rest/entities/Deal/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                filter: {
                    conditions: []
                },
                view: {
                    properties: ['id', 'title', 'dealNumber', 'createdDate']
                },
                limit: 100,
                sort: "createdDate,desc"
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Deals API response:', data);

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching deals:', error);
        showError('Ошибка при загрузке списка дел');
        return [];
    }
}

async function fetchClientEmailsByDealId(dealId) {
    try {
        const response = await fetch(`http://localhost:8080/rest/entities/Client/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                filter: {
                    conditions: [{
                        property: "deals.id",  // Используем имя ассоциации "deals" и свойство "id"
                        operator: "=",
                        value: dealId
                    }]
                },
                view: {
                    properties: ['email']
                }
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log('Fetched client emails:', data);

        if (Array.isArray(data)) {
            return data.map(client => client.email).filter(email => email);
        }
        return [];
    } catch (error) {
        console.error('Error fetching client emails:', error);
        return [];
    }
}

// Функция для отображения списка дел в модальном окне
function renderDealsList(deals) {
    const dealsList = document.getElementById('dealsList');
    dealsList.innerHTML = '';

    if (!deals || deals.length === 0) {
        dealsList.innerHTML = '<p>Дела не найдены</p>';
        return;
    }

    deals.forEach(deal => {
        const dealItem = document.createElement('div');
        dealItem.className = 'deal-item';
        dealItem.style.padding = '10px';
        dealItem.style.borderBottom = '1px solid #eee';
        dealItem.style.display = 'flex';
        dealItem.style.alignItems = 'center';

        dealItem.innerHTML = `
            <input type="radio" name="selectedDeal" value="${deal.id}" id="deal-${deal.id}" style="margin-right:10px;">
            <label for="deal-${deal.id}" style="flex-grow:1;">
                <strong>${deal.title || 'Без названия'}</strong>
                <div style="font-size:0.9em;color:#666;">
                    Номер дела: ${deal.dealNumber || 'Не указан'},
                    Дата: ${deal.createdDate ? new Date(deal.createdDate).toLocaleDateString() : 'Не указана'}
                </div>
            </label>
        `;

        dealsList.appendChild(dealItem);
    });

    // Добавляем поиск по title и dealNumber
    document.getElementById('dealsSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.deal-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
    });
}

// Функция для показа предпросмотра счета
async function showInvoicePreview() {
    if (!currentInvoiceData) {
        alert('Нет данных для предпросмотра');
        return;
    }

    // 1. Создаем новое окно браузера (не вкладку)
    const features = `
        width=${window.screen.width * 0.8},
        height=${window.screen.height * 0.9},
        left=${window.screen.width * 0.1},
        top=${window.screen.height * 0.05},
        menubar=no,
        toolbar=no,
        location=no,
        status=no
    `;
    const previewWindow = window.open('', '_blank', features);

    if (!previewWindow) {
        alert('Пожалуйста, разрешите всплывающие окна для этого сайта');
        return;
    }

    // 2. Генерируем HTML для предпросмотра
    updateInvoiceData();
    const invoiceHtml = generateInvoiceHtml(currentInvoiceData);

    // 3. Записываем содержимое в новое окно
    previewWindow.document.open();
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Предпросмотр счёта</title>
            <style>
                body {
                    font-family: Arial;
                    margin: 0;
                    padding: 20px;
                }
                .preview-toolbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    padding: 10px;
                    background: #f5f5f5;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    z-index: 1000;
                }
                .preview-content {
                    margin-top: 60px;
                }
                button {
                    padding: 8px 16px;
                    margin-left: 10px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        </head>
        <body>
            <div class="preview-toolbar">
                <h2 style="margin: 0;">Предпросмотр счёта</h2>
                <div>
                    <button id="printBtn" style="background: #FF9800; color: white;">
                        <i class="fas fa-print"></i> Печать
                    </button>
                    <button id="closeBtn" style="background: #ddd;">
                        <i class="fas fa-times"></i> Закрыть
                    </button>
                </div>
            </div>
            <div class="preview-content">
                ${invoiceHtml}
            </div>
            <script>
                document.getElementById('printBtn').addEventListener('click', () => {
                    window.print();
                });

                document.getElementById('closeBtn').addEventListener('click', () => {
                    window.close();
                });

                // Предотвращаем закрытие при печати
                window.onbeforeunload = null;
            </script>
        </body>
        </html>
    `);
    previewWindow.document.close();

    // 4. Фокус на новом окне
    previewWindow.focus();
}

async function generatePdfInvoice() {
    return new Promise((resolve) => {
        if (!currentInvoiceData) {
            alert('Нет данных для генерации PDF');
            return;
        }

        // 1. Создаем новое окно
        const generatorWindow = window.open('', '_blank', `
            width=1,
            height=1,
            left=-1000,
            top=-1000,
            menubar=no,
            toolbar=no,
            location=no,
            status=no
        `);

        if (!generatorWindow) {
            alert('Пожалуйста, разрешите всплывающие окна для этого сайта');
            return;
        }

        // 2. Генерируем HTML
        updateInvoiceData();
        const invoiceHtml = generateInvoiceHtml(currentInvoiceData);

        // 3. Загружаем библиотеки и генерируем PDF
        generatorWindow.document.open();
        generatorWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Генерация PDF</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
                <style>
                    #content {
                        width: 210mm;
                        margin: 0 auto;
                        padding: 20px;
                    }
                </style>
            </head>
            <body>
                <div id="content">${invoiceHtml}</div>
                <script>
                    (async function() {
                        try {
                            const { jsPDF } = window.jspdf;
                            const element = document.getElementById('content');

                            const canvas = await html2canvas(element, {
                                scale: 2,
                                logging: false,
                                useCORS: true
                            });

                            const pdf = new jsPDF({
                                orientation: 'portrait',
                                unit: 'mm',
                                format: 'a4'
                            });

                            const imgData = canvas.toDataURL('image/png');
                            const imgWidth = 210;
                            const pageHeight = 295;
                            const imgHeight = canvas.height * imgWidth / canvas.width;

                            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

                            // Генерируем Blob из PDF
                            const pdfBlob = pdf.output('blob');

                            // Возвращаем blob в родительское окно
                            window.opener.postMessage({
                                type: 'pdfGenerated',
                                blob: pdfBlob
                            }, '*');

                            // Скачиваем файл
                            pdf.save('Счет.pdf');

                        } catch (error) {
                            console.error('PDF generation error:', error);
                        } finally {
                            window.close();
                        }
                    })();
                </script>
            </body>
            </html>
        `);

        // Ожидаем сообщение от дочернего окна с blob
        window.addEventListener('message', (event) => {
            if (event.data.type === 'pdfGenerated') {
                // Сохраняем сгенерированный PDF
                generatedPdf = event.data.blob;
                resolve();
            }
        });

        generatorWindow.document.close();
    });
}

async function generateDocInvoice() {
    return new Promise((resolve) => {
        if (!currentInvoiceData) {
            alert('Нет данных для генерации DOC');
            return resolve();
        }

        updateInvoiceData();

        // Формируем безопасную строку с данными
        const invoiceData = {
            services: currentInvoiceData.services,
            subtotal: currentInvoiceData.subtotal,
            discount: currentInvoiceData.discount,
            paid: currentInvoiceData.paid,
            total: currentInvoiceData.total,
            remaining: currentInvoiceData.remaining
        };
        const dataString = JSON.stringify(invoiceData)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
            .replace(/'/g, "\\'");

        const generatorWindow = window.open('', '_blank', `
            width=1,height=1,left=-1000,top=-1000,
            menubar=no,toolbar=no,location=no,status=no
        `);

        if (!generatorWindow) {
            alert('Разрешите всплывающие окна для скачивания');
            return resolve();
        }

        generatorWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Генерация DOC</title>
                <script src="https://cdn.jsdelivr.net/npm/docx@7.8.0/build/index.js"></script>
                <script>
                    function formatCurrency(value) {
                        return parseFloat(value || 0).toFixed(2) + ' ₽';
                    }

                    async function generate() {
                        try {
                            const data = JSON.parse('${dataString}');
                            const { Document, Paragraph, TextRun, HeadingLevel,
                                    Table, TableRow, TableCell, AlignmentType, WidthType } = docx;

                            // Создаем элементы документа
                            const docElements = [
                                // Заголовок
                                new Paragraph({
                                    text: "Счёт на оплату",
                                    heading: HeadingLevel.HEADING_1,
                                    alignment: AlignmentType.CENTER,
                                    spacing: { after: 400 }
                                }),

                                // Информация о счете
                                new Paragraph({
                                    text: "Номер: INV-" + new Date().getFullYear() + "-" + Math.floor(Math.random()*1000),
                                    bold: true,
                                    spacing: { after: 200 }
                                }),

                                new Paragraph({
                                    text: "Дата: " + new Date().toLocaleDateString('ru-RU'),
                                    spacing: { after: 400 }
                                }),

                                // Таблица услуг
                                new Table({
                                    width: { size: 100, type: WidthType.PERCENTAGE },
                                    rows: [
                                        // Заголовки таблицы
                                        new TableRow({
                                            children: ["Услуга","Описание","Цена","Кол-во","Сумма"].map(text =>
                                                new TableCell({
                                                    children: [new Paragraph({ text, bold: true })],
                                                    shading: { fill: "DDDDDD" }
                                                })
                                            )
                                        }),

                                        // Данные услуг
                                        ...data.services.map(service => new TableRow({
                                            children: [
                                                service.serviceName || '',
                                                service.description || '',
                                                formatCurrency(service.serviceCost),
                                                service.quantity || '1',
                                                formatCurrency(service.totalCost)
                                            ].map(text => new TableCell({
                                                children: [new Paragraph(text)]
                                            }))
                                        }))
                                    ]
                                }),

                                // Итоговая информация
                                new Paragraph({
                                    text: "Итого: " + formatCurrency(data.subtotal),
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { before: 400 }
                                })
                            ];

                            // Добавляем скидку если есть
                            if (data.discount > 0) {
                                docElements.push(new Paragraph({
                                    text: "Скидка " + data.discount + "%: " +
                                          formatCurrency(data.subtotal * data.discount / 100),
                                    alignment: AlignmentType.RIGHT
                                }));
                            }

                            // Добавляем остальные элементы
                            docElements.push(
                                new Paragraph({
                                    text: "Итого к оплате: " + formatCurrency(data.total),
                                    alignment: AlignmentType.RIGHT,
                                    bold: true
                                }),
                                new Paragraph({
                                    text: "Оплачено: " + formatCurrency(data.paid),
                                    alignment: AlignmentType.RIGHT
                                }),
                                new Paragraph({
                                    text: "Остаток: " + formatCurrency(data.remaining),
                                    alignment: AlignmentType.RIGHT,
                                    bold: true,
                                    color: data.remaining > 0 ? "FF0000" : "00AA00"
                                })
                            );

                            // Создаем и скачиваем документ
                            const doc = new Document({ sections: [{ properties: {}, children: docElements }] });
                            const blob = await docx.Packer.toBlob(doc);

                            // Возвращаем blob в родительское окно
                            window.opener.postMessage({
                                type: 'docGenerated',
                                blob: blob
                            }, '*');

                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'Счет_' + new Date().toISOString().slice(0,10) + '.docx';
                            document.body.appendChild(a);
                            a.click();
                            setTimeout(() => {
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                window.close();
                            }, 100);

                        } catch (error) {
                            console.error('Ошибка генерации:', error);
                            alert('Ошибка: ' + error.message);
                        }
                    }

                    // Запускаем после загрузки библиотеки
                    if (window.docx) {
                        generate();
                    } else {
                        document.addEventListener('DOMContentLoaded', generate);
                    }
                </script>
            </head>
            <body>
                <p style="padding:20px">Идет генерация документа Word...</p>
            </body>
            </html>
        `);

        // Ожидаем сообщение от дочернего окна с blob
        window.addEventListener('message', (event) => {
            if (event.data.type === 'docGenerated') {
                // Сохраняем сгенерированный DOC
                generatedDoc = event.data.blob;
                resolve();
            }
        });

        generatorWindow.document.close();
    });
}

// Вспомогательная функция для генерации HTML счета
function generateInvoiceHtml(invoiceData) {
    return `
        <div style="font-family: Arial; max-width: 210mm; margin: 0 auto; padding: 20px;">
            <h1 style="text-align: center; margin-bottom: 30px;">Счёт на оплату</h1>

            <div style="margin-bottom: 30px;">
                <p><strong>Номер счета:</strong> INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}</p>
                <p><strong>Дата:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Услуга</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Описание</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Цена</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Кол-во</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Сумма</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoiceData.services.map(service => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">${service.serviceName || ''}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${service.description || ''}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(service.serviceCost)}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${service.quantity || '1'}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(service.totalCost)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="text-align: right; margin-top: 30px;">
                <p><strong>Итого без скидки:</strong> ${formatCurrency(invoiceData.subtotal)}</p>
                ${invoiceData.discount > 0 ? `
                    <p><strong>Скидка ${invoiceData.discount}%:</strong> ${formatCurrency(invoiceData.discountAmount)}</p>
                ` : ''}
                <p><strong>Итого к оплате:</strong> ${formatCurrency(invoiceData.total)}</p>
                <p><strong>Оплачено:</strong> ${formatCurrency(invoiceData.paid)}</p>
                <p><strong>Остаток:</strong>
                    <span style="color: ${invoiceData.remaining > 0 ? 'red' : 'green'};">
                        ${formatCurrency(invoiceData.remaining)}
                    </span>
                </p>
            </div>

            <div style="margin-top: 50px; display: flex; justify-content: space-between;">
                <div style="width: 200px; border-top: 1px solid #000; text-align: center;">
                    <p>Подпись исполнителя</p>
                </div>
                <div style="width: 200px; border-top: 1px solid #000; text-align: center;">
                    <p>Подпись клиента</p>
                </div>
            </div>
        </div>
    `;
}

async function sendInvoiceByEmail() {
    // Получаем ID текущей сделки
    const dealId = document.getElementById('deal-id').value;
    if (!dealId) {
        alert('Не выбрана сделка');
        return;
    }

    // Получаем email клиентов
    const clientEmails = await fetchClientEmailsByDealId(dealId);
//    if (clientEmails.length === 0) {
//        alert('У клиентов этой сделки не указаны email');
//        return;
//    }

if (clientEmails.length === 0) {
    // 1. Создаем или находим элемент для сообщения
    let notificationElement = document.getElementById('email-notification');
    if (!notificationElement) {
        notificationElement = document.createElement('div');
        notificationElement.id = 'email-notification';
        notificationElement.style.cssText = 'background-color: #ffe0b2; color: #e65100; padding: 10px; border-radius: 5px; margin-top: 10px; text-align: center;'; // Пример стилей
        // Добавьте элемент куда-нибудь в ваш DOM, например, перед кнопкой или формой
        document.body.prepend(notificationElement); // Или document.querySelector('#some-container').appendChild(notificationElement);
    }

    // 2. Устанавливаем текст сообщения
    notificationElement.textContent = 'У клиентов этой сделки не указаны email';
    notificationElement.style.display = 'block'; // Показываем элемент

    // 3. (Опционально) Скрываем сообщение через несколько секунд
    setTimeout(() => {
        notificationElement.style.display = 'none';
    }, 5000); // Сообщение исчезнет через 5 секунд

}
    // Объединяем email через запятую
    const recipientEmails = clientEmails.join(', ');

    // Показываем модальное окно с предзаполненными email
    document.getElementById('emailModal').style.display = 'block';
    document.getElementById('recipientEmail').value = recipientEmails;

    // Обработчики кнопок
    document.getElementById('sendPdfBtn').onclick = async function() {
        const additionalEmails = document.getElementById('recipientEmail').value;
        const allEmails = additionalEmails ?
            `${recipientEmails}, ${additionalEmails}` :
            recipientEmails;

        await generatePdfInvoice();
        await sendGeneratedFile(allEmails, 'pdf');
        document.getElementById('emailModal').style.display = 'none';
    };

    document.getElementById('sendDocBtn').onclick = async function() {
        const additionalEmails = document.getElementById('recipientEmail').value;
        const allEmails = additionalEmails ?
            `${recipientEmails}, ${additionalEmails}` :
            recipientEmails;

        await generateDocInvoice();
        await sendGeneratedFile(allEmails, 'doc');
        document.getElementById('emailModal').style.display = 'none';
    };

    document.getElementById('cancelSendBtn').onclick = function() {
        document.getElementById('emailModal').style.display = 'none';
    };
}

async function sendGeneratedFile(recipientEmails, fileType) {
    const emailBody = "Здравствуйте! Направляем Вам счёт за услуги, оказанные в рамках договора!";

    let fileBlob, fileName, fileMimeType;
    if (fileType === 'pdf') {
        fileBlob = generatedPdf;
        fileName = 'Счёт.pdf';
        fileMimeType = 'application/pdf';
    } else if (fileType === 'doc') {
        fileBlob = generatedDoc;
        fileName = 'Счёт.docx';
        fileMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    if (!fileBlob) {
        alert('Ошибка: файл не был сгенерирован');
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(fileBlob);

    await new Promise((resolve, reject) => {
        reader.onloadend = async () => {
            const base64String = reader.result.split(',')[1];

            // Подготовка данных для отправки
              const requestBody = {
                  content: emailBody,
                  clientEmail: Array.isArray(recipientEmails) ? recipientEmails.join(', ') : recipientEmails,
                  attachedFile: base64String,
                  attachedFileName: fileName,
                  attachedFileMimeType: fileMimeType
              };

            const sendBtn = document.getElementById('sendEmailBtn');
            const originalText = sendBtn.innerHTML;
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            sendBtn.disabled = true;

            try {
                const response = await fetch('http://localhost:8080/rest/entities/EmailEntityBrowse', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
                }

                alert('Счёт успешно отправлен!');
            } catch (error) {
                console.error('Error:', error);
                alert('Произошла ошибка при отправке: ' + error.message);
            } finally {
                sendBtn.innerHTML = originalText;
                sendBtn.disabled = false;
                resolve();
            }
        };

        reader.onerror = error => {
            alert('Ошибка при чтении файла: ' + error.message);
            reject(error);
        };
    });
}

// Функция для обновления данных счета
function updateInvoiceData() {
    if (!currentInvoiceData) return;

    // Получаем текущие значения скидки и оплаты
    const discountInput = document.getElementById('discount');
    const paidInput = document.getElementById('paid');

    const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;
    const paid = paidInput ? parseFloat(paidInput.value) || 0 : 0;

    // Обновляем данные счета
    currentInvoiceData.discount = discount;
    currentInvoiceData.paid = paid;
    currentInvoiceData.discountAmount = currentInvoiceData.subtotal * discount / 100;
    currentInvoiceData.total = currentInvoiceData.subtotal - currentInvoiceData.discountAmount;
    currentInvoiceData.remaining = currentInvoiceData.total - paid;
}

// Функция для показа уведомлений
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px;
        background: ${isError ? '#ffebee' : '#e8f5e9'};
        color: ${isError ? '#c62828' : '#2e7d32'};
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        display: flex;
        align-items: center;
    `;

    notification.innerHTML = `
        <i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"
           style="margin-right: 10px; font-size: 1.2em;"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Основная функция для обработки выбора дела
function handleDealSelection() {
    console.log('Initializing deal selection handler');

    try {
        const fetchDealBtn = document.getElementById('fetch-deal-services-btn');

        if (!fetchDealBtn) {
            console.error('Button not found, retrying...');
            setTimeout(handleDealSelection, 500);
            return;
        }

        console.log('Found button element:', fetchDealBtn);

        // Создаем модальное окно при инициализации
        createDealsModal();

        fetchDealBtn.addEventListener('click', async () => {
            console.log('Fetch deals button clicked');

            try {
                // Показываем модальное окно с загрузкой
                document.getElementById('dealsList').innerHTML = '<p>Загрузка списка дел...</p>';
                document.getElementById('dealsModal').style.display = 'block';

                // Загружаем дела
                const deals = await fetchAllDeals();

                // Отображаем список
                renderDealsList(deals);

                // Обработчик выбора дела
                document.getElementById('selectDeal').addEventListener('click', async () => {
                    const selectedDeal = document.querySelector('input[name="selectedDeal"]:checked');

                    if (selectedDeal) {
                        const dealId = selectedDeal.value;
                        document.getElementById('deal-id').value = dealId;
                        document.getElementById('dealsModal').style.display = 'none';
                        console.log('Selected deal ID:', dealId);

                        // Загружаем услуги по выбранной сделке
                        const services = await fetchDealServices(dealId);
                        console.log('Services to render:', services);

                        // Устанавливаем значение оплаченной суммы, если поле существует
                        const paidInput = document.getElementById('paid');
                        if (paidInput && services.length > 0) {
                            const paidValue = parseFloat(services[0].paid) || 0;
                            paidInput.value = paidValue.toFixed(2);
                        }

                        // Отображаем все услуги
                        renderAllServices(services);
                    } else {
                        alert('Пожалуйста, выберите дело из списка');
                    }
                });

            } catch (error) {
                console.error('Error in deal selection:', error);
                document.getElementById('dealsList').innerHTML = `
                    <p style="color:red;">Ошибка: ${error.message}</p>
                `;
            }
        });

        console.log('Deal selection handler initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// Инициализация для Vaadin Flow
if (window.Vaadin && window.Vaadin.Flow) {
    console.log('Vaadin Flow detected, using Flow init');

    window.Vaadin.Flow.initGlobal = function() {
        console.log('Vaadin Flow initialized, starting deal selection');
        handleDealSelection();
    };
} else {
    // Стандартная инициализация
    console.log('Standard initialization');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM fully loaded');
        handleDealSelection();
    });
}



// Fallback инициализация
setTimeout(function() {
    console.log('Fallback initialization after timeout');
    handleDealSelection(true);
    initInvoiceButtons();
}, 1000);

console.log('serviceRendered.js finished initial setup');