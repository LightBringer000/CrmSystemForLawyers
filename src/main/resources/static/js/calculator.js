// Глобальные переменные состояния
let calculatorInitialized = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;
const domObservers = [];
const rateCache = new Map();
const ratePeriodsCache = new Map();
const CBR_RATE_HISTORY = [
{ start: new Date('2025-07-28'), end: new Date('9999-12-31'), rate: 18.00 },
{ start: new Date('2025-06-09'), end: new Date('2025-07-27'), rate: 20.00 },
{ start: new Date('2024-10-28'), end: new Date('2025-06-08'), rate: 21.00 },
{ start: new Date('2024-09-16'), end: new Date('2024-10-27'), rate: 19.00 },
{ start: new Date('2024-07-29'), end: new Date('2024-09-15'), rate: 18.00 },
{ start: new Date('2023-12-18'), end: new Date('2024-07-28'), rate: 16.00 },
{ start: new Date('2023-10-30'), end: new Date('2023-12-17'), rate: 15.00 },
{ start: new Date('2023-09-18'), end: new Date('2023-10-29'), rate: 13.00 },
{ start: new Date('2023-08-15'), end: new Date('2023-09-17'), rate: 12.00 },
{ start: new Date('2023-07-24'), end: new Date('2023-08-14'), rate: 8.50 },
{ start: new Date('2022-09-19'), end: new Date('2023-07-23'), rate: 7.50 },
{ start: new Date('2022-07-25'), end: new Date('2022-09-18'), rate: 8.00 },
{ start: new Date('2022-06-14'), end: new Date('2022-07-24'), rate: 9.50 },
{ start: new Date('2022-05-27'), end: new Date('2022-06-13'), rate: 11.00 },
{ start: new Date('2022-05-04'), end: new Date('2022-05-26'), rate: 14.00 },
{ start: new Date('2022-04-11'), end: new Date('2022-05-03'), rate: 17.00 },
{ start: new Date('2022-02-28'), end: new Date('2022-04-10'), rate: 20.00 },
{ start: new Date('2022-02-14'), end: new Date('2022-02-27'), rate: 9.50 },
{ start: new Date('2021-12-20'), end: new Date('2022-02-13'), rate: 8.50 },
{ start: new Date('2021-10-25'), end: new Date('2021-12-19'), rate: 7.50 },
{ start: new Date('2021-09-13'), end: new Date('2021-10-24'), rate: 6.75 },
{ start: new Date('2021-07-26'), end: new Date('2021-09-12'), rate: 6.50 },
{ start: new Date('2021-06-15'), end: new Date('2021-07-25'), rate: 5.50 },
{ start: new Date('2021-04-26'), end: new Date('2021-06-14'), rate: 5.00 },
{ start: new Date('2021-03-22'), end: new Date('2021-04-25'), rate: 4.50 },
{ start: new Date('2020-07-27'), end: new Date('2021-03-21'), rate: 4.25 },
{ start: new Date('2020-06-22'), end: new Date('2020-07-26'), rate: 4.50 },
{ start: new Date('2020-04-27'), end: new Date('2020-06-21'), rate: 5.50 },
{ start: new Date('2020-02-10'), end: new Date('2020-04-26'), rate: 6.00 },
{ start: new Date('2019-12-16'), end: new Date('2020-02-09'), rate: 6.25 },
{ start: new Date('2019-10-28'), end: new Date('2019-12-15'), rate: 6.50 },
{ start: new Date('2019-09-09'), end: new Date('2019-10-27'), rate: 7.00 },
{ start: new Date('2019-07-29'), end: new Date('2019-09-08'), rate: 7.25 },
{ start: new Date('2019-06-17'), end: new Date('2019-07-28'), rate: 7.50 },
{ start: new Date('2018-12-17'), end: new Date('2019-06-16'), rate: 7.75 },
{ start: new Date('2018-09-17'), end: new Date('2018-12-16'), rate: 7.50 },
{ start: new Date('2018-03-26'), end: new Date('2018-09-16'), rate: 7.25 },
{ start: new Date('2018-02-12'), end: new Date('2018-03-25'), rate: 7.50 },
{ start: new Date('2017-12-18'), end: new Date('2018-02-11'), rate: 7.75 },
{ start: new Date('2017-10-30'), end: new Date('2017-12-17'), rate: 8.25 },
{ start: new Date('2017-09-18'), end: new Date('2017-10-29'), rate: 8.50 },
{ start: new Date('2017-06-19'), end: new Date('2017-09-17'), rate: 9.00 },
{ start: new Date('2017-05-02'), end: new Date('2017-06-18'), rate: 9.25 },
{ start: new Date('2017-03-27'), end: new Date('2017-05-01'), rate: 9.75 },
{ start: new Date('2016-09-19'), end: new Date('2017-03-26'), rate: 10.00 },
{ start: new Date('2016-08-01'), end: new Date('2016-09-18'), rate: 10.50 }
];

// ================== Основные функции инициализации ==================

function initializeCalculator() {
    if (calculatorInitialized) return;
    if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
        console.error('Max initialization attempts reached');
        return;
    }

    initializationAttempts++;
    console.log(`Initializing calculator (attempt ${initializationAttempts})`);

    try {
        // Проверяем наличие всех необходимых элементов
        const elements = findCalculatorElements();
        if (!elements) {
            throw new Error('Required calculator elements not found');
        }

        // Настраиваем обработчики событий
        setupCalculatorEventHandlers(elements);

        // Настраиваем наблюдатели за DOM
        setupDOMObservers();

        calculatorInitialized = true;
        initializationAttempts = 0;
        console.log('Calculator initialized successfully');

    } catch (error) {
        console.error('Calculator initialization error:', error);

        // Повторная попытка через 500ms
        if (initializationAttempts < MAX_INIT_ATTEMPTS) {
            setTimeout(() => initializeCalculator(), 500);
        }
    }
}

function findCalculatorElements() {
    console.log('=== Поиск элементов ===');

    const elements = {
        debtAmountInput: document.getElementById('debt-amount'),
        startPeriodInput: document.getElementById('start-period'),
        endPeriodInput: document.getElementById('end-period'),
        rateTypeSelect: document.getElementById('rate-type'),
        rateValueInput: document.getElementById('rate-value'),
        ratePeriodSelect: document.getElementById('rate-period'),
        maxRateInput: document.getElementById('max-rate'),
        partialPaymentGroup: document.getElementById('partial-payment-group'),
        calculateBtn: document.querySelector('.primary-btn'),
        clearBtn: document.querySelector('.clear-btn'),
        printBtn: document.querySelector('.print-btn'),
        copyBtn: document.querySelector('.copy-btn'),
        exportBtn: document.querySelector('.export-btn')
    };

    // Проверяем, что все основные элементы найдены
    let allFound = true;
    for (const [key, element] of Object.entries(elements)) {
        if (!element && key !== 'partialPaymentGroup') {
            console.log('❌ Не найден элемент:', key);
            allFound = false;
        } else if (element) {
            console.log('✅ Найден элемент:', key);
        }
    }

    if (!allFound) {
        console.log('❌ Не все элементы найдены');
        return null;
    }

    console.log('✅ Все элементы найдены');
    return elements;
}

function setupCalculatorEventHandlers(elements) {
    // Установка текущей даты по умолчанию
    setDefaultDates(elements);

    // Добавление обработчиков для частичных оплат
    setupPartialPayments();

    // Основные обработчики кнопок
    elements.calculateBtn.addEventListener('click', () => calculateDebt(elements));
    elements.clearBtn.addEventListener('click', () => clearForm(elements));
    elements.copyBtn.addEventListener('click', copyResults);

    elements.printBtn.addEventListener('click', () => {
        const resultsContainer = document.querySelector('.results-container');
        if (!resultsContainer) {
            alert('Сначала выполните расчет для печати');
            return;
        }

        // Создаем чистый документ для печати
        const printWindow = window.open('', '_blank');
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Расчет задолженности</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 30px;
                        line-height: 1.6;
                    }
                    .print-header {
                        text-align: center;
                        margin-bottom: 25px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 15px;
                    }
                    .print-section {
                        margin-bottom: 15px;
                    }
                    .print-total {
                        font-weight: bold;
                        font-size: 1.2em;
                        margin-top: 20px;
                        border-top: 2px solid #333;
                        padding-top: 15px;
                    }
                    @media print {
                        body { padding: 15px; }
                    }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h1>Расчет задолженности</h1>
                    <p>Дата: ${new Date().toLocaleDateString()}</p>
                </div>
                <div class="print-content">
                    ${resultsContainer.textContent.split('\n')
                        .filter(line => line.trim() !== '')
                        .map(line => {
                            if (line.includes('К оплате:')) {
                                return `<div class="print-total">${line.trim()}</div>`;
                            } else if (line.includes('Расчёт задолженности:')) {
                                return `<h3>${line.trim()}</h3>`;
                            } else {
                                return `<div class="print-section">${line.trim()}</div>`;
                            }
                        })
                        .join('')}
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
        }, 250);
    });

    elements.exportBtn.addEventListener('click', () => {
        alert('Экспорт в Word будет реализован в будущей версии');
    });

    // Валидация числовых полей
    setupNumberValidation();
}

//function setupDOMObservers() {
//    // Очищаем старых наблюдателей
//    domObservers.forEach(observer => observer.disconnect());
//    domObservers.length = 0;
//
//    // Наблюдатель за изменениями в DOM
//    const mainObserver = new MutationObserver((mutations) => {
//        // Проверяем, не удалились ли важные элементы
//        const calculatorContainer = document.querySelector('.calculator-container');
//        if (!calculatorContainer) {
//            console.log('Calculator container removed, reinitializing...');
//            calculatorInitialized = false;
//            initializeCalculator();
//            return;
//        }
//
//        // Проверяем, не добавились ли новые элементы, которые нам нужны
//        const missingElements = findCalculatorElements();
//        if (!missingElements && !calculatorInitialized) {
//            initializeCalculator();
//        }
//    });
//
//    mainObserver.observe(document.body, {
//        childList: true,
//        subtree: true
//    });
//    domObservers.push(mainObserver);
//}

function setupDOMObservers() {
    // 1. Очищаем старых наблюдателей
    domObservers.forEach(observer => observer.disconnect());
    domObservers.length = 0;

    // 2. Создаем MutationObserver для отслеживания изменений в DOM
    const mainObserver = new MutationObserver((mutations, observer) => {
        // Проверяем, существует ли главный элемент калькулятора
        const calculatorContainer = document.querySelector('.calculator-container');

        // Если контейнер калькулятора найден И калькулятор не инициализирован
        if (calculatorContainer && !calculatorInitialized) {
            console.log('Контейнер калькулятора обнаружен. Запускаем инициализацию...');
            initializeCalculator();
            return;
        }

        // Если контейнер не найден (был удален) И калькулятор был инициализирован
        if (!calculatorContainer && calculatorInitialized) {
            console.log('Контейнер калькулятора удален. Сбрасываем флаг инициализации.');
            calculatorInitialized = false;
            return;
        }

        // Если контейнер найден, но элементы не работают (повторная инициализация)
        if (calculatorContainer && calculatorInitialized) {
            // Проверяем, работают ли обработчики событий
            const calculateBtn = document.querySelector('.primary-btn');
            if (calculateBtn && !calculateBtn._hasEventListeners) {
                console.log('Элементы калькулятора найдены, но обработчики не работают. Переинициализируем...');
                calculatorInitialized = false;
                initializeCalculator();
            }
        }
    });

    // 3. Настраиваем наблюдатель для отслеживания изменений в body
    mainObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 4. Добавляем наблюдатель в массив для последующей очистки
    domObservers.push(mainObserver);
    console.log('MutationObserver для калькулятора настроен.');
}

// ================== Вспомогательные функции ==================

function setupPartialPayments() {
    const partialPaymentGroup = document.getElementById('partial-payment-group');
    if (!partialPaymentGroup) return;

    // Находим первую строку оплат
    const firstPaymentItem = partialPaymentGroup.querySelector('.partial-payment-item');
    if (firstPaymentItem) {
        // Для первой строки настраиваем кнопку добавления
        const addBtn = firstPaymentItem.querySelector('.add-payment-btn');
        if (addBtn) {
            addBtn.addEventListener('click', function() {
                addPartialPayment();
            });
        }
    }

    // Добавляем обработчики для уже существующих дополнительных строк (если они есть)
    const existingPayments = partialPaymentGroup.querySelectorAll('.partial-payment-item');
    existingPayments.forEach((payment, index) => {
        if (index > 0) {
            // Для дополнительных строк ищем кнопку удаления
            const removeBtn = payment.querySelector('.remove-payment-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', function() {
                    payment.remove();
                });
            }
        }
    });
}

function addPaymentEventListeners(container) {
    const addBtn = container.querySelector('.add-payment-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            addPartialPayment();
        });
    }
}

function addPartialPayment() {
    const template = document.getElementById('payment-item-template');
    if (!template) return;

    const newPaymentItem = template.content.cloneNode(true);
    const container = newPaymentItem.querySelector('.partial-payment-item');

    // Добавляем обработчик для кнопки удаления
    const removeBtn = container.querySelector('.remove-payment-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            container.remove();
        });
    }

    const partialPaymentGroup = document.getElementById('partial-payment-group');
    if (partialPaymentGroup) {
        partialPaymentGroup.appendChild(newPaymentItem);
    }
}

function setupNumberValidation() {
     const numberInputs = document.querySelectorAll('input[type="number"]');
     numberInputs.forEach(input => {
         input.addEventListener('input', function() {
             if (this.value < 0) {
                 this.value = 0;
             }
             // Для процентной ставки можно добавить ограничение сверху
             if (this.id === 'rate-value' && this.value > 1000) {
                 this.value = 1000;
                 alert('Процентная ставка не может превышать 1000%');
             }
         });
     });
 }

// ================== Функции расчета ==================

function debugDateCalculation() {
    const startInput = document.getElementById('start-period');
    const endInput = document.getElementById('end-period');

    if (startInput && endInput) {
        const startDate = parseDateWithoutTimezone(startInput.value);
        const endDate = parseDateWithoutTimezone(endInput.value);

        console.log('=== ДЕБАГ ДАТ ===');
        console.log('Введенная начальная дата:', startInput.value);
        console.log('Введенная конечная дата:', endInput.value);
        console.log('Объект Date начальной:', startDate);
        console.log('Объект Date конечной:', endDate);
        console.log('Дней между:', calculateDaysBetween(startDate, endDate, 'includeStartExcludeEnd'));
    }
}

// Новая функция для парсинга дат без учета часового пояса
function parseDateWithoutTimezone(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    // Создаем дату в UTC чтобы избежать проблем с часовыми поясами
    return new Date(Date.UTC(year, month - 1, day));
}

//function calculateDebt(elements) {
//    console.log('=== START calculateDebt ===');
//
//    // Получение значений из формы
//    const debtAmount = parseFloat(elements.debtAmountInput.value) || 0;
//
//    // Используем новый парсинг дат без часового пояса
//    const startDateStr = elements.startPeriodInput.value;
//    const endDateStr = elements.endPeriodInput.value;
//
//    console.log('Input values:', startDateStr, '-', endDateStr);
//
//    // Создаем даты без учета часового пояса
//    const startDate = parseDateWithoutTimezone(startDateStr);
//    const endDate = parseDateWithoutTimezone(endDateStr);
//
//    console.log('Parsed dates (no timezone):', {
//        start: startDate.toISOString().split('T')[0],
//        end: endDate.toISOString().split('T')[0]
//    });
//
//    const rateType = elements.rateTypeSelect.value;
//    const rateValue = parseFloat(elements.rateValueInput.value) || 0;
//    const ratePeriod = elements.ratePeriodSelect.value;
//    const maxRate = parseFloat(elements.maxRateInput.value) || Infinity;
//
//    console.log('Parsed values:', {
//        debtAmount,
//        startDate: startDate.toISOString().split('T')[0],
//        endDate: endDate.toISOString().split('T')[0],
//        rateType,
//        rateValue,
//        ratePeriod,
//        maxRate
//    });
//
//    // Валидация
//    if (!validateCalculationInputs(debtAmount, startDate, endDate, rateValue)) {
//        console.log('❌ Расчет прерван: валидация не пройдена');
//        return;
//    }
//
//    console.log('✅ Передаем данные в performCalculation');
//
//    // Расчет
//    const calculationData = performCalculation(
//            debtAmount, startDate, endDate, rateType,
//            rateValue, ratePeriod, maxRate
//        );
//
//        // Добавляем информацию о периоде ставки для правильного отображения формулы
//        calculationData.ratePeriod = ratePeriod;
//
//    // Отображение результатов
//    showResults(calculationData);
//    console.log('=== END calculateDebt ===');
//}

function calculateDebt(elements) {
    console.log('=== START calculateDebt ===');

    // Получение значений из формы
    const debtAmount = parseFloat(elements.debtAmountInput.value) || 0;

    // Используем новый парсинг дат без часового пояса
    const startDateStr = elements.startPeriodInput.value;
    const endDateStr = elements.endPeriodInput.value;

    console.log('Input values:', startDateStr, '-', endDateStr);

    // Создаем даты без учета часового пояса
    const startDate = parseDateWithoutTimezone(startDateStr);
    const endDate = parseDateWithoutTimezone(endDateStr);

    console.log('Parsed dates (no timezone):', {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
    });

    const rateType = elements.rateTypeSelect.value;
    const rateValue = parseFloat(elements.rateValueInput.value) || 0;
    const ratePeriod = elements.ratePeriodSelect.value;
    const maxRate = parseFloat(elements.maxRateInput.value) || Infinity;

    console.log('Parsed values:', {
        debtAmount,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        rateType,
        rateValue,
        ratePeriod,
        maxRate
    });

    // Валидация - передаем rateType в функцию валидации
    if (!validateCalculationInputs(debtAmount, startDate, endDate, rateValue, rateType)) {
        console.log('❌ Расчет прерван: валидация не пройдена');
        return;
    }

    console.log('✅ Передаем данные в performCalculation');

    // Расчет
    const calculationData = performCalculation(
            debtAmount, startDate, endDate, rateType,
            rateValue, ratePeriod, maxRate
        );

        // Добавляем информацию о периоде ставки для правильного отображения формулы
        calculationData.ratePeriod = ratePeriod;

    // Отображение результатов
    showResults(calculationData);
    console.log('=== END calculateDebt ===');
}

function setDefaultDates(elements) {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    console.log('Дата по умолчанию (месяц назад):', oneMonthAgo.toISOString().split('T')[0]);
    console.log('Дата по умолчанию (сегодня):', today.toISOString().split('T')[0]);

    // Вспомогательная функция для форматирования даты в YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    if (elements.startPeriodInput && !elements.startPeriodInput.value) {
        elements.startPeriodInput.value = formatDate(oneMonthAgo);
    }

    if (elements.endPeriodInput && !elements.endPeriodInput.value) {
        elements.endPeriodInput.value = formatDate(today);
    }
}

//function validateCalculationInputs(debtAmount, startDate, endDate, rateValue) {
//    console.log('=== ВАЛИДАЦИЯ ДАТ ===');
//    console.log('Start date (ISO):', startDate.toISOString().split('T')[0]);
//    console.log('End date (ISO):', endDate.toISOString().split('T')[0]);
//    console.log('Start date object:', startDate.toString());
//    console.log('End date object:', endDate.toString());
//    console.log('Start date local:', startDate.toLocaleDateString());
//    console.log('End date local:', endDate.toLocaleDateString());
//
//    console.log('=== ОТЛАДКА validateCalculationInputs ===');
//    console.log('Даты при валидации:', startDate, '-', endDate);
//    console.log('debtAmount:', debtAmount);
//    console.log('rateValue:', rateValue);
//
//    if (debtAmount <= 0) {
//        console.log('❌ Ошибка: debtAmount <= 0');
//        alert('Основная сумма задолженности должна быть больше 0');
//        return false;
//    }
//
//    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
//        console.log('❌ Ошибка: некорректные даты');
//        alert('Пожалуйста, выберите корректные даты периода расчета');
//        return false;
//    }
//
//    if (startDate > endDate) {
//        console.log('❌ Ошибка: startDate > endDate', startDate, endDate);
//        alert('Дата начала периода не может быть позже даты окончания');
//        return false;
//    }
//
//    if (rateValue <= 0 || isNaN(rateValue)) {
//        console.log('❌ Ошибка: rateValue <= 0 или не число');
//        alert('Процентная ставка должна быть положительным числом');
//        return false;
//    }
//
//    console.log('✅ Валидация пройдена успешно');
//    return true;
//}

function validateCalculationInputs(debtAmount, startDate, endDate, rateValue, rateType) {
    console.log('=== ВАЛИДАЦИЯ ДАТ ===');
    console.log('Start date (ISO):', startDate.toISOString().split('T')[0]);
    console.log('End date (ISO):', endDate.toISOString().split('T')[0]);
    console.log('Start date object:', startDate.toString());
    console.log('End date object:', endDate.toString());
    console.log('Start date local:', startDate.toLocaleDateString());
    console.log('End date local:', endDate.toLocaleDateString());

    console.log('=== ОТЛАДКА validateCalculationInputs ===');
    console.log('Даты при валидации:', startDate, '-', endDate);
    console.log('debtAmount:', debtAmount);
    console.log('rateValue:', rateValue);
    console.log('rateType:', rateType);

    if (debtAmount <= 0) {
        console.log('❌ Ошибка: debtAmount <= 0');
        alert('Основная сумма задолженности должна быть больше 0');
        return false;
    }

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.log('❌ Ошибка: некорректные даты');
        alert('Пожалуйста, выберите корректные даты периода расчета');
        return false;
    }

    if (startDate > endDate) {
        console.log('❌ Ошибка: startDate > endDate', startDate, endDate);
        alert('Дата начала периода не может быть позже даты окончания');
        return false;
    }

    // Валидация ставки только для фиксированной ставки, не для ключевой ставки ЦБ
    if (rateType !== 'cbr_double' && rateType !== 'cbr_single') {
        if (rateValue <= 0 || isNaN(rateValue)) {
            console.log('❌ Ошибка: rateValue <= 0 или не число');
            alert('Процентная ставка должна быть положительным числом');
            return false;
        }
    }

    console.log('✅ Валидация пройдена успешно');
    return true;
}

// ================== ОСНОВНАЯ ФУНКЦИЯ РАСЧЕТА ==================

function performCalculation(debtAmount, startDate, endDate, rateType, rateValue, ratePeriod, maxRate) {
    console.log('=== НАЧАЛО РАСЧЕТА (UTC даты) ===');

    const overallDaysMethod = getDaysCalculationMethod();

    // ОСНОВНОЕ ИЗМЕНЕНИЕ: для метода excludeStartIncludeEnd сдвигаем начальную дату
    let adjustedStartDate = new Date(startDate);
    if (overallDaysMethod === 'excludeStartIncludeEnd') {
        adjustedStartDate.setDate(adjustedStartDate.getDate() + 1);
        console.log('Сдвиг начальной даты на 1 день для метода excludeStartIncludeEnd');
    }

    const intermediateDaysMethod = 'includeStartExcludeEnd';

    // Используем скорректированную дату для расчета
    const startUTC = new Date(Date.UTC(adjustedStartDate.getFullYear(), adjustedStartDate.getMonth(), adjustedStartDate.getDate()));
    const endUTC = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));

    // Остальной код остается без изменений...
    const payments = getPartialPayments();
    payments.sort((a, b) => {
        const dateA = parseDateWithoutTimezone(a.date);
        const dateB = parseDateWithoutTimezone(b.date);
        return dateA - dateB;
    });

    // РАЗДЕЛЯЕМ РАСЧЕТ НА ДВА ТИПА
    if (rateType.startsWith('cbr')) {
        return calculateCBRInterest(
            debtAmount, startUTC, endUTC, rateType,
            payments, overallDaysMethod, intermediateDaysMethod, maxRate
        );
    } else {
        return calculateContractualInterest(
            debtAmount, startUTC, endUTC, rateValue, ratePeriod,
            payments, overallDaysMethod, intermediateDaysMethod, maxRate
        );
    }
}

// ================== ФУНКЦИЯ РАСЧЕТА ДОГОВОРНЫХ ПРОЦЕНТОВ ==================

function calculateContractualInterest(debtAmount, startDate, endDate, rateValue, ratePeriod,
                                    payments, overallDaysMethod, intermediateDaysMethod, maxRate) {

     let currentDebt = debtAmount;
        let totalInterest = 0;
        let currentDate = new Date(startDate);
        const endDateOnly = new Date(endDate);

        // ОСНОВНОЕ ИЗМЕНЕНИЕ: для метода excludeStartIncludeEnd включаем конечный день
        if (overallDaysMethod === 'excludeStartIncludeEnd') {
            endDateOnly.setDate(endDateOnly.getDate() + 0); // Конечный день уже включен
        }

        const calculationStages = [];
        const totalDays = calculateDaysBetween(currentDate, endDateOnly, overallDaysMethod);

    // Для годовой ставки используем специальную логику расчета по годовщинам
    if (ratePeriod === 'year') {
        const yearlyResult = calculateYearlyInterestByAnniversary(
            currentDebt, rateValue, startDate, endDateOnly, payments, overallDaysMethod
        );

        // Применяем ограничение максимальной ставки
        let appliedMaxRate = null;
        if (maxRate && !isNaN(maxRate) && maxRate !== Infinity) {
            const maxInterest = debtAmount * (maxRate / 100);
            if (yearlyResult.totalInterest > maxInterest) {
                const scaleFactor = maxInterest / yearlyResult.totalInterest;
                yearlyResult.calculationStages.forEach(stage => {
                    if (stage.interest > 0) {
                        stage.interest = stage.interest * scaleFactor;
                    }
                });
                yearlyResult.totalInterest = maxInterest;
                appliedMaxRate = maxRate;
            }
        }

        const totalPayments = getTotalPayments();
        const debtPayments = getDebtPayments();
        const penaltyPayments = getPenaltyPayments();
        const amountToPay = Math.max(0, yearlyResult.finalPrincipal + yearlyResult.totalInterest - penaltyPayments);

        return {
            debtAmount,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            days: totalDays,
            interestRate: `${rateValue}% (годовая)`,
            interestRateType: 'fixed',
            interestRateValue: rateValue,
            cbrRatesUsed: null,
            dailyRate: calculateDailyRate('fixed', rateValue, ratePeriod, startDate, endDate, overallDaysMethod) * 100,
            interest: yearlyResult.totalInterest,
            totalPayments,
            debtPayments,
            penaltyPayments,
            remainingDebt: yearlyResult.finalPrincipal,
            totalDebt: yearlyResult.finalPrincipal + yearlyResult.totalInterest,
            amountToPay: amountToPay,
            maxRate: appliedMaxRate,
            calculationStages: yearlyResult.calculationStages,
            daysMethod: overallDaysMethod,
            ratePeriod: ratePeriod
        };
    }

    // Обрабатываем каждый платеж для других типов ставок (месячная, дневная)
    for (const payment of payments) {
        const paymentDate = parseDateWithoutTimezone(payment.date);
        const paymentDateUTC = new Date(Date.UTC(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate()));

        if (paymentDateUTC > endDateOnly) break;

        if (overallDaysMethod === 'excludeStartIncludeEnd') {
                // Не пропускаем платежи, даже если они в "начальный" день (который исключен)
                if (paymentDateUTC < currentDate && paymentDateUTC.getTime() !== startDate.getTime()) continue;
            } else {
                if (paymentDateUTC < currentDate) continue;
            }

        if (paymentDateUTC < currentDate) continue;

        // Расчет процентов за период ДО платежа
        const daysUntilPayment = calculateDaysBetween(currentDate, paymentDateUTC, intermediateDaysMethod);

        if (daysUntilPayment > 0) {
            let periodInterest;

            if (ratePeriod === 'month') {
                periodInterest = calculateMonthlyInterest(
                    currentDebt, rateValue, currentDate, paymentDateUTC, intermediateDaysMethod
                );
            } else {
                if (ratePeriod === 'day') {
                    periodInterest = currentDebt * (rateValue / 100) * daysUntilPayment;
                } else {
                    const daysInYear = isLeapYear(currentDate) ? 366 : 365;
                    periodInterest = (currentDebt * rateValue * daysUntilPayment) / (100 * daysInYear);
                }
            }

            calculationStages.push({
                startDate: currentDate.toISOString().split('T')[0],
                endDate: paymentDateUTC.toISOString().split('T')[0],
                days: daysUntilPayment,
                principal: currentDebt,
                interest: periodInterest,
                dailyRate: daysUntilPayment > 0 ? periodInterest / (currentDebt * daysUntilPayment) : 0,
                payment: null,
                daysMethod: intermediateDaysMethod,
                description: `Проценты на сумму ${currentDebt.toFixed(2)} руб. за ${daysUntilPayment} дней`
            });

            totalInterest += periodInterest;
        }

        // Применяем платеж
        if (payment.destination === 'debt') {
            const debtBeforePayment = currentDebt;
            currentDebt = Math.max(0, currentDebt - payment.amount);

            calculationStages.push({
                startDate: paymentDateUTC.toISOString().split('T')[0],
                endDate: paymentDateUTC.toISOString().split('T')[0],
                days: 0,
                principal: debtBeforePayment,
                interest: 0,
                dailyRate: 0,
                payment: {
                    date: payment.date,
                    amount: payment.amount,
                    destination: payment.destination,
                    description: `Погашение долга: ${payment.amount.toFixed(2)} руб.`
                },
                daysMethod: 'payment',
                description: `Платеж: ${payment.amount.toFixed(2)} руб. Остаток долга: ${currentDebt.toFixed(2)} руб.`
            });
        } else if (payment.destination === 'penalty') {
            calculationStages.push({
                startDate: paymentDateUTC.toISOString().split('T')[0],
                endDate: paymentDateUTC.toISOString().split('T')[0],
                days: 0,
                principal: currentDebt,
                interest: -payment.amount,
                dailyRate: 0,
                payment: {
                    date: payment.date,
                    amount: payment.amount,
                    destination: payment.destination,
                    description: `Погашение неустойки: ${payment.amount.toFixed(2)} руб.`
                },
                daysMethod: 'payment',
                description: `Платеж в счет неустойки: ${payment.amount.toFixed(2)} руб.`
            });

            totalInterest = Math.max(0, totalInterest - payment.amount);
        }

        currentDate = new Date(paymentDateUTC);
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Расчет за оставшийся период
    if (currentDate <= endDateOnly) {
        const remainingDays = calculateDaysBetween(currentDate, endDateOnly, overallDaysMethod);

        if (remainingDays > 0) {
            let remainingInterest;

            if (ratePeriod === 'month') {
                remainingInterest = calculateMonthlyInterest(
                    currentDebt, rateValue, currentDate, endDateOnly, overallDaysMethod
                );
            } else {
                if (ratePeriod === 'day') {
                    remainingInterest = currentDebt * (rateValue / 100) * remainingDays;
                } else {
                    const daysInYear = isLeapYear(currentDate) ? 366 : 365;
                    remainingInterest = (currentDebt * rateValue * remainingDays) / (100 * daysInYear);
                }
            }

            calculationStages.push({
                startDate: currentDate.toISOString().split('T')[0],
                endDate: endDateOnly.toISOString().split('T')[0],
                days: remainingDays,
                principal: currentDebt,
                interest: remainingInterest,
                dailyRate: remainingDays > 0 ? remainingInterest / (currentDebt * remainingDays) : 0,
                payment: null,
                daysMethod: overallDaysMethod,
                description: `Проценты на остаток долга: ${currentDebt.toFixed(2)} руб. за ${remainingDays} дней`
            });

            totalInterest += remainingInterest;
        }
    }

    // Применяем ограничение максимальной ставки
    let appliedMaxRate = null;
    if (maxRate && !isNaN(maxRate) && maxRate !== Infinity) {
        const maxInterest = debtAmount * (maxRate / 100);
        if (totalInterest > maxInterest) {
            const scaleFactor = maxInterest / totalInterest;
            calculationStages.forEach(stage => {
                if (stage.interest > 0) {
                    stage.interest = stage.interest * scaleFactor;
                }
            });
            totalInterest = maxInterest;
            appliedMaxRate = maxRate;
        }
    }

    const totalPayments = getTotalPayments();
    const debtPayments = getDebtPayments();
    const penaltyPayments = getPenaltyPayments();

    const amountToPay = Math.max(0, currentDebt + totalInterest - penaltyPayments);

    return {
        debtAmount,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: totalDays,
        interestRate: `${rateValue}%${ratePeriod === 'month' ? ' (месячная)' : ratePeriod === 'day' ? ' (дневная)' : ' (годовая)'}`,
        interestRateType: 'fixed',
        interestRateValue: rateValue,
        cbrRatesUsed: null,
        dailyRate: calculateDailyRate('fixed', rateValue, ratePeriod, startDate, endDate, overallDaysMethod) * 100,
        interest: totalInterest,
        totalPayments,
        debtPayments,
        penaltyPayments,
        remainingDebt: currentDebt,
        totalDebt: currentDebt + totalInterest,
        amountToPay: amountToPay,
        maxRate: appliedMaxRate,
        calculationStages: calculationStages,
        daysMethod: overallDaysMethod,
        ratePeriod: ratePeriod
    };
}


// ================== ФУНКЦИЯ РАСЧЕТА КЛЮЧЕВОЙ СТАВКИ ЦБ ==================

function calculateCBRInterest(debtAmount, startDate, endDate, rateType,
                             payments, overallDaysMethod, intermediateDaysMethod, maxRate) {

     let currentDebt = debtAmount;
        let totalInterest = 0;
        let currentDate = new Date(startDate);
        const endDateOnly = new Date(endDate);

        // ОСНОВНОЕ ИЗМЕНЕНИЕ: для метода excludeStartIncludeEnd включаем конечный день
        if (overallDaysMethod === 'excludeStartIncludeEnd') {
            endDateOnly.setDate(endDateOnly.getDate() + 0); // Конечный день уже включен
        }

        const calculationStages = [];
        const totalDays = calculateDaysBetween(currentDate, endDateOnly, overallDaysMethod);

    // Сортируем платежи по дате
    const sortedPayments = [...payments].sort((a, b) => {
        const dateA = parseDateWithoutTimezone(a.date);
        const dateB = parseDateWithoutTimezone(b.date);
        return dateA - dateB;
    });

    let paymentIndex = 0;

    // Обрабатываем каждый платеж для ключевой ставки
    while (paymentIndex < sortedPayments.length) {
        const payment = sortedPayments[paymentIndex];
        const paymentDate = parseDateWithoutTimezone(payment.date);
        const paymentDateUTC = new Date(Date.UTC(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate()));

        if (paymentDateUTC > endDateOnly) break;
        if (paymentDateUTC < currentDate) {
            paymentIndex++;
            continue;
        }

        // Расчет процентов за период ДО платежа по ключевой ставке
        const daysUntilPayment = calculateDaysBetween(currentDate, paymentDateUTC, intermediateDaysMethod);

        if (daysUntilPayment > 0) {
            let periodInterest;

            if (rateType === 'cbr_double') {
                periodInterest = currentDebt * calculateCBRDoubleRate(currentDate, paymentDateUTC, intermediateDaysMethod);
            } else if (rateType === 'cbr_single') {
                periodInterest = currentDebt * calculateCBRSingleRate(currentDate, paymentDateUTC, intermediateDaysMethod);
            }

            calculationStages.push({
                startDate: currentDate.toISOString().split('T')[0],
                endDate: paymentDateUTC.toISOString().split('T')[0],
                days: daysUntilPayment,
                principal: currentDebt,
                interest: periodInterest,
                dailyRate: daysUntilPayment > 0 ? periodInterest / (currentDebt * daysUntilPayment) : 0,
                payment: null,
                daysMethod: intermediateDaysMethod,
                description: `Проценты на сумму ${currentDebt.toFixed(2)} руб. за ${daysUntilPayment} дней`
            });

            totalInterest += periodInterest;
        }

        // Применяем платеж
        if (payment.destination === 'debt') {
            const debtBeforePayment = currentDebt;
            currentDebt = Math.max(0, currentDebt - payment.amount);

            calculationStages.push({
                startDate: paymentDateUTC.toISOString().split('T')[0],
                endDate: paymentDateUTC.toISOString().split('T')[0],
                days: 0,
                principal: debtBeforePayment,
                interest: 0,
                dailyRate: 0,
                payment: {
                    date: payment.date,
                    amount: payment.amount,
                    destination: payment.destination,
                    description: `Погашение долга: ${payment.amount.toFixed(2)} руб.`
                },
                daysMethod: 'payment',
                description: `Платеж: ${payment.amount.toFixed(2)} руб. Остаток долга: ${currentDebt.toFixed(2)} руб.`
            });
        } else if (payment.destination === 'penalty') {
            calculationStages.push({
                startDate: paymentDateUTC.toISOString().split('T')[0],
                endDate: paymentDateUTC.toISOString().split('T')[0],
                days: 0,
                principal: currentDebt,
                interest: -payment.amount,
                dailyRate: 0,
                payment: {
                    date: payment.date,
                    amount: payment.amount,
                    destination: payment.destination,
                    description: `Погашение неустойки: ${payment.amount.toFixed(2)} руб.`
                },
                daysMethod: 'payment',
                description: `Платеж в счет неустойки: ${payment.amount.toFixed(2)} руб.`
            });

            totalInterest = Math.max(0, totalInterest - payment.amount);
        }

        currentDate = new Date(paymentDateUTC);
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        paymentIndex++;
    }

    // Расчет за оставшийся период для ключевой ставки
    if (currentDate <= endDateOnly) {
        const remainingDays = calculateDaysBetween(currentDate, endDateOnly, overallDaysMethod);

        if (remainingDays > 0) {
            let remainingInterest;

            if (rateType === 'cbr_double') {
                remainingInterest = currentDebt * calculateCBRDoubleRate(currentDate, endDateOnly, overallDaysMethod);
            } else if (rateType === 'cbr_single') {
                remainingInterest = currentDebt * calculateCBRSingleRate(currentDate, endDateOnly, overallDaysMethod);
            }

            calculationStages.push({
                startDate: currentDate.toISOString().split('T')[0],
                endDate: endDateOnly.toISOString().split('T')[0],
                days: remainingDays,
                principal: currentDebt,
                interest: remainingInterest,
                dailyRate: remainingDays > 0 ? remainingInterest / (currentDebt * remainingDays) : 0,
                payment: null,
                daysMethod: overallDaysMethod,
                description: `Проценты на остаток долга: ${currentDebt.toFixed(2)} руб. за ${remainingDays} дней`
            });

            totalInterest += remainingInterest;
        }
    }

    // Применяем ограничение максимальной ставки
    let appliedMaxRate = null;
    if (maxRate && !isNaN(maxRate) && maxRate !== Infinity) {
        const maxInterest = debtAmount * (maxRate / 100);
        if (totalInterest > maxInterest) {
            const scaleFactor = maxInterest / totalInterest;
            calculationStages.forEach(stage => {
                if (stage.interest > 0) {
                    stage.interest = stage.interest * scaleFactor;
                }
            });
            totalInterest = maxInterest;
            appliedMaxRate = maxRate;
        }
    }

    const totalPayments = getTotalPayments();
    const debtPayments = getDebtPayments();
    const penaltyPayments = getPenaltyPayments();

    let rateDescription;
    switch (rateType) {
        case 'cbr_double':
            rateDescription = 'Ключевая ставка ЦБ РФ × 2';
            break;
        case 'cbr_single':
            rateDescription = 'Ключевая ставка ЦБ РФ';
            break;
    }

    const amountToPay = Math.max(0, currentDebt + totalInterest - penaltyPayments);

    return {
        debtAmount,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: totalDays,
        interestRate: rateDescription,
        interestRateType: rateType,
        interestRateValue: 0,
        cbrRatesUsed: getCBRRatesForPeriod(startDate, endDate),
        dailyRate: calculateDailyRate(rateType, 0, 'year', startDate, endDate, overallDaysMethod) * 100,
        interest: totalInterest,
        totalPayments,
        debtPayments,
        penaltyPayments,
        remainingDebt: currentDebt,
        totalDebt: currentDebt + totalInterest,
        amountToPay: amountToPay,
        maxRate: appliedMaxRate,
        calculationStages: calculationStages,
        daysMethod: overallDaysMethod,
        ratePeriod: 'year'
    };
}

function getPenaltyPayments() {
    let total = 0;
    const paymentItems = document.querySelectorAll('.partial-payment-item');

    paymentItems.forEach(item => {
        const amount = parseFloat(item.querySelector('.payment-amount').value) || 0;
        const destination = item.querySelector('.payment-destination').value;

        if (destination === 'penalty') {
            total += amount;
        }
    });

    return total;
}

function calculateMonthlyInterest(principal, rateValue, startDate, endDate, daysMethod) {
    // Месячная ставка в десятичном виде
    const monthlyRate = rateValue / 100;

    // Рассчитываем количество полных месяцев
    const fullMonths = calculateFullMonthsBetween(startDate, endDate);

    // Рассчитываем оставшиеся дни после полных месяцев
    const remainingDays = calculateRemainingDaysAfterMonths(startDate, endDate, fullMonths);

    // Проценты за полные месяцы
    const interestForFullMonths = principal * monthlyRate * fullMonths;

    // Проценты за оставшиеся дни (пропорционально)
    let interestForRemainingDays = 0;
    if (remainingDays > 0) {
        // Находим дату после последнего полного месяца
        const afterFullMonthsDate = addMonths(startDate, fullMonths);

        // Количество дней в текущем месяце
        const daysInCurrentMonth = getDaysInMonth(afterFullMonthsDate);

        // Проценты за неполный месяц (пропорционально)
        interestForRemainingDays = principal * monthlyRate * (remainingDays / daysInCurrentMonth);
    }

    return interestForFullMonths + interestForRemainingDays;
}

function calculateFullMonthsBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let months = 0;
    let current = new Date(start);

    while (current < end) {
        const nextMonth = new Date(current);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        if (nextMonth <= end) {
            months++;
            current = new Date(nextMonth);
        } else {
            break;
        }
    }

    return months;
}

function getMonthEndDate(startDate) {
    const resultDate = new Date(startDate);
    resultDate.setMonth(resultDate.getMonth() + 1);

    // Проверяем, нужно ли корректировать дату
    const originalDay = startDate.getDate();
    const lastDayOfNextMonth = new Date(resultDate.getFullYear(), resultDate.getMonth() + 1, 0).getDate();

    if (originalDay > lastDayOfNextMonth) {
        resultDate.setDate(lastDayOfNextMonth);
    }

    return resultDate;
}

function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function calculateRemainingDaysAfterMonths(startDate, endDate, fullMonths) {
    if (fullMonths <= 0) {
        return calculateDaysBetween(startDate, endDate, 'includeStartExcludeEnd');
    }

    // Находим дату после полных месяцев
    const afterMonthsDate = addMonths(startDate, fullMonths);

    // Если дата после месяцев превышает конечную дату, корректируем
    if (afterMonthsDate > endDate) {
        return 0;
    }

    // Рассчитываем оставшиеся дни
    return calculateDaysBetween(afterMonthsDate, endDate, 'includeStartExcludeEnd');
}

function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);

    // Корректировка для случаев, когда исходный день месяца не существует в целевом месяце
    const originalDay = date.getDate();
    const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();

    if (originalDay > lastDayOfMonth) {
        result.setDate(lastDayOfMonth);
    }

    return result;
}

//Функция для расчёта процентов, исходя из годовой ставки
function calculateYearlyInterest(principal, rateValue, startDate, endDate, daysMethod) {
    const yearlyRate = rateValue / 100;
    let totalInterest = 0;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate < end) {
        // Конец текущего года (31 декабря)
        const yearEnd = new Date(currentDate.getFullYear(), 11, 31);

        // Если текущая дата уже после 31 декабря, берем конец следующего года
        if (currentDate > yearEnd) {
            yearEnd.setFullYear(yearEnd.getFullYear() + 1);
        }

        const periodEnd = yearEnd > end ? new Date(end) : yearEnd;
        const daysInPeriod = calculateDaysBetween(currentDate, periodEnd, daysMethod);

        // Определяем количество дней в текущем году
        const isLeap = isLeapYear(currentDate);
        const daysInCurrentYear = isLeap ? 366 : 365;

        // Проценты за период
        const periodInterest = principal * yearlyRate * (daysInPeriod / daysInCurrentYear);
        totalInterest += periodInterest;

        // Переходим к следующему году
        currentDate = new Date(periodEnd);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalInterest;
}


//function calculateYearlyInterestByAnniversary(
//    principal, rateValue, startDate, endDate, payments, daysMethod
//) {
//    const yearlyRate = rateValue / 100;
//    let totalInterest = 0;
//    let currentPrincipal = principal;
//    const calculationStages = [];
//
//    // Создаем отсортированный список всех значимых дат
//    const significantDates = new Set();
//    significantDates.add(startDate.getTime());
//    significantDates.add(endDate.getTime());
//
//    let currentAnniversary = new Date(startDate);
//    currentAnniversary.setFullYear(startDate.getFullYear() + 1);
//    while (currentAnniversary.getTime() <= endDate.getTime()) {
//        significantDates.add(currentAnniversary.getTime());
//        currentAnniversary.setFullYear(currentAnniversary.getFullYear() + 1);
//    }
//
//    payments.forEach(p => {
//        const pDate = parseDateWithoutTimezone(p.date);
//        if (pDate >= startDate && pDate <= endDate) {
//            significantDates.add(pDate.getTime());
//        }
//    });
//
//    const sortedDates = Array.from(significantDates).sort((a, b) => a - b);
//
//    let currentDate = new Date(startDate);
//
//    for (const nextDateMs of sortedDates) {
//        const nextDate = new Date(nextDateMs);
//        if (currentDate.getTime() >= nextDate.getTime()) continue;
//        if (currentDate.getTime() > endDate.getTime()) break;
//
//        // Расчет процентов за текущий мини-период
//        const daysInPeriod = calculateDaysBetween(currentDate, nextDate, daysMethod);
//
//        if (daysInPeriod > 0) {
//            const isLeap = isLeapYear(currentDate);
//            const daysInCurrentYear = isLeap ? 366 : 365;
//            const periodInterest = currentPrincipal * yearlyRate * (daysInPeriod / daysInCurrentYear);
//            totalInterest += periodInterest;
//
//            calculationStages.push({
//                startDate: currentDate.toISOString().split('T')[0],
//                endDate: nextDate.toISOString().split('T')[0],
//                days: daysInPeriod,
//                principal: currentPrincipal,
//                interest: periodInterest,
//                dailyRate: daysInPeriod > 0 ? periodInterest / (currentPrincipal * daysInPeriod) : 0,
//                payment: null,
//                daysMethod: daysMethod,
//                description: `Проценты на сумму ${currentPrincipal.toFixed(2)} руб. за ${daysInPeriod} дней`
//            });
//        }
//
//        // Применяем платежи, которые были в этот день
//        const paymentsOnThisDate = payments.filter(p => {
//            const pDate = parseDateWithoutTimezone(p.date);
//            return pDate.getTime() === nextDate.getTime();
//        });
//
//        for (const payment of paymentsOnThisDate) {
//            if (payment.destination === 'debt') {
//                const debtBeforePayment = currentPrincipal;
//                currentPrincipal = Math.max(0, currentPrincipal - payment.amount);
//                calculationStages.push({
//                    startDate: nextDate.toISOString().split('T')[0],
//                    endDate: nextDate.toISOString().split('T')[0],
//                    days: 0,
//                    principal: debtBeforePayment,
//                    interest: 0,
//                    dailyRate: 0,
//                    payment: {
//                        date: payment.date,
//                        amount: payment.amount,
//                        destination: payment.destination
//                    },
//                    daysMethod: 'payment',
//                    description: `Платеж: ${payment.amount.toFixed(2)} руб. Остаток долга: ${currentPrincipal.toFixed(2)} руб.`
//                });
//            }
//        }
//
//        // Переходим к следующему дню
//        currentDate = new Date(nextDate);
//        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
//    }
//
//    return {
//        totalInterest,
//        calculationStages,
//        finalPrincipal: currentPrincipal
//    };
//}

function calculateYearlyInterestByAnniversary(
    principal, rateValue, startDate, endDate, payments, daysMethod
) {
    const yearlyRate = rateValue / 100;
    let totalInterest = 0;
    let currentPrincipal = principal;
    const calculationStages = [];
    // Создаем отсортированный список всех значимых дат
    const significantDates = new Set();
    significantDates.add(startDate.getTime());
    significantDates.add(endDate.getTime());
    let currentAnniversary = getYearEndDate(startDate);
    while (currentAnniversary.getTime() < endDate.getTime()) {
        significantDates.add(currentAnniversary.getTime());
        currentAnniversary = getYearEndDate(currentAnniversary);
    }
    payments.forEach(p => {
        const pDate = parseDateWithoutTimezone(p.date);
        if (pDate >= startDate && pDate <= endDate) {
            significantDates.add(pDate.getTime());
        }
    });
    const sortedDates = Array.from(significantDates).sort((a, b) => a - b);
    let currentDate = new Date(startDate);
    for (const nextDateMs of sortedDates) {
        const nextDate = new Date(nextDateMs);
        if (currentDate.getTime() >= nextDate.getTime()) continue;
        if (currentDate.getTime() > endDate.getTime()) break;
        // Расчет процентов за текущий мини-период
        const periodEnd = nextDate;
        const daysInPeriod = calculateDaysBetween(currentDate, periodEnd, daysMethod);
        if (daysInPeriod > 0) {
            const isLeap = isLeapYear(currentDate);
            const daysInCurrentYear = isLeap ? 366 : 365;
            const periodInterest = currentPrincipal * yearlyRate * (daysInPeriod / daysInCurrentYear);
            totalInterest += periodInterest;
            calculationStages.push({
                startDate: currentDate.toISOString().split('T')[0],
                endDate: periodEnd.toISOString().split('T')[0],
                days: daysInPeriod,
                principal: currentPrincipal,
                interest: periodInterest,
                dailyRate: daysInPeriod > 0 ? periodInterest / (currentPrincipal * daysInPeriod) : 0,
                payment: null,
                daysMethod: daysMethod,
                description: `Проценты на сумму ${currentPrincipal.toFixed(2)} руб. за ${daysInPeriod} дней`
            });
        }
        // Применяем платежи, которые были в этот день
        const paymentsOnThisDate = payments.filter(p => {
            const pDate = parseDateWithoutTimezone(p.date);
            return pDate.getTime() === nextDate.getTime();
        });
        for (const payment of paymentsOnThisDate) {
            if (payment.destination === 'debt') {
                const debtBeforePayment = currentPrincipal;
                currentPrincipal = Math.max(0, currentPrincipal - payment.amount);
                calculationStages.push({
                    startDate: nextDate.toISOString().split('T')[0],
                    endDate: nextDate.toISOString().split('T')[0],
                    days: 0,
                    principal: debtBeforePayment,
                    interest: 0,
                    dailyRate: 0,
                    payment: {
                        date: payment.date,
                        amount: payment.amount,
                        destination: payment.destination
                    },
                    daysMethod: 'payment',
                    description: `Платеж: ${payment.amount.toFixed(2)} руб. Остаток долга: ${currentPrincipal.toFixed(2)} руб.`
                });
            } else if (payment.destination === 'penalty') {
                calculationStages.push({
                    startDate: nextDate.toISOString().split('T')[0],
                    endDate: nextDate.toISOString().split('T')[0],
                    days: 0,
                    principal: currentPrincipal,
                    interest: 0,
                    dailyRate: 0,
                    payment: {
                        date: payment.date,
                        amount: payment.amount,
                        destination: payment.destination
                    },
                    daysMethod: 'payment',
                    description: `Платеж в счет неустойки: ${payment.amount.toFixed(2)} руб.`
                });
            }
        }
        // Переходим к следующему дню
        currentDate = new Date(nextDate);
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    return {
        totalInterest,
        calculationStages,
        finalPrincipal: currentPrincipal
    };
}

function calculateYearlyInterestWithDetails(principal, rateValue, startDate, endDate, daysMethod, payments = []) {
    const yearlyRate = rateValue / 100;
    let totalInterest = 0;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    let currentPrincipal = principal;

    const calculationDetails = [];
    const sortedPayments = payments.filter(p => {
        const paymentDate = parseDateWithoutTimezone(p.date);
        return paymentDate >= startDate && paymentDate <= endDate;
    }).sort((a, b) => {
        const dateA = parseDateWithoutTimezone(a.date);
        const dateB = parseDateWithoutTimezone(b.date);
        return dateA - dateB;
    });

    let paymentIndex = 0;

    while (currentDate < end) {
        const yearStart = new Date(currentDate);
        const yearEnd = new Date(currentDate.getFullYear(), 11, 31);
        const periodEnd = yearEnd > end ? new Date(end) : yearEnd;

        // Обрабатываем все платежи в текущем году
        while (paymentIndex < sortedPayments.length) {
            const payment = sortedPayments[paymentIndex];
            const paymentDate = parseDateWithoutTimezone(payment.date);

            if (paymentDate > periodEnd) break;

            if (paymentDate >= currentDate) {
                // Расчет процентов до платежа
                const daysUntilPayment = calculateDaysBetween(currentDate, paymentDate, daysMethod);
                if (daysUntilPayment > 0) {
                    const isLeap = isLeapYear(currentDate);
                    const daysInCurrentYear = isLeap ? 366 : 365;
                    const periodInterest = currentPrincipal * yearlyRate * (daysUntilPayment / daysInCurrentYear);
                    totalInterest += periodInterest;

                    calculationDetails.push({
                        startDate: currentDate.toISOString().split('T')[0],
                        endDate: paymentDate.toISOString().split('T')[0],
                        days: daysUntilPayment,
                        principal: currentPrincipal,
                        interest: periodInterest,
                        type: 'Часть периода'
                    });
                }

                // Запись о платеже
                if (payment.destination === 'debt') {
                    calculationDetails.push({
                        startDate: paymentDate.toISOString().split('T')[0],
                        endDate: paymentDate.toISOString().split('T')[0],
                        days: 0,
                        principal: -payment.amount,
                        interest: 0,
                        type: 'Погашение'
                    });

                    currentPrincipal = Math.max(0, currentPrincipal - payment.amount);
                }

                currentDate = new Date(paymentDate);
                currentDate.setDate(currentDate.getDate() + 1);
                paymentIndex++;
            }
        }

        // Расчет за оставшуюся часть года
        if (currentDate < periodEnd) {
            const daysInPeriod = calculateDaysBetween(currentDate, periodEnd, daysMethod);
            if (daysInPeriod > 0) {
                const isLeap = isLeapYear(currentDate);
                const daysInCurrentYear = isLeap ? 366 : 365;
                const periodInterest = currentPrincipal * yearlyRate * (daysInPeriod / daysInCurrentYear);
                totalInterest += periodInterest;

                calculationDetails.push({
                    startDate: currentDate.toISOString().split('T')[0],
                    endDate: periodEnd.toISOString().split('T')[0],
                    days: daysInPeriod,
                    principal: currentPrincipal,
                    interest: periodInterest,
                    type: currentDate.getFullYear() === periodEnd.getFullYear() ?
                         (daysInPeriod === 365 || daysInPeriod === 366 ? 'Полный год' : 'Часть периода') :
                         'Неполный год'
                });
            }
        }

        currentDate = new Date(periodEnd);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return { totalInterest, calculationDetails };
}

//Функция для определения окончания годового периода
function getYearEndDate(date) {
    // Создаем копию входной даты, чтобы не изменять оригинал
    const result = new Date(date);
    // Добавляем 1 год к дате.
    // В случае 29 февраля, setFullYear() сам скорректирует дату на 28 февраля
    // если следующий год не високосный.
    result.setFullYear(result.getFullYear() + 1);
    // Отнимаем один день, чтобы получить последний день предыдущего "года"
    result.setDate(result.getDate() - 1);
    return result;
}

// ================== ФУНКЦИИ РАСЧЕТА КЛЮЧЕВОЙ СТАВКИ ЦБ ==================

// Функция, содержащая в себе размеры ключевых ставок ЦБ РФ в определённые периоды времени

//function getCBRKeyRateByDate(date) {
//    const targetDate = new Date(date);
//    const dateKey = targetDate.toISOString().split('T')[0];
//
//    if (rateCache.has(dateKey)) {
//        return rateCache.get(dateKey);
//    }
//
//    // Используем единый источник данных
//    const period = CBR_RATE_HISTORY.find(p => targetDate >= p.start && targetDate <= p.end);
//
//    let rate;
//    if (period) {
//        rate = period.rate / 100;
//    } else {
//        console.warn(`Ключевая ставка не найдена для даты ${targetDate.toLocaleDateString()}`);
//        rate = 0.105;
//    }
//
//    rateCache.set(dateKey, rate);
//    return rate;
//}

function getCBRKeyRateByDate(date) {
    const targetDate = new Date(date);
    const dateKey = targetDate.toISOString().split('T')[0];

    if (rateCache.has(dateKey)) {
        return rateCache.get(dateKey);
    }

    // Используйте единый источник
    const period = CBR_RATE_HISTORY.find(p => targetDate >= p.start && targetDate <= p.end);

    let rate;
    if (period) {
        rate = period.rate / 100;
    } else {
        rate = 0.105;
    }

    rateCache.set(dateKey, rate);
    return rate;
}


function getCBRKeyRateInfo(date) {
    const rate = getCBRKeyRateByDate(date);
    return {
        date: new Date(date).toLocaleDateString(),
        rate: (rate * 100).toFixed(2) + '%',
        rateDecimal: rate
    };
}

//function getCBRRatesForPeriod(startDate, endDate) {
//    const rates = [];
//    let currentDate = new Date(startDate);
//    const end = new Date(endDate);
//    const periods = getRatePeriods();
//
//    while (currentDate < end) {
//        const currentPeriod = periods.find(p =>
//            currentDate >= p.start && currentDate <= p.end
//        );
//
//        if (!currentPeriod) break;
//
//        const periodEnd = currentPeriod.end > end ? new Date(end) : new Date(currentPeriod.end);
//        const daysInPeriod = calculateDaysBetween(currentDate, periodEnd, 'includeStartExcludeEnd');
//
//        rates.push({
//            startDate: new Date(currentDate),
//            endDate: new Date(periodEnd),
//            rate: currentPeriod.rate,
//            days: daysInPeriod
//        });
//
//        currentDate = new Date(periodEnd);
//        currentDate.setDate(currentDate.getDate() + 1);
//    }
//
//    return rates;
//}

function getCBRRatesForPeriod(startDate, endDate) {
    const rates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    const periods = getRatePeriods();

    while (currentDate <= end) {
        const currentPeriod = periods.find(p =>
            currentDate >= p.start && currentDate <= p.end
        );

        if (!currentPeriod) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
        }

        const periodEndDate = new Date(Math.min(currentPeriod.end.getTime(), end.getTime()));
        const daysInPeriod = calculateDaysBetween(currentDate, periodEndDate, 'includeStartExcludeEnd') + 1;

        rates.push({
            startDate: new Date(currentDate),
            endDate: new Date(periodEndDate),
            rate: currentPeriod.rate,
            days: daysInPeriod
        });

        currentDate = new Date(periodEndDate);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return rates;
}

// Функция расчёта с ключевой ставкой ЦБ РФ с умножением на 2 (ст. 395 ГК РФ)
function calculateCBRDoubleRate(startDate, endDate, daysMethod = 'includeStartExcludeEnd') {
    let totalInterest = 0;
    const periods = getCBRRatesForPeriod(startDate, endDate);

    periods.forEach(period => {
        const daysInYear = isLeapYear(period.startDate) ? 366 : 365;
        const periodInterest = (period.rate / 100) * 2 * period.days / daysInYear;
        totalInterest += periodInterest;
    });

    return totalInterest;
}

// Функция расчёта с ключевой ставкой ЦБ РФ без умножения на 2
//function calculateCBRSingleRate(startDate, endDate, daysMethod = 'includeStartExcludeEnd') {
//    let totalInterest = 0;
//    const periods = getCBRRatesForPeriod(startDate, endDate);
//
//    periods.forEach(period => {
//        const daysInYear = isLeapYear(period.startDate) ? 366 : 365;
//        //totalInterest += (period.rate / 100) * period.days / daysInYear;
//        totalInterest += (period.rate / 100) * 2 * period.days / daysInYear;
//    });
//
//    return totalInterest;
//}

function calculateCBRSingleRate(startDate, endDate, daysMethod = 'includeStartExcludeEnd') {
    let totalInterest = 0;
    const periods = getCBRRatesForPeriod(startDate, endDate);

    periods.forEach(period => {
        const daysInYear = isLeapYear(period.startDate) ? 366 : 365;
        const periodInterest = (period.rate / 100) * period.days / daysInYear;
        totalInterest += periodInterest;
    });

    return totalInterest;
}

// Функция расчёта договорной ставки
function calculateContractualRate(rateValue, ratePeriod, startDate) {
    const daysInYear = isLeapYear(startDate) ? 366 : 365;

    switch (ratePeriod) {
        case 'day':
            return rateValue / 100; // 1.5% в день = 0.015
        case 'month':
            return rateValue / (100 * (daysInYear / 12));
        case 'year':
            return rateValue / (100 * daysInYear);
        default:
            return rateValue / (100 * daysInYear);
    }
}

// Основная функция расчета дневной ставки
function calculateDailyRate(rateType, rateValue, ratePeriod, startDate, endDate, daysMethod = 'includeStartExcludeEnd') {
    const days = calculateDaysBetween(startDate, endDate, daysMethod);
    if (days === 0) return 0;

    switch (rateType) {
        case 'cbr_double':
            return calculateCBRDoubleRate(startDate, endDate, daysMethod) / days;
        case 'cbr_single':
            return calculateCBRSingleRate(startDate, endDate, daysMethod) / days;
        case 'fixed':
            if (ratePeriod === 'day') {
                return rateValue / 100; // 1.5% становится 0.015 (в десятичном виде)
            } else if (ratePeriod === 'month') {
                // Для месячной ставки: рассчитываем эквивалентную дневную ставку
                const months = calculateFullMonthsBetween(startDate, endDate);
                const totalMonthlyInterest = (rateValue / 100) * months;
                return totalMonthlyInterest / days; // в десятичном виде
            } else {
                // Годовая ставка
                const daysInYear = isLeapYear(new Date(startDate)) ? 366 : 365;
                return rateValue / (100 * daysInYear); // в десятичном виде
            }
        default:
            const daysInYear = isLeapYear(new Date(startDate)) ? 366 : 365;
            return rateValue / (100 * daysInYear); // в десятичном виде
    }
}

function getNextRateChangeDate(currentDate) {
    const rateHistory = [
                { start: new Date('2025-07-28'), end: new Date('9999-12-31'), rate: 18.00 },
                { start: new Date('2025-06-09'), end: new Date('2025-07-27'), rate: 20.00 },
                { start: new Date('2024-10-28'), end: new Date('2025-06-08'), rate: 21.00 },
                { start: new Date('2024-09-16'), end: new Date('2024-10-27'), rate: 19.00 },
                { start: new Date('2024-07-29'), end: new Date('2024-09-15'), rate: 18.00 },
                { start: new Date('2023-12-18'), end: new Date('2024-07-28'), rate: 16.00 },
                { start: new Date('2023-10-30'), end: new Date('2023-12-17'), rate: 15.00 },
                { start: new Date('2023-09-18'), end: new Date('2023-10-29'), rate: 13.00 },
                { start: new Date('2023-08-15'), end: new Date('2023-09-17'), rate: 12.00 },
                { start: new Date('2023-07-24'), end: new Date('2023-08-14'), rate: 8.50 },
                { start: new Date('2022-09-19'), end: new Date('2023-07-23'), rate: 7.50 },
                { start: new Date('2022-07-25'), end: new Date('2022-09-18'), rate: 8.00 },
                { start: new Date('2022-06-14'), end: new Date('2022-07-24'), rate: 9.50 },
                { start: new Date('2022-05-27'), end: new Date('2022-06-13'), rate: 11.00 },
                { start: new Date('2022-05-04'), end: new Date('2022-05-26'), rate: 14.00 },
                { start: new Date('2022-04-11'), end: new Date('2022-05-03'), rate: 17.00 },
                { start: new Date('2022-02-28'), end: new Date('2022-04-10'), rate: 20.00 },
                { start: new Date('2022-02-14'), end: new Date('2022-02-27'), rate: 9.50 },
                { start: new Date('2021-12-20'), end: new Date('2022-02-13'), rate: 8.50 },
                { start: new Date('2021-10-25'), end: new Date('2021-12-19'), rate: 7.50 },
                { start: new Date('2021-09-13'), end: new Date('2021-10-24'), rate: 6.75 },
                { start: new Date('2021-07-26'), end: new Date('2021-09-12'), rate: 6.50 },
                { start: new Date('2021-06-15'), end: new Date('2021-07-25'), rate: 5.50 },
                { start: new Date('2021-04-26'), end: new Date('2021-06-14'), rate: 5.00 },
                { start: new Date('2021-03-22'), end: new Date('2021-04-25'), rate: 4.50 },
                { start: new Date('2020-07-27'), end: new Date('2021-03-21'), rate: 4.25 },
                { start: new Date('2020-06-22'), end: new Date('2020-07-26'), rate: 4.50 },
                { start: new Date('2020-04-27'), end: new Date('2020-06-21'), rate: 5.50 },
                { start: new Date('2020-02-10'), end: new Date('2020-04-26'), rate: 6.00 },
                { start: new Date('2019-12-16'), end: new Date('2020-02-09'), rate: 6.25 },
                { start: new Date('2019-10-28'), end: new Date('2019-12-15'), rate: 6.50 },
                { start: new Date('2019-09-09'), end: new Date('2019-10-27'), rate: 7.00 },
                { start: new Date('2019-07-29'), end: new Date('2019-09-08'), rate: 7.25 },
                { start: new Date('2019-06-17'), end: new Date('2019-07-28'), rate: 7.50 },
                { start: new Date('2018-12-17'), end: new Date('2019-06-16'), rate: 7.75 },
                { start: new Date('2018-09-17'), end: new Date('2018-12-16'), rate: 7.50 },
                { start: new Date('2018-03-26'), end: new Date('2018-09-16'), rate: 7.25 },
                { start: new Date('2018-02-12'), end: new Date('2018-03-25'), rate: 7.50 },
                { start: new Date('2017-12-18'), end: new Date('2018-02-11'), rate: 7.75 },
                { start: new Date('2017-10-30'), end: new Date('2017-12-17'), rate: 8.25 },
                { start: new Date('2017-09-18'), end: new Date('2017-10-29'), rate: 8.50 },
                { start: new Date('2017-06-19'), end: new Date('2017-09-17'), rate: 9.00 },
                { start: new Date('2017-05-02'), end: new Date('2017-06-18'), rate: 9.25 },
                { start: new Date('2017-03-27'), end: new Date('2017-05-01'), rate: 9.75 },
                { start: new Date('2016-09-19'), end: new Date('2017-03-26'), rate: 10.00 },
                { start: new Date('2016-08-01'), end: new Date('2016-09-18'), rate: 10.50 }
            ];

    // Находим текущий период
    const currentPeriod = rateHistory.find(p =>
        currentDate >= p.start && currentDate <= p.end
    );

    if (currentPeriod) {
        // Возвращаем дату окончания текущего периода + 1 день
        const nextDate = new Date(currentPeriod.end);
        nextDate.setDate(nextDate.getDate() + 1);
        return nextDate;
    }

    return new Date('9999-12-31'); // По умолчанию
}

//function getRatePeriods() {
//    const cacheKey = 'rate_periods';
//    if (ratePeriodsCache.has(cacheKey)) {
//        return ratePeriodsCache.get(cacheKey);
//    }
//
//    // Используем тот же массив, но создаем копию для безопасности
//    const sortedPeriods = [...CBR_RATE_HISTORY].sort((a, b) => a.start - b.start);
//    ratePeriodsCache.set(cacheKey, sortedPeriods);
//
//    return sortedPeriods;
//}

function getRatePeriods() {
    const cacheKey = 'rate_periods';
    if (ratePeriodsCache.has(cacheKey)) {
        return ratePeriodsCache.get(cacheKey);
    }

    // Создаем глубокую копию и сортируем по дате начала
    const sortedPeriods = CBR_RATE_HISTORY.map(p => ({
        start: new Date(p.start),
        end: new Date(p.end),
        rate: p.rate
    })).sort((a, b) => a.start - b.start);

    // Проверяем непрерывность периодов
    for (let i = 0; i < sortedPeriods.length - 1; i++) {
        const currentEnd = new Date(sortedPeriods[i].end);
        const nextStart = new Date(sortedPeriods[i + 1].start);
        currentEnd.setDate(currentEnd.getDate() + 1); // Добавляем 1 день для проверки непрерывности

        if (currentEnd.getTime() !== nextStart.getTime()) {
            console.warn('Обнаружен разрыв между периодами:',
                sortedPeriods[i].end.toISOString().split('T')[0],
                'и',
                sortedPeriods[i + 1].start.toISOString().split('T')[0]);
        }
    }

    ratePeriodsCache.set(cacheKey, sortedPeriods);

    console.log('Отсортированные периоды:', sortedPeriods.map(p => ({
        start: p.start.toISOString().split('T')[0],
        end: p.end.toISOString().split('T')[0],
        rate: p.rate
    })));

    return sortedPeriods;
}

function testCBRCalculation() {
    // Тестовый период, который охватывает несколько изменений ставок
    const testStart = new Date('2022-01-01');
    const testEnd = new Date('2022-12-31');

    console.log('=== ТЕСТ РАСЧЕТА КЛЮЧЕВОЙ СТАВКИ ===');

    const singleRate = calculateCBRSingleRate(testStart, testEnd);
    const doubleRate = calculateCBRDoubleRate(testStart, testEnd);

    console.log('Одинарная ставка за период:', singleRate);
    console.log('Двойная ставка за период:', doubleRate);

    return { singleRate, doubleRate };
}

function getCBRRateForPeriod(startDate, endDate, multiplier = 1) {
    const periods = getRatePeriods();
    let totalInterest = 0;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate < end) {
        // Находим текущий период ставки
        const currentPeriod = periods.find(p =>
            currentDate >= p.start && currentDate <= p.end
        );

        if (!currentPeriod) break;

        // Определяем конец периода
        const periodEnd = currentPeriod.end > end ? new Date(end) : new Date(currentPeriod.end);

        // Рассчитываем дни
        const daysInPeriod = calculateDaysBetween(currentDate, periodEnd, 'includeStartExcludeEnd');
        const daysInYear = isLeapYear(currentDate) ? 366 : 365;

        // Расчет процентов
        const periodRate = currentPeriod.rate / 100; // Конвертируем в десятичную дробь
        totalInterest += (periodRate * multiplier * daysInPeriod) / daysInYear;

        // Переходим к следующему периоду
        currentDate = new Date(periodEnd);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalInterest;
}

// Функция для отображения дневной ставки в процентах (для UI)
function getDailyRateDisplay(rateType, rateValue, ratePeriod, startDate, endDate, daysMethod) {
    const dailyRateDecimal = calculateDailyRate(rateType, rateValue, ratePeriod, startDate, endDate, daysMethod);
    return (dailyRateDecimal * 100).toFixed(6) + '%'; // преобразуем в проценты
}

function getDaysInYear(date) {
    return isLeapYear(date) ? 366 : 365;
}

function isLeapYear(date) {
    const year = date.getFullYear();
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Функция для точного расчета месячной ставки
function calculateMonthlyRate(rateValue, startDate, endDate, daysMethod = 'includeStartExcludeEnd') {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let totalInterest = 0;
    let currentPeriodStart = new Date(start);
    let remainingDebt = parseFloat(document.getElementById('debt-amount').value) || 0;

    // Обрабатываем частичные платежи
    const payments = getPartialPayments();
    payments.sort((a, b) => {
        const dateA = parseDateWithoutTimezone(a.date);
        const dateB = parseDateWithoutTimezone(b.date);
        return dateA - dateB;
    });

    let paymentIndex = 0;

    while (currentPeriodStart < end) {
        // Определяем конец текущего месячного периода
        const periodEnd = getMonthEndDate(currentPeriodStart);
        const actualPeriodEnd = periodEnd > end ? new Date(end) : periodEnd;

        // Рассчитываем количество дней в периоде согласно выбранному методу
        const daysInPeriod = calculateDaysBetween(currentPeriodStart, actualPeriodEnd, daysMethod);

        // Обрабатываем платежи в этом периоде
        while (paymentIndex < payments.length) {
            const payment = payments[paymentIndex];
            const paymentDate = parseDateWithoutTimezone(payment.date);

            if (paymentDate >= currentPeriodStart && paymentDate < actualPeriodEnd) {
                // Проценты до платежа
                const daysUntilPayment = calculateDaysBetween(currentPeriodStart, paymentDate, daysMethod);
                const interestBeforePayment = remainingDebt * (rateValue / 100) * (daysUntilPayment / getDaysInMonth(currentPeriodStart));
                totalInterest += interestBeforePayment;

                // Применяем платеж
                if (payment.destination === 'debt') {
                    remainingDebt = Math.max(0, remainingDebt - payment.amount);
                }

                currentPeriodStart = new Date(paymentDate);
                paymentIndex++;
            } else {
                break;
            }
        }

        // Проценты за оставшуюся часть периода
        const remainingDays = calculateDaysBetween(currentPeriodStart, actualPeriodEnd, daysMethod);
        const periodInterest = remainingDebt * (rateValue / 100) * (remainingDays / getDaysInMonth(currentPeriodStart));
        totalInterest += periodInterest;

        // Переходим к следующему периоду
        currentPeriodStart = new Date(actualPeriodEnd);
    }

    return totalInterest;
}

function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getDaysCalculationMethod() {
    const selected = document.querySelector('input[name="days-calculation"]:checked');
    return selected ? selected.value : 'includeStartExcludeEnd';
}

function calculateDaysBetween(startDate, endDate, method = 'includeStartExcludeEnd') {
    // Преобразуем даты в UTC для точного расчета
    const startUTC = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endUTC = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    // Разница в миллисекундах
    const timeDiff = endUTC - startUTC;
    const baseDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    let result;
    switch (method) {
        case 'includeBothDays':
            result = baseDays + 1;
            break;
        case 'excludeBothDays':
            result = Math.max(0, baseDays - 1);
            break;
        case 'excludeStartIncludeEnd': // НОВЫЙ ВАРИАНТ
            result = baseDays + 1; // Исключаем начальный, но включаем конечный
            break;
        case 'includeStartExcludeEnd':
        default:
            result = baseDays;
            break;
    }

    console.log(`calculateDaysBetween: ${new Date(startUTC).toISOString().split('T')[0]} - ${new Date(endUTC).toISOString().split('T')[0]}, method: ${method}, result: ${result}`);
    return result;
}

function calculateMonthsBetween(startDate, endDate, method = 'includeStartExcludeEnd') {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let months = 0;
    let currentDate = new Date(start);

    while (currentDate < end) {
        months++;

        // Получаем следующий месяц
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        // Проверяем, не превысили ли конечную дату
        if (nextMonth > end) {
            break;
        }

        currentDate = new Date(nextMonth);
    }

    // Корректируем в зависимости от метода расчета
    switch (method) {
        case 'includeBothDays':
            // Если конечная дата попадает на начало следующего месяца
            if (currentDate.getTime() === start.getTime() && months === 0) {
                months = 1;
            }
            break;
        case 'excludeBothDays':
            months = Math.max(0, months - 1);
            break;
        case 'includeStartExcludeEnd':
        default:
            // Без изменений
            break;
    }

    console.log(`calculateMonthsBetween: ${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}, method: ${method}, result: ${months}`);
    return months;
}

function getMonthEndDate(date, monthsToAdd = 1) {
    const resultDate = new Date(date);
    resultDate.setMonth(resultDate.getMonth() + monthsToAdd);

    // Если исходная дата была последним днем месяца,
    // возвращаем последний день следующего месяца
    const originalDay = date.getDate();
    const lastDayOfMonth = new Date(resultDate.getFullYear(), resultDate.getMonth() + 1, 0).getDate();

    if (originalDay > lastDayOfMonth) {
        resultDate.setDate(lastDayOfMonth);
    }

    return resultDate;
}

function processPartialPayments(debtAmount, interest) {
    const partialPayments = document.querySelectorAll('.partial-payment-item');
    let totalPayments = 0;
    let debtPayments = 0;
    let penaltyPayments = 0;

    partialPayments.forEach(payment => {
        const amount = parseFloat(payment.querySelector('.payment-amount').value) || 0;
        const destination = payment.querySelector('.payment-destination').value;

        totalPayments += amount;

        if (destination === 'debt') {
            debtPayments += amount;
        } else {
            penaltyPayments += amount;
        }
    });

    // Проверяем, чтобы оплаты в счет долга не превышали сам долг
    debtPayments = Math.min(debtPayments, debtAmount);

    // Проверяем, чтобы оплаты в счет неустойки не превышали саму неустойку
    penaltyPayments = Math.min(penaltyPayments, interest);

    return { totalPayments, debtPayments, penaltyPayments };
}

function getPartialPayments() {
    const payments = [];
    const paymentItems = document.querySelectorAll('.partial-payment-item');

    paymentItems.forEach(item => {
        const dateInput = item.querySelector('.payment-date');
        const amountInput = item.querySelector('.payment-amount');
        const destinationSelect = item.querySelector('.payment-destination');

        if (dateInput.value && amountInput.value) {
            payments.push({
                date: dateInput.value,
                amount: parseFloat(amountInput.value),
                destination: destinationSelect.value
            });
        }
    });

    return payments;
}

function getTotalPayments() {
    let total = 0;
    const paymentItems = document.querySelectorAll('.partial-payment-item');

    paymentItems.forEach(item => {
        const amount = parseFloat(item.querySelector('.payment-amount').value) || 0;
        total += amount;
    });

    return total;
}

function getDebtPayments() {
    let total = 0;
    const paymentItems = document.querySelectorAll('.partial-payment-item');

    paymentItems.forEach(item => {
        const amount = parseFloat(item.querySelector('.payment-amount').value) || 0;
        const destination = item.querySelector('.payment-destination').value;

        if (destination === 'debt') {
            total += amount;
        }
    });

    return total;
}


// ================== Функции отображения результатов ==================


//function createFormulaExplanation(data) {
//    // Определяем количество дней в году для годовых ставок
//    const daysInYear = isLeapYear(new Date(data.startDate)) ? 366 : 365;
//
//    // Форматируем отображение процентной ставки
//    let rateDisplay = data.interestRateValue.toFixed(2) + '%';
//    if (data.interestRateType.startsWith('cbr') && data.cbrRatesUsed) {
//            return createCBRFormulaExplanation(data);
//        }
//
//    // Описание метода расчета дней
//    let daysMethodDescription = '';
//    switch (data.daysMethod) {
//        case 'includeBothDays':
//            daysMethodDescription = 'включая начальный и конечный день';
//            break;
//        case 'excludeBothDays':
//            daysMethodDescription = 'исключая начальный и конечный день';
//            break;
//        case 'includeStartExcludeEnd':
//        default:
//            daysMethodDescription = 'включая начальный день, исключая конечный';
//    }
//
//    // Определяем тип ставки и соответствующую формулу
//    let formulaHtml = '';
//    let rateTypeDescription = '';
//    let totalCalculatedInterest = 0; // Для подсчета итоговой суммы процентов
//
//    if (data.interestRateType.startsWith('cbr')) {
//        rateTypeDescription = 'неустойки';
//        formulaHtml = `
//            Сумма неустойки = <br>
//            Сумма долга × ${data.interestRateType === 'cbr_double' ? '(Ставка ЦБ × 2)' : rateDisplay} × Количество дней<br>
//            ─────────────────────────────────────────────────────────────────<br>
//                                      100 × ${daysInYear}
//        `;
//    } else {
//        // Для договорных процентов
//        rateTypeDescription = 'процентов';
//
//        if (data.ratePeriod === 'month') {
//            // МЕСЯЧНАЯ СТАВКА - исправленная формула
//            const fullMonths = calculateFullMonthsBetween(new Date(data.startDate), new Date(data.endDate));
//            const remainingDays = calculateRemainingDaysAfterMonths(new Date(data.startDate), new Date(data.endDate), fullMonths);
//
//            // Расчет процентов за полные месяцы
//            const interestForFullMonths = data.debtAmount * (data.interestRateValue / 100) * fullMonths;
//
//            // Расчет процентов за неполный месяц
//            let interestForRemainingDays = 0;
//            if (remainingDays > 0) {
//                const afterFullMonthsDate = addMonths(new Date(data.startDate), fullMonths);
//                const daysInCurrentMonth = getDaysInMonth(afterFullMonthsDate);
//                interestForRemainingDays = data.debtAmount * (data.interestRateValue / 100) * (remainingDays / daysInCurrentMonth);
//            }
//
//            totalCalculatedInterest = interestForFullMonths + interestForRemainingDays;
//
//            formulaHtml = `
//                Сумма процентов = <br>
//                Проценты за полные месяцы + Проценты за неполный месяц<br>
//                = ${data.debtAmount.toFixed(2)} × ${data.interestRateValue}% × ${fullMonths}<br>
//                + ${data.debtAmount.toFixed(2)} × ${data.interestRateValue}% × (${remainingDays} / дней в месяце)<br>
//                = ${totalCalculatedInterest.toFixed(2)} руб.
//            `;
//        }
//        else if (data.ratePeriod === 'year') {
//              const yearlyResult = calculateYearlyInterestWithDetails(
//                  data.debtAmount,
//                  data.interestRateValue,
//                  new Date(data.startDate),
//                  new Date(data.endDate),
//                  data.daysMethod,
//                  data.calculationStages.filter(s => s.payment).map(s => s.payment)
//              );
//
//              totalCalculatedInterest = yearlyResult.totalInterest;
//
//              formulaHtml = `
//                  Сумма процентов = Σ(Сумма долга × Ставка × (Период / Год))<br>
//                  <strong>Детали по периодам:</strong><br>
//              `;
//
//              yearlyResult.calculationDetails.forEach(detail => {
//                  if (detail.type === 'Погашение') {
//                      formulaHtml += `${detail.startDate} - ${detail.type}: ${detail.principal.toFixed(2)} руб.<br>`;
//                  } else {
//                      formulaHtml += `${detail.startDate} - ${detail.endDate} (${detail.days} дней, ${detail.type}): ${detail.interest.toFixed(2)} руб.<br>`;
//                  }
//              });
//
//              formulaHtml += `<strong>Итого:</strong> ${totalCalculatedInterest.toFixed(2)} руб.`;
//          }
//        else if (data.ratePeriod === 'day') {
//            // ДНЕВНАЯ СТАВКА
//            totalCalculatedInterest = (data.debtAmount * data.interestRateValue * data.days) / 100;
//
//            formulaHtml = `
//                Сумма процентов = <br>
//                Сумма долга × Дневная ставка × Количество дней<br>
//                = ${data.debtAmount.toFixed(2)} × ${data.interestRateValue}% × ${data.days}<br>
//                = ${totalCalculatedInterest.toFixed(2)} руб.
//            `;
//        } else {
//            // ГОДОВАЯ СТАВКА (старый вариант)
//            totalCalculatedInterest = (data.debtAmount * data.interestRateValue * data.days) / (100 * daysInYear);
//
//            formulaHtml = `
//                Сумма процентов = <br>
//                Сумма долга × ${rateDisplay} × Количество дней<br>
//                ─────────────────────────────────────────────────────────────────<br>
//                                      100 × ${daysInYear}
//                = ${totalCalculatedInterest.toFixed(2)} руб.
//            `;
//        }
//    }
//
//    let explanation = `
//    <div class="formula-explanation">
//        <strong>Методика расчета:</strong><br>
//        <strong>Тип ставки:</strong> ${data.interestRateType.startsWith('cbr') ? 'Ключевая ставка ЦБ РФ' : 'Договорная ставка'}${data.ratePeriod === 'month' ? ' (месячная)' : data.ratePeriod === 'day' ? ' (дневная)' : data.ratePeriod === 'year' ? ' (годовая)' : ''}<br>
//        <strong>Учет дней для начального/конечного периода:</strong> ${daysMethodDescription}<br>
//        <strong>Учет дней для промежуточных периодов:</strong> всегда включая начальный день, исключая конечный<br>
//        <strong>Важно:</strong> Проценты начисляются по конец дня, платежи применяются на начало следующего дня<br>
//        Формула расчёта ${rateTypeDescription}:<br>
//        <div class="math-formula">
//            ${formulaHtml}
//        </div>
//    `;
//
//    // Добавляем детальную информацию о этапах расчета
//    if (data.calculationStages && data.calculationStages.length > 0) {
//        explanation += `<br><strong>Детализация расчета по периодам:</strong>`;
//        explanation += `
//<table class="calculation-details">
//    <tr>
//        <th>Период</th>
//        <th>Дней</th>
//        <th>Тип периода</th>
//        <th>Сумма долга</th>
//        <th>Начислено</th>
//    </tr>
//`;
//
//        let tableTotalInterest = 0;
//        let tableTotalDebt = 0;
//
//        // Для годовой ставки показываем разбивку по годам
//        if (data.ratePeriod === 'year') {
//            let currentDate = new Date(data.startDate);
//            const endDate = new Date(data.endDate);
//            let periodCount = 0;
//
//            while (currentDate < endDate) {
//                const nextYearDate = getYearEndDate(currentDate);
//                const periodEnd = nextYearDate > endDate ? new Date(endDate) : nextYearDate;
//                const daysInPeriod = calculateDaysBetween(currentDate, periodEnd, data.daysMethod);
//                const daysInCurrentYear = isLeapYear(currentDate) ? 366 : 365;
//
//                periodCount++;
//
//                let periodType = 'Неполный год';
//                let periodInterest;
//
//                if (periodEnd.getTime() === nextYearDate.getTime()) {
//                    periodType = 'Полный год';
//                    periodInterest = data.debtAmount * (data.interestRateValue / 100);
//                } else {
//                    periodInterest = data.debtAmount * (data.interestRateValue / 100) * (daysInPeriod / daysInCurrentYear);
//                }
//
//                tableTotalInterest += periodInterest;
//                tableTotalDebt += data.debtAmount;
//
//                explanation += `
//    <tr>
//        <td>${currentDate.toISOString().split('T')[0]} - ${periodEnd.toISOString().split('T')[0]}</td>
//        <td>${daysInPeriod}</td>
//        <td>${periodType}</td>
//        <td>${data.debtAmount.toFixed(2)} руб.</td>
//        <td>${periodInterest.toFixed(2)} руб.</td>
//    </tr>
//`;
//
//                currentDate = new Date(periodEnd);
//                currentDate.setDate(currentDate.getDate() + 1);
//            }
//        } else {
//            // Для других типов ставок используем старую логику
//            data.calculationStages.forEach((stage, index) => {
//                let methodDesc = '';
//                switch (stage.daysMethod) {
//                    case 'includeBothDays':
//                        methodDesc = 'Включая оба дня';
//                        break;
//                    case 'excludeBothDays':
//                        methodDesc = 'Исключая оба дня';
//                        break;
//                    case 'payment':
//                        methodDesc = 'Платеж';
//                        break;
//                    case 'includeStartExcludeEnd':
//                    default:
//                        methodDesc = 'Включая начальный, исключая конечный';
//                }
//
//                if (stage.daysMethod === 'payment') {
//                let paymentTypeInfo = '';
//                    if (stage.payment.destination === 'debt') {
//                        paymentTypeInfo = 'в счёт долга';
//                    } else if (stage.payment.destination === 'penalty') {
//                        paymentTypeInfo = 'в счёт неустойки (сумма долга не уменьшается)';
//                    }
//
//                    explanation += `
//    <tr class="payment-row">
//        <td>${stage.startDate}</td>
//        <td>${stage.days}</td>
//        <td>Платеж: ${paymentTypeInfo}</td>
//        <td>${stage.principal.toFixed(2)} руб.</td>
//        <td>-${stage.payment.amount.toFixed(2)} руб.</td>
//    </tr>
//`;
//                } else {
//                    tableTotalInterest += stage.interest;
//                    tableTotalDebt += stage.principal;
//
//                    explanation += `
//    <tr>
//        <td>${stage.startDate} - ${stage.endDate}</td>
//        <td>${stage.days}</td>
//                        <td>${methodDesc}</td>
//                        <td>${stage.principal.toFixed(2)} руб.</td>
//                        <td>${stage.interest.toFixed(2)} руб.</td>
//                    </tr>
//`;
//                }
//            });
//        }
//
//        // ДОБАВЛЯЕМ ИТОГОВУЮ СТРОКУ ДЛЯ ВСЕХ ТИПОВ РАСЧЕТОВ
//        explanation += `
//            <tr class="total-row">
//                <td colspan="3"><strong>Итого по начислениям</strong></td>
//                <td><strong>${data.debtAmount.toFixed(2)} руб.</strong></td>
//                <td><strong>${tableTotalInterest.toFixed(2)} руб.</strong></td>
//            </tr>
//        `;
//
//        explanation += `</table>`;
//
//        // Добавляем информацию о применении ограничения
//        if (data.maxRate) {
//            explanation += `<br><strong>Применено ограничение:</strong> неустойка не может превышать ${data.maxRate}% от суммы долга (${(data.debtAmount * data.maxRate / 100).toFixed(2)} руб.)<br>`;
//        }
//
//        // Итоговая сумма задолженности - используем tableTotalInterest, который равен сумме из колонки "Начислено"
//        explanation += `
//        <br><br>
//        <strong>Итоговая сумма задолженности:</strong><br>
//        Основной долг: ${data.debtAmount.toFixed(2)} руб.<br>
//        Начисленные ${data.interestRateType.startsWith('cbr') ? 'неустойки' : 'проценты'}: ${tableTotalInterest.toFixed(2)} руб.<br>
//        Оплачено: ${data.totalPayments.toFixed(2)} руб.<br>
//        <strong>Общая сумма к оплате: ${(data.debtAmount + tableTotalInterest - data.totalPayments).toFixed(2)} руб.</strong>
//        `;
//    }
//
//    explanation += `</div>`;
//    return explanation;
//}

function createFormulaExplanation(data) {
    // Определяем количество дней в году для годовых ставок
    const daysInYear = isLeapYear(new Date(data.startDate)) ? 366 : 365;

    // Форматируем отображение процентной ставки
    let rateDisplay = data.interestRateValue.toFixed(2) + '%';

    if (data.interestRateType.startsWith('cbr') && data.cbrRatesUsed) {
        return createCBRFormulaExplanation(data);
    }

    // Описание метода расчета дней
    let daysMethodDescription = '';
    switch (data.daysMethod) {
        case 'includeBothDays':
            daysMethodDescription = 'включая начальный и конечный день';
            break;
        case 'excludeBothDays':
            daysMethodDescription = 'исключая начальный и конечный день';
            break;
        case 'includeStartExcludeEnd':
        default:
            daysMethodDescription = 'включая начальный день, исключая конечный';
    }

    // Определяем тип ставки и соответствующую формулу
    let formulaHtml = '';
    let rateTypeDescription = '';
    let totalCalculatedInterest = 0;

    if (data.interestRateType.startsWith('cbr')) {
        rateTypeDescription = 'неустойки';
        formulaHtml = `
            Сумма неустойки = <br>
            Сумма долга × ${data.interestRateType === 'cbr_double' ? '(Ставка ЦБ × 2)' : rateDisplay} × Количество дней<br>
            ─────────────────────────────────────────────────────────────────<br>
                                      100 × ${daysInYear}
        `;
    } else {
        // Для договорных процентов
        rateTypeDescription = 'процентов';

        if (data.ratePeriod === 'month') {
            // МЕСЯЧНАЯ СТАВКА
            const fullMonths = calculateFullMonthsBetween(new Date(data.startDate), new Date(data.endDate));
            const remainingDays = calculateRemainingDaysAfterMonths(new Date(data.startDate), new Date(data.endDate), fullMonths);

            const interestForFullMonths = data.debtAmount * (data.interestRateValue / 100) * fullMonths;
            let interestForRemainingDays = 0;

            if (remainingDays > 0) {
                const afterFullMonthsDate = addMonths(new Date(data.startDate), fullMonths);
                const daysInCurrentMonth = getDaysInMonth(afterFullMonthsDate);
                interestForRemainingDays = data.debtAmount * (data.interestRateValue / 100) * (remainingDays / daysInCurrentMonth);
            }

            totalCalculatedInterest = interestForFullMonths + interestForRemainingDays;

            formulaHtml = `
                Сумма процентов = <br>
                Проценты за полные месяцы + Проценты за неполный месяц<br>
                = ${data.debtAmount.toFixed(2)} × ${data.interestRateValue}% × ${fullMonths}<br>
                + ${data.debtAmount.toFixed(2)} × ${data.interestRateValue}% × (${remainingDays} / дней в месяце)<br>
                = ${totalCalculatedInterest.toFixed(2)} руб.
            `;
        } else if (data.ratePeriod === 'year') {
            // ГОДОВАЯ СТАВКА - детализированный расчет по годам
            let currentDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            let formulaDetails = '';
            let yearCount = 0;
            totalCalculatedInterest = 0;

            while (currentDate < endDate) {
                const nextYearDate = getYearEndDate(currentDate);
                const periodEnd = nextYearDate > endDate ? new Date(endDate) : nextYearDate;
                const daysInPeriod = calculateDaysBetween(currentDate, periodEnd, data.daysMethod);
                const daysInCurrentYear = isLeapYear(currentDate) ? 366 : 365;

                yearCount++;

                let periodInterest;
                if (periodEnd.getTime() === nextYearDate.getTime()) {
                    periodInterest = data.debtAmount * (data.interestRateValue / 100);
                    formulaDetails += `${currentDate.toISOString().split('T')[0]} - ${periodEnd.toISOString().split('T')[0]} (${daysInPeriod} дней, Полный год): ${periodInterest.toFixed(2)} руб.<br>`;
                } else {
                    periodInterest = data.debtAmount * (data.interestRateValue / 100) * (daysInPeriod / daysInCurrentYear);
                    formulaDetails += `${currentDate.toISOString().split('T')[0]} - ${periodEnd.toISOString().split('T')[0]} (${daysInPeriod} дней, Часть периода): ${periodInterest.toFixed(2)} руб.<br>`;
                }

                totalCalculatedInterest += periodInterest;
                currentDate = new Date(periodEnd);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // ИСПРАВЛЕННАЯ ЧАСТЬ - убраны лишние отступы
            formulaHtml = `
Сумма процентов = Σ(Сумма долга × Ставка × (Период / Год))<br>
<strong>Детали по периодам:</strong><br>
${formulaDetails}
<strong>Итого:</strong> ${totalCalculatedInterest.toFixed(2)} руб.
            `;
        } else if (data.ratePeriod === 'day') {
            // ДНЕВНАЯ СТАВКА
            //totalCalculatedInterest = (data.debtAmount * data.interestRateValue * data.days) / 100;
            totalCalculatedInterest = data.debtAmount * (data.interestRateValue / 100) * data.days;

            formulaHtml = `
                Сумма процентов = <br>
                Сумма долга × Дневная ставка × Количество дней<br>
                = ${data.debtAmount.toFixed(2)} × ${data.interestRateValue}% × ${data.days}<br>
                = ${totalCalculatedInterest.toFixed(2)} руб.
            `;
        } else {
            // ГОДОВАЯ СТАВКА (старый вариант)
            totalCalculatedInterest = (data.debtAmount * data.interestRateValue * data.days) / (100 * daysInYear);

            formulaHtml = `
                Сумма процентов = <br>
                Сумма долга × ${rateDisplay} × Количество дней<br>
                ─────────────────────────────────────────────────────────────────<br>
                                      100 × ${daysInYear}
                = ${totalCalculatedInterest.toFixed(2)} руб.
            `;
        }
    }

    // ИСПРАВЛЕННАЯ ЧАСТЬ - убраны лишние отступы и выровнено по левому краю
    let explanation = `
<div class="formula-explanation" style="text-align: left;">
<strong>Методика расчета:</strong><br>
<strong>Тип ставки:</strong> ${data.interestRateType.startsWith('cbr') ? 'Ключевая ставка ЦБ РФ' : 'Договорная ставка'}${data.ratePeriod === 'month' ? ' (месячная)' : data.ratePeriod === 'day' ? ' (дневная)' : data.ratePeriod === 'year' ? ' (годовая)' : ''}<br>
<strong>Учет дней для начального/конечного периода:</strong> ${daysMethodDescription}<br>
<strong>Учет дней для промежуточных периодов:</strong> всегда включая начальный день, исключая конечный<br>
<strong>Важно:</strong> Проценты начисляются по конец дня, платежи применяются на начало следующего дня<br>
Формула расчёта ${rateTypeDescription}:<br>
<div class="math-formula" style="text-align: left;">
${formulaHtml}
</div>
`;

    // Добавляем детальную информацию о этапах расчета
    if (data.calculationStages && data.calculationStages.length > 0) {
        explanation += `<br><strong>Детализация расчета по периодам:</strong>`;
        explanation += `
<table class="calculation-details" style="width: 100%; text-align: left;">
<tr>
<th style="text-align: left;">Период</th>
<th style="text-align: left;">Дней</th>
<th style="text-align: left;">Тип периода</th>
<th style="text-align: left;">Сумма долга</th>
<th style="text-align: left;">Начислено</th>
</tr>
`;

        let tableTotalInterest = 0;
        let tableTotalDebt = 0;

        data.calculationStages.forEach((stage, index) => {
            let methodDesc = '';
            switch (stage.daysMethod) {
                case 'includeBothDays':
                    methodDesc = 'Включая оба дня';
                    break;
                case 'excludeBothDays':
                    methodDesc = 'Исключая оба дня';
                    break;
                case 'payment':
                    methodDesc = 'Платеж';
                    break;
                case 'includeStartExcludeEnd':
                default:
                    methodDesc = 'Включая начальный, исключая конечный';
            }

            if (stage.daysMethod === 'payment') {
                let paymentTypeInfo = '';
                if (stage.payment.destination === 'debt') {
                    paymentTypeInfo = 'в счёт долга';
                } else if (stage.payment.destination === 'penalty') {
                    paymentTypeInfo = 'в счёт неустойки (сумма долга не уменьшается)';
                }

                explanation += `
<tr class="payment-row">
<td style="text-align: left;">${stage.startDate}</td>
<td style="text-align: left;">${stage.days}</td>
<td style="text-align: left;">Платеж: ${paymentTypeInfo}</td>
<td style="text-align: left;">${stage.principal.toFixed(2)} руб.</td>
<td style="text-align: left;">-${stage.payment.amount.toFixed(2)} руб.</td>
</tr>
`;
            } else {
                tableTotalInterest += stage.interest;
                tableTotalDebt += stage.principal;

                explanation += `
<tr>
<td style="text-align: left;">${stage.startDate} - ${stage.endDate}</td>
<td style="text-align: left;">${stage.days}</td>
<td style="text-align: left;">${methodDesc}</td>
<td style="text-align: left;">${stage.principal.toFixed(2)} руб.</td>
<td style="text-align: left;">${stage.interest.toFixed(2)} руб.</td>
</tr>
`;
            }
        });

        explanation += `
<tr class="total-row">
<td colspan="3" style="text-align: left;"><strong>Итого по начислениям</strong></td>
<td style="text-align: left;"><strong>${data.debtAmount.toFixed(2)} руб.</strong></td>
<td style="text-align: left;"><strong>${tableTotalInterest.toFixed(2)} руб.</strong></td>
</tr>
</table>
`;

        if (data.maxRate) {
            explanation += `<br><strong>Применено ограничение:</strong> неустойка не может превышать ${data.maxRate}% от суммы долга (${(data.debtAmount * data.maxRate / 100).toFixed(2)} руб.)<br>`;
        }

        explanation += `
<br>
<strong>Итоговая сумма задолженности:</strong><br>
Основной долг: ${data.debtAmount.toFixed(2)} руб.<br>
Начисленные ${data.interestRateType.startsWith('cbr') ? 'неустойки' : 'проценты'}: ${tableTotalInterest.toFixed(2)} руб.<br>
Оплачено: ${data.totalPayments.toFixed(2)} руб.<br>
<strong>Общая сумма к оплате: ${(data.debtAmount + tableTotalInterest - data.totalPayments).toFixed(2)} руб.</strong>
`;
    }

    explanation += `</div>`;
    return explanation;
}

function createCBRFormulaExplanation(data) {
    let formulaHtml = '';
    let totalInterest = 0;

    formulaHtml += `
        <strong>Методика расчета неустойки по ключевой ставке ЦБ РФ${data.interestRateType === 'cbr_double' ? ' (×2)' : ''}:</strong><br>
        Расчет выполняется с учетом изменения ключевой ставки в течение периода<br>
    `;

    // Детализация по периодам с разными ставками
    data.cbrRatesUsed.forEach((period, index) => {
        const daysInYear = isLeapYear(period.startDate) ? 366 : 365;
        const multiplier = data.interestRateType === 'cbr_double' ? 2 : 1;
        const periodInterest = (data.debtAmount * period.rate * multiplier * period.days) / (100 * daysInYear);
        totalInterest += periodInterest;

        formulaHtml += `
            <div class="rate-period">
                <strong>Период ${index + 1}:</strong> ${period.startDate.toISOString().split('T')[0]} - ${period.endDate.toISOString().split('T')[0]}<br>
                Ставка ЦБ: ${period.rate}% ${multiplier > 1 ? `× ${multiplier} = ${(period.rate * multiplier).toFixed(2)}%` : ''}<br>
                Дней: ${period.days}<br>
                Начислено: ${periodInterest.toFixed(2)} руб.<br>
            </div>
        `;
    });

    formulaHtml += `
        <div class="total-interest">
            <strong>Итого неустойка:</strong> ${totalInterest.toFixed(2)} руб.<br>
            Формула для каждого периода: Сумма долга × Ставка × Дни / (100 × Дней в году)
        </div>
    `;

    return `<div class="formula-explanation">${formulaHtml}</div>`;
}

function createMonthlyRateExplanation(data, rateValue) {
    const explanation = `
    <div class="formula-explanation">
        <strong>Методика расчета месячных процентов:</strong><br>
        <strong>Особенности расчета:</strong><br>
        - Срок в один месяц истекает в соответствующее число следующего месяца<br>
        - Если соответствующего числа нет, срок истекает в последний день месяца<br>
        - Учет дней: ${getDaysMethodDescription(data.daysMethod)}<br>
        <div class="math-formula">
            Проценты за месяц = Сумма долга × ${rateValue}%<br>
            Проценты за неполный месяц = Сумма долга × ${rateValue}% × (Дней в периоде / Дней в месяце)
        </div>
    `;

    return explanation;
}

function getDaysMethodDescription(method) {
    switch (method) {
        case 'includeBothDays':
            return 'включая начальный и конечный день';
        case 'excludeBothDays':
            return 'исключая начальный и конечный день';
        case 'excludeStartIncludeEnd': // НОВЫЙ ВАРИАНТ
            return 'исключая начальный день, включая конечный';
        case 'includeStartExcludeEnd':
        default:
            return 'включая начальный день, исключая конечный';
    }
}

function getIntermediateDaysMethod() {
    // Для промежуточных периодов всегда используем "включая начальный день, исключая конечный"
    return 'includeStartExcludeEnd';
}

function createCBRDoubleExplanation(data) {
    const daysInYear = isLeapYear(new Date(data.startDate)) ? 366 : 365;
    const cbrRate = data.interestRateValue;

    return `
    <div class="formula-explanation">
    <strong>Методика расчета неустойки по ключевой ставке ЦБ РФ (×2):</strong><br>
    Расчет выполняется согласно ст. 395 ГК РФ (двойная ключевая ставка)<br>
    <div class="math-formula">
    Неустойка = <br>
    Сумма долга × (${cbrRate}% × 2) × Количество дней просрочки<br>
    ────────────────────────────────────────────────────────────────<br>
                          ${daysInYear} × 100
    </div>
    ${createDetailedCalculationTable(data, cbrRate * 2, true)}
    </div>`;
}

function createCBRSingleExplanation(data) {
    const daysInYear = isLeapYear(new Date(data.startDate)) ? 366 : 365;
    const cbrRate = data.interestRateValue;

    return `
    <div class="formula-explanation">
    <strong>Методика расчета неустойки по ключевой ставке ЦБ РФ:</strong><br>
    <div class="math-formula">
    Неустойка = <br>
    Сумма долга × ${cbrRate}% × Количество дней просрочки<br>
    ───────────────────────────────────────────────────────<br>
                     ${daysInYear} × 100
    </div>
    ${createDetailedCalculationTable(data, cbrRate, false)}
    </div>`;
}

function createContractualExplanation(data) {
    const rateValue = typeof data.interestRate === 'number' ? data.interestRate : 0;
    const daysInYear = isLeapYear(new Date(data.startDate)) ? 366 : 365;

    return `
    <div class="formula-explanation">
    <strong>Методика расчета договорных процентов:</strong><br>
    <div class="math-formula">
    Проценты = <br>
    Сумма долга × Годовая ставка × Количество дней просрочки<br>
    ───────────────────────────────────────────────────────<br>
                    ${daysInYear} × 100
    </div>
    ${createDetailedCalculationTable(data, rateValue)}
    </div>`;
}

function createDetailedCalculationTable(data, rateValue) {
    if (!data.calculationStages?.length) return '';

    let tableHtml = `<br><strong>Детализация расчета по периодам:</strong>
    <table class="calculation-details">...</table>`;

    // Реализация таблиды с правильными формулами
    return tableHtml;
}

// ================== Отображение результатов ==================

function showResults(data) {
    console.log('=== DEBUG: showResults ===');

    let container = document.querySelector('.results-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'results-container';
        const calculatorContainer = document.querySelector('.calculator-container');
        if (calculatorContainer) {
            calculatorContainer.appendChild(container);
        } else {
            document.body.appendChild(container);
        }
    }

    // Определяем выбранный формат отображения
    const textViewRadio = document.getElementById('text-view');
    const tableViewRadio = document.getElementById('table-view');
    const useTableView = tableViewRadio ? tableViewRadio.checked : false;

    let htmlContent = `<h2>Расчёт задолженности:</h2>`;
    htmlContent += `<p><strong>Начальная сумма:</strong> ${data.debtAmount.toFixed(2)} руб.</p>`;
    htmlContent += `<p><strong>Период расчета:</strong> с ${data.startDate} по ${data.endDate} (${data.days} ${getDaysWord(data.days)})</p>`;
    htmlContent += `<p><strong>Процентная ставка:</strong> ${data.interestRate}</p>`;
    htmlContent += `<p><strong>Метод расчета дней:</strong> ${getDaysMethodDescription(data.daysMethod)}</p>`;

    if (data.maxRate) {
        htmlContent += `<p><strong>Применено ограничение по максимальной ставке:</strong> ${data.maxRate}%</p>`;
    }

    // Выбираем формат отображения в зависимости от настроек
    if (useTableView) {
        // ТАБЛИЧНЫЙ ФОРМАТ
        if (data.interestRateType.startsWith('cbr') && data.cbrRatesUsed && data.cbrRatesUsed.length > 0) {
            htmlContent += createCBRDetailedResultsTable(data);
        } else if (data.ratePeriod === 'month') {
            htmlContent += createMonthlyDetailedResultsTable(data);
        } else if (data.ratePeriod === 'year') {
            htmlContent += createYearlyDetailedResultsTable(data);
        } else if (data.ratePeriod === 'day') {
            htmlContent += createDailyDetailedResultsTable(data);
        } else if (data.calculationStages && data.calculationStages.length > 0) {
            htmlContent += createGenericDetailedResultsTable(data);
        }
    } else {
        // ТЕКСТОВЫЙ ФОРМАТ (список)
        if (data.interestRateType.startsWith('cbr') && data.cbrRatesUsed && data.cbrRatesUsed.length > 0) {
            htmlContent += createCBRDetailedResultsList(data);
        } else if (data.ratePeriod === 'month') {
            htmlContent += createMonthlyDetailedResultsList(data);
        } else if (data.ratePeriod === 'year') {
            htmlContent += createYearlyDetailedResultsList(data);
        } else if (data.ratePeriod === 'day') {
            htmlContent += createDailyDetailedResultsList(data);
        } else if (data.calculationStages && data.calculationStages.length > 0) {
            htmlContent += createGenericDetailedResultsList(data);
        }
    }

    // Общая итоговая информация
    htmlContent += `<h3>Итого:</h3>`;
    htmlContent += `<p><strong>Остаток основного долга:</strong> ${data.remainingDebt.toFixed(2)} руб.</p>`;
    htmlContent += `<p><strong>Сумма начисленных ${data.interestRateType.startsWith('cbr') ? 'неустойки' : 'процентов'}:</strong> ${data.interest.toFixed(2)} руб.</p>`;

    if (data.totalPayments > 0) {
        htmlContent += `<p><strong>Общая сумма платежей:</strong> ${data.totalPayments.toFixed(2)} руб. (${data.debtPayments.toFixed(2)} в счет долга, ${data.penaltyPayments.toFixed(2)} в счет неустойки)</p>`;
    }

    htmlContent += `<p class="total-amount"><strong>К оплате:</strong> ${data.amountToPay.toFixed(2)} руб.</p>`;

    container.innerHTML = htmlContent;
}


// ================== ФУНКЦИИ ДЛЯ ТАБЛИЧНОГО ФОРМАТА ==================

function createCBRDetailedResultsTable(data) {
    const multiplier = data.interestRateType === 'cbr_double' ? 2 : 1;
    const rateTypeName = multiplier === 2 ? 'Ключевая ставка ЦБ РФ × 2' : 'Ключевая ставка ЦБ РФ';

    let html = `<h3>Детализация расчета ${rateTypeName} (таблица):</h3>`;
    html += `<table class="detailed-table">`;
    html += `<tr>
        <th>Период</th>
        <th>Дней</th>
        <th>Ставка ЦБ</th>
        <th>Применяемая ставка</th>
        <th>Сумма долга</th>
        <th>Начислено</th>
        <th>Примечание</th>
    </tr>`;

    let totalInterest = 0;
    let totalDays = 0;

    data.calculationStages.forEach((stage, index) => {
        if (stage.daysMethod === 'payment') {
            const paymentType = stage.payment.destination === 'debt' ? 'Погашение долга' : 'Погашение неустойки';
            html += `<tr class="payment-row">
                <td colspan="2">${stage.startDate}</td>
                <td colspan="2">${paymentType}</td>
                <td>${stage.principal.toFixed(2)} → ${(stage.principal - (stage.payment.destination === 'debt' ? stage.payment.amount : 0)).toFixed(2)}</td>
                <td>-${stage.payment.amount.toFixed(2)}</td>
                <td>${stage.payment.description}</td>
            </tr>`;
        } else if (stage.interest > 0) {
            const periodRates = getCBRRatesForPeriod(new Date(stage.startDate), new Date(stage.endDate));
            periodRates.forEach(period => {
                const daysInYear = isLeapYear(period.startDate) ? 366 : 365;
                const appliedRate = period.rate * multiplier;
                const periodInterest = (stage.principal * appliedRate * period.days) / (100 * daysInYear);

                totalInterest += periodInterest;
                totalDays += period.days;

                html += `<tr>
                    <td>${period.startDate.toISOString().split('T')[0]} - ${period.endDate.toISOString().split('T')[0]}</td>
                    <td>${period.days}</td>
                    <td>${period.rate}%</td>
                    <td>${appliedRate}%</td>
                    <td>${stage.principal.toFixed(2)}</td>
                    <td>${periodInterest.toFixed(2)}</td>
                    <td>На сумму ${stage.principal.toFixed(2)} руб.</td>
                </tr>`;
            });
        }
    });

    html += `<tr class="total-row">
        <td colspan="2"><strong>Итого дней: ${totalDays}</strong></td>
        <td colspan="3"><strong>Общая сумма начислений:</strong></td>
        <td><strong>${totalInterest.toFixed(2)} руб.</strong></td>
        <td></td>
    </tr>`;
    html += `</table>`;

    return html;
}

function createMonthlyDetailedResultsTable(data) {
    const monthlyRate = data.interestRateValue / 100;
    let html = `<h3>Детализация расчета месячных процентов (таблица):</h3>`;
    html += `<table class="detailed-table">`;
    html += `<tr>
        <th>Период</th>
        <th>Дней</th>
        <th>Тип периода</th>
        <th>Сумма долга</th>
        <th>Начислено</th>
        <th>Формула</th>
    </tr>`;

    let totalInterest = 0;
    let totalDays = 0;
    let currentPrincipal = data.debtAmount;

    const monthlyPeriods = generateMonthlyPeriods(new Date(data.startDate), new Date(data.endDate), data.calculationStages, data.daysMethod);

    monthlyPeriods.forEach((period, index) => {
        if (period.isPayment) {
            const payment = period.payments[0];
            if (payment.destination === 'debt') {
                const debtBeforePayment = currentPrincipal;
                currentPrincipal = Math.max(0, currentPrincipal - payment.amount);
                html += `<tr class="payment-row">
                    <td>${period.startDate}</td>
                    <td>-</td>
                    <td>Платеж</td>
                    <td>${debtBeforePayment.toFixed(2)} → ${currentPrincipal.toFixed(2)}</td>
                    <td>-${payment.amount.toFixed(2)}</td>
                    <td>Погашение долга</td>
                </tr>`;
            }
        } else {
            let periodInterest = 0;
            let formula = '';

            if (period.isFullMonth) {
                periodInterest = currentPrincipal * monthlyRate;
                formula = `${currentPrincipal.toFixed(2)} × ${data.interestRateValue}%`;
            } else {
                const daysInCurrentMonth = getDaysInMonth(new Date(period.startDate));
                periodInterest = currentPrincipal * monthlyRate * (period.days / daysInCurrentMonth);
                formula = `${currentPrincipal.toFixed(2)} × ${data.interestRateValue}% × ${period.days} / ${daysInCurrentMonth}`;
            }

            totalInterest += periodInterest;
            totalDays += period.days;

            html += `<tr>
                <td>${period.startDate} - ${period.endDate}</td>
                <td>${period.days}</td>
                <td>${period.isFullMonth ? 'Полный месяц' : 'Часть месяца'}</td>
                <td>${currentPrincipal.toFixed(2)}</td>
                <td>${periodInterest.toFixed(2)}</td>
                <td>${formula}</td>
            </tr>`;
        }
    });

    html += `<tr class="total-row">
        <td colspan="3"><strong>Итого дней: ${totalDays}</strong></td>
        <td colspan="2"><strong>Общая сумма начислений:</strong></td>
        <td><strong>${totalInterest.toFixed(2)} руб.</strong></td>
    </tr>`;
    html += `</table>`;

    return html;
}

function createYearlyDetailedResultsTable(data) {
    let html = `<h3>Детализация расчета годовых процентов (таблица):</h3>`;
    html += `<table class="detailed-table">`;
    html += `<tr>
        <th>Период</th>
        <th>Дней</th>
        <th>Тип периода</th>
        <th>Сумма долга</th>
        <th>Начислено</th>
        <th>Ставка</th>
    </tr>`;

    let totalInterest = 0;
    let totalDays = 0;
    let currentPrincipal = data.debtAmount;

    data.calculationStages.forEach(stage => {
        if (stage.daysMethod === 'payment') {
            const paymentType = stage.payment.destination === 'debt' ? 'Погашение долга' : 'Погашение неустойки';
            html += `<tr class="payment-row">
                <td>${stage.startDate}</td>
                <td>-</td>
                <td>Платеж</td>
                <td>${stage.principal.toFixed(2)}</td>
                <td>-${stage.payment.amount.toFixed(2)}</td>
                <td>${paymentType}</td>
            </tr>`;
            if (stage.payment.destination === 'debt') {
                currentPrincipal = Math.max(0, currentPrincipal - stage.payment.amount);
            }
        } else if (stage.interest > 0) {
            totalInterest += stage.interest;
            totalDays += stage.days;

            html += `<tr>
                <td>${stage.startDate} - ${stage.endDate}</td>
                <td>${stage.days}</td>
                <td>${getDaysMethodDescription(stage.daysMethod)}</td>
                <td>${stage.principal.toFixed(2)}</td>
                <td>${stage.interest.toFixed(2)}</td>
                <td>${data.interestRateValue}% годовых</td>
            </tr>`;
        }
    });

    html += `<tr class="total-row">
        <td colspan="3"><strong>Итого дней: ${totalDays}</strong></td>
        <td colspan="2"><strong>Общая сумма начислений:</strong></td>
        <td><strong>${totalInterest.toFixed(2)} руб.</strong></td>
    </tr>`;
    html += `</table>`;

    return html;
}

function createDailyDetailedResultsTable(data) {
    let html = `<h3>Детализация расчета дневных процентов (таблица):</h3>`;
    html += `<table class="detailed-table">`;
    html += `<tr>
        <th>Период</th>
        <th>Дней</th>
        <th>Сумма долга</th>
        <th>Начислено</th>
        <th>Формула</th>
    </tr>`;

    let totalInterest = 0;
    let totalDays = 0;
    let currentPrincipal = data.debtAmount;

    data.calculationStages.forEach(stage => {
        if (stage.daysMethod === 'payment') {
            const paymentType = stage.payment.destination === 'debt' ? 'Погашение долга' : 'Погашение неустойки';
            html += `<tr class="payment-row">
                <td>${stage.startDate}</td>
                <td>-</td>
                <td>${stage.principal.toFixed(2)}</td>
                <td>-${stage.payment.amount.toFixed(2)}</td>
                <td>${paymentType}</td>
            </tr>`;
            if (stage.payment.destination === 'debt') {
                currentPrincipal = Math.max(0, currentPrincipal - stage.payment.amount);
            }
        } else if (stage.interest > 0) {
            totalInterest += stage.interest;
            totalDays += stage.days;
            const formula = `${stage.principal.toFixed(2)} × ${data.interestRateValue}% × ${stage.days}`;

            html += `<tr>
                <td>${stage.startDate} - ${stage.endDate}</td>
                <td>${stage.days}</td>
                <td>${stage.principal.toFixed(2)}</td>
                <td>${stage.interest.toFixed(2)}</td>
                <td>${formula}</td>
            </tr>`;
        }
    });

    html += `<tr class="total-row">
        <td colspan="2"><strong>Итого дней: ${totalDays}</strong></td>
        <td colspan="2"><strong>Общая сумма начислений:</strong></td>
        <td><strong>${totalInterest.toFixed(2)} руб.</strong></td>
    </tr>`;
    html += `</table>`;

    return html;
}

function createGenericDetailedResultsTable(data) {
    let html = `<h3>Детализация расчета (таблица):</h3>`;
    html += `<table class="detailed-table">`;
    html += `<tr>
        <th>Период</th>
        <th>Дней</th>
        <th>Тип</th>
        <th>Сумма долга</th>
        <th>Начислено</th>
    </tr>`;

    let totalInterest = 0;
    let totalDays = 0;

    data.calculationStages.forEach(stage => {
        if (stage.daysMethod === 'payment') {
            const paymentType = stage.payment.destination === 'debt' ? 'Погашение долга' : 'Погашение неустойки';
            html += `<tr class="payment-row">
                <td>${stage.startDate}</td>
                <td>-</td>
                <td>Платеж</td>
                <td>${stage.principal.toFixed(2)}</td>
                <td>-${stage.payment.amount.toFixed(2)}</td>
            </tr>`;
        } else {
            totalInterest += stage.interest;
            totalDays += stage.days;

            html += `<tr>
                <td>${stage.startDate} - ${stage.endDate}</td>
                <td>${stage.days}</td>
                <td>${getDaysMethodDescription(stage.daysMethod)}</td>
                <td>${stage.principal.toFixed(2)}</td>
                <td>${stage.interest.toFixed(2)}</td>
            </tr>`;
        }
    });

    html += `<tr class="total-row">
        <td colspan="3"><strong>Итого дней: ${totalDays}</strong></td>
        <td><strong>Общая сумма начислений:</strong></td>
        <td><strong>${totalInterest.toFixed(2)} руб.</strong></td>
    </tr>`;
    html += `</table>`;

    return html;
}

// ================== ФУНКЦИИ ДЛЯ ТЕКСТОВОГО ФОРМАТА (СПИСОК) ==================

function createCBRDetailedResultsList(data) {
    const multiplier = data.interestRateType === 'cbr_double' ? 2 : 1;
    const rateTypeName = multiplier === 2 ? 'Ключевая ставка ЦБ РФ × 2' : 'Ключевая ставка ЦБ РФ';

    let html = `<h3>Детализация расчета ${rateTypeName} (список):</h3>`;
    html += `<ul class="calculation-details-list">`;

    let totalInterest = 0;

    data.calculationStages.forEach((stage, index) => {
        html += `<li class="calculation-stage">`;

        if (stage.daysMethod === 'payment') {
            const paymentType = stage.payment.destination === 'debt' ? 'в счет долга' : 'в счет неустойки';
            html += `<div class="stage-main-info"><strong>${stage.startDate}</strong>: Платеж ${stage.payment.amount.toFixed(2)} руб. (${paymentType})</div>`;
        } else if (stage.interest > 0) {
            const periodRates = getCBRRatesForPeriod(new Date(stage.startDate), new Date(stage.endDate));
            periodRates.forEach(period => {
                const daysInYear = isLeapYear(period.startDate) ? 366 : 365;
                const appliedRate = period.rate * multiplier;
                const periodInterest = (stage.principal * appliedRate * period.days) / (100 * daysInYear);
                totalInterest += periodInterest;

                html += `<div class="stage-main-info"><strong>${period.startDate.toISOString().split('T')[0]} - ${period.endDate.toISOString().split('T')[0]}</strong>: ${period.days} дней</div>`;
                html += `<div class="stage-details">Ставка: ${period.rate}% → ${appliedRate}%, На сумму: ${stage.principal.toFixed(2)} руб.</div>`;
                html += `<div class="stage-interest">Начислено: ${periodInterest.toFixed(2)} руб.</div>`;
            });
        }

        html += `</li>`;
    });

    html += `<li class="calculation-total"><strong>Итого начислено: ${totalInterest.toFixed(2)} руб.</strong></li>`;
    html += `</ul>`;

    return html;
}

function createMonthlyDetailedResultsList(data) {
    let html = `<h3>Детализация расчета месячных процентов (список):</h3>`;
    html += `<ul class="calculation-details-list">`;

    let totalInterest = 0;
    let currentPrincipal = data.debtAmount;

    const monthlyPeriods = generateMonthlyPeriods(new Date(data.startDate), new Date(data.endDate), data.calculationStages, data.daysMethod);

    monthlyPeriods.forEach((period, index) => {
        html += `<li class="calculation-stage">`;

        if (period.isPayment) {
            const payment = period.payments[0];
            html += `<div class="stage-main-info"><strong>${period.startDate}</strong>: Платеж ${payment.amount.toFixed(2)} руб.</div>`;
            if (payment.destination === 'debt') {
                html += `<div class="stage-details">Долг: ${currentPrincipal.toFixed(2)} → ${(currentPrincipal - payment.amount).toFixed(2)} руб.</div>`;
                currentPrincipal = Math.max(0, currentPrincipal - payment.amount);
            }
        } else {
            let periodInterest = 0;
            if (period.isFullMonth) {
                periodInterest = currentPrincipal * (data.interestRateValue / 100);
                html += `<div class="stage-main-info"><strong>${period.startDate} - ${period.endDate}</strong>: Полный месяц</div>`;
            } else {
                const daysInCurrentMonth = getDaysInMonth(new Date(period.startDate));
                periodInterest = currentPrincipal * (data.interestRateValue / 100) * (period.days / daysInCurrentMonth);
                html += `<div class="stage-main-info"><strong>${period.startDate} - ${period.endDate}</strong>: ${period.days} дней (часть месяца)</div>`;
            }
            totalInterest += periodInterest;

            html += `<div class="stage-details">На сумму: ${currentPrincipal.toFixed(2)} руб.</div>`;
            html += `<div class="stage-interest">Начислено: ${periodInterest.toFixed(2)} руб.</div>`;
        }

        html += `</li>`;
    });

    html += `<li class="calculation-total"><strong>Итого начислено: ${totalInterest.toFixed(2)} руб.</strong></li>`;
    html += `</ul>`;

    return html;
}

function createYearlyDetailedResultsList(data) {
    let html = `<h3>Детализация расчета годовых процентов (список):</h3>`;
    html += `<ul class="calculation-details-list">`;

    let totalInterest = 0;

    data.calculationStages.forEach(stage => {
        html += `<li class="calculation-stage">`;

        if (stage.daysMethod === 'payment') {
            const paymentType = stage.payment.destination === 'debt' ? 'в счет долга' : 'в счет неустойки';
            html += `<div class="stage-main-info"><strong>${stage.startDate}</strong>: Платеж ${stage.payment.amount.toFixed(2)} руб. (${paymentType})</div>`;
        } else if (stage.interest > 0) {
            totalInterest += stage.interest;
            html += `<div class="stage-main-info"><strong>${stage.startDate} - ${stage.endDate}</strong>: ${stage.days} дней</div>`;
            html += `<div class="stage-details">На сумму: ${stage.principal.toFixed(2)} руб., Ставка: ${data.interestRateValue}% годовых</div>`;
            html += `<div class="stage-interest">Начислено: ${stage.interest.toFixed(2)} руб.</div>`;
        }

        html += `</li>`;
    });

    html += `<li class="calculation-total"><strong>Итого начислено: ${totalInterest.toFixed(2)} руб.</strong></li>`;
    html += `</ul>`;

    return html;
}

function createDailyDetailedResultsList(data) {
    let html = `<h3>Детализация расчета дневных процентов (список):</h3>`;
    html += `<ul class="calculation-details-list">`;

    let totalInterest = 0;

    data.calculationStages.forEach(stage => {
        html += `<li class="calculation-stage">`;

        if (stage.daysMethod === 'payment') {
            const paymentType = stage.payment.destination === 'debt' ? 'в счет долга' : 'в счет неустойки';
            html += `<div class="stage-main-info"><strong>${stage.startDate}</strong>: Платеж ${stage.payment.amount.toFixed(2)} руб. (${paymentType})</div>`;
        } else if (stage.interest > 0) {
            totalInterest += stage.interest;
            html += `<div class="stage-main-info"><strong>${stage.startDate} - ${stage.endDate}</strong>: ${stage.days} дней</div>`;
            html += `<div class="stage-details">На сумму: ${stage.principal.toFixed(2)} руб., Ставка: ${data.interestRateValue}% в день</div>`;
            html += `<div class="stage-interest">Начислено: ${stage.interest.toFixed(2)} руб.</div>`;
        }

        html += `</li>`;
    });

    html += `<li class="calculation-total"><strong>Итого начислено: ${totalInterest.toFixed(2)} руб.</strong></li>`;
    html += `</ul>`;

    return html;
}

function createGenericDetailedResultsList(data) {
    let html = `<h3>Детализация расчета (список):</h3>`;
    html += `<ul class="calculation-details-list">`;

    let totalInterest = 0;

    data.calculationStages.forEach(stage => {
        html += `<li class="calculation-stage">`;

        if (stage.daysMethod === 'payment') {
            const paymentType = stage.payment.destination === 'debt' ? 'в счет долга' : 'в счет неустойки';
            html += `<div class="stage-main-info"><strong>${stage.startDate}</strong>: Платеж ${stage.payment.amount.toFixed(2)} руб. (${paymentType})</div>`;
        } else if (stage.interest > 0) {
            totalInterest += stage.interest;
            html += `<div class="stage-main-info"><strong>${stage.startDate} - ${stage.endDate}</strong>: ${stage.days} дней</div>`;
            html += `<div class="stage-details">На сумму: ${stage.principal.toFixed(2)} руб.</div>`;
            html += `<div class="stage-interest">Начислено: ${stage.interest.toFixed(2)} руб.</div>`;
        }

        html += `</li>`;
    });

    html += `<li class="calculation-total"><strong>Итого начислено: ${totalInterest.toFixed(2)} руб.</strong></li>`;
    html += `</ul>`;

    return html;
}


// ================== ФУНКЦИЯ ДЛЯ ДЕТАЛИЗАЦИИ КЛЮЧЕВОЙ СТАВКИ ЦБ ==================

function createCBRDetailedResults(data) {
    const multiplier = data.interestRateType === 'cbr_double' ? 2 : 1;
    const rateTypeName = multiplier === 2 ? 'Ключевая ставка ЦБ РФ × 2' : 'Ключевая ставка ЦБ РФ';

    let html = `<h3>Детализация расчета ${rateTypeName}:</h3>`;

    // Добавляем информацию о частичных платежах
    if (data.calculationStages && data.calculationStages.length > 0) {
        html += `<div class="payment-info" style="margin-bottom: 15px;">`;
        html += `<strong>Частичные платежи:</strong><br>`;

        data.calculationStages.forEach(stage => {
            if (stage.daysMethod === 'payment' && stage.payment) {
                const paymentType = stage.payment.destination === 'debt' ? 'в счет долга' : 'в счет неустойки';
                html += `- ${stage.startDate}: ${stage.payment.amount.toFixed(2)} руб. (${paymentType})<br>`;
            }
        });

        html += `</div>`;
    }

    html += `<table class="cbr-detailed-table">`;
    html += `<tr>
        <th>Период</th>
        <th>Дней</th>
        <th>Ставка ЦБ</th>
        <th>Применяемая ставка</th>
        <th>Сумма долга</th>
        <th>Начислено</th>
        <th>Примечание</th>
    </tr>`;

    let totalInterest = 0;
    let totalDays = 0;

    // Обрабатываем этапы расчета
    data.calculationStages.forEach((stage, index) => {
        if (stage.daysMethod === 'payment') {
            // Отображаем информацию о платеже
            const paymentType = stage.payment.destination === 'debt' ? 'Погашение долга' : 'Погашение неустойки';
            html += `<tr class="payment-row">
                <td colspan="2">${stage.startDate}</td>
                <td colspan="2">${paymentType}</td>
                <td>${stage.principal.toFixed(2)} → ${(stage.principal - (stage.payment.destination === 'debt' ? stage.payment.amount : 0)).toFixed(2)}</td>
                <td>-${stage.payment.amount.toFixed(2)}</td>
                <td>${stage.payment.description}</td>
            </tr>`;
        } else if (stage.interest > 0) {
            // Отображаем период начисления процентов
            const periodRates = getCBRRatesForPeriod(
                new Date(stage.startDate),
                new Date(stage.endDate)
            );

            periodRates.forEach(period => {
                const daysInYear = isLeapYear(period.startDate) ? 366 : 365;
                const appliedRate = period.rate * multiplier;
                const periodInterest = (stage.principal * appliedRate * period.days) / (100 * daysInYear);

                totalInterest += periodInterest;
                totalDays += period.days;

                html += `<tr>
                    <td>${period.startDate.toISOString().split('T')[0]} - ${period.endDate.toISOString().split('T')[0]}</td>
                    <td>${period.days}</td>
                    <td>${period.rate}%</td>
                    <td>${appliedRate}%</td>
                    <td>${stage.principal.toFixed(2)}</td>
                    <td>${periodInterest.toFixed(2)}</td>
                    <td>На сумму ${stage.principal.toFixed(2)} руб.</td>
                </tr>`;
            });
        }
    });

    html += `<tr class="cbr-total-row">
        <td colspan="2"><strong>Итого дней: ${totalDays}</strong></td>
        <td colspan="3"><strong>Общая сумма начислений:</strong></td>
        <td><strong>${totalInterest.toFixed(2)} руб.</strong></td>
        <td></td>
    </tr>`;
    html += `</table>`;

    html += `<div class="formula-note" style="margin-top: 10px; font-style: italic;">
        <strong>Формула для каждого периода:</strong> Сумма долга × Применяемая ставка × Дни / (100 × Дней в году)
    </div>`;

    return html;
}

function getCBRRatesForPeriodWithDetails(startDate, endDate) {
    const rates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    const periods = getRatePeriods();

    while (currentDate <= end) {
        const currentPeriod = periods.find(p =>
            currentDate >= p.start && currentDate <= p.end
        );

        if (!currentPeriod) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
        }

        const periodEndDate = new Date(Math.min(currentPeriod.end.getTime(), end.getTime()));
        const daysInPeriod = calculateDaysBetween(currentDate, periodEndDate, 'includeStartExcludeEnd') + 1;

        rates.push({
            startDate: new Date(currentDate),
            endDate: new Date(periodEndDate),
            rate: currentPeriod.rate,
            days: daysInPeriod
        });

        currentDate = new Date(periodEndDate);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return rates;
}

//function createMonthlyDetailedResults(data) {
//    const monthlyRate = data.interestRateValue / 100;
//    let html = `<h3>Детализация расчета месячных процентов:</h3>`;
//
//    // Добавляем информацию о частичных платежах
//    if (data.calculationStages && data.calculationStages.length > 0) {
//        const paymentStages = data.calculationStages.filter(stage => stage.daysMethod === 'payment');
//        if (paymentStages.length > 0) {
//            html += `<div class="payment-info" style="margin-bottom: 15px;">`;
//            html += `<strong>Частичные платежи:</strong><br>`;
//            paymentStages.forEach(stage => {
//                const paymentType = stage.payment.destination === 'debt' ? 'в счет долга' : 'в счет неустойки';
//                html += `- ${stage.startDate}: ${stage.payment.amount.toFixed(2)} руб. (${paymentType})<br>`;
//            });
//            html += `</div>`;
//        }
//    }
//
//    html += `<table class="monthly-detailed-table" style="width: 100%; border-collapse: collapse; margin: 15px 0;">`;
//    html += `<tr style="background-color: #f5f5f5;">
//        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Период</th>
//        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Дней</th>
//        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Ставка</th>
//        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Сумма долга</th>
//        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Начислено</th>
//        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Формула расчета</th>
//    </tr>`;
//
//    let totalInterest = 0;
//    let totalDays = 0;
//    let currentPrincipal = data.debtAmount;
//
//    // Создаем детализированные месячные периоды
//    const monthlyPeriods = generateMonthlyPeriods(
//        new Date(data.startDate),
//        new Date(data.endDate),
//        data.calculationStages
//    );
//
//    // Обрабатываем каждый месячный период
//    monthlyPeriods.forEach((period, index) => {
//        // ИСПРАВЛЕНИЕ: используем days из периода, а не неопределенную переменную
//        const daysInPeriod = period.days; // ← ВОТ ИСПРАВЛЕНИЕ
//
//        const periodType = period.isFullMonth ? 'Полный месяц' : 'Часть месяца';
//
//        // Расчет процентов для периода
//        let periodInterest;
//        let formula;
//
////        if (period.isFullMonth) {
////            periodInterest = currentPrincipal * monthlyRate;
////            formula = `${currentPrincipal.toFixed(2)} × ${data.interestRateValue}%`;
////        } else {
////            const daysInCurrentMonth = getDaysInMonth(new Date(period.startDate));
////            periodInterest = currentPrincipal * monthlyRate * (daysInPeriod / daysInCurrentMonth);
////            formula = `${currentPrincipal.toFixed(2)} × ${data.interestRateValue}% × ${daysInPeriod} / ${daysInCurrentMonth}`;
////        }
//
//          if (period.isFullMonth) {
//          // ПОЛНЫЙ МЕСЯЦ: применяем полную месячную ставку
//              periodInterest = currentPrincipal * monthlyRate;
//              formula = `${currentPrincipal.toFixed(2)} × ${data.interestRateValue}%`;
//          } else {
//          // ЧАСТИЧНЫЙ МЕСЯЦ: пропорциональный расчет
//              const daysInCurrentMonth = getDaysInMonth(new Date(period.startDate));
//              periodInterest = currentPrincipal * monthlyRate * (period.days / daysInCurrentMonth);
//              formula = `${currentPrincipal.toFixed(2)} × ${data.interestRateValue}% × ${period.days} / ${daysInCurrentMonth}`;
//}
//
//        totalInterest += periodInterest;
//        totalDays += daysInPeriod;
//
//        html += `<tr>
//            <td style="padding: 8px; border: 1px solid #ddd;">${period.startDate} - ${period.endDate}</td>
//            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${daysInPeriod}</td>
//            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${data.interestRateValue}% (${periodType})</td>
//            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${currentPrincipal.toFixed(2)}</td>
//            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${periodInterest.toFixed(2)}</td>
//            <td style="padding: 8px; border: 1px solid #ddd;">${formula} = ${periodInterest.toFixed(2)} руб.</td>
//        </tr>`;
//
//        // Обновляем текущую сумму долга если были платежи в этом периоде
//        const paymentsInPeriod = period.payments || [];
//        paymentsInPeriod.forEach(payment => {
//            if (payment.destination === 'debt') {
//                currentPrincipal = Math.max(0, currentPrincipal - payment.amount);
//
//                html += `<tr style="background-color: #fffde7;">
//                    <td style="padding: 8px; border: 1px solid #ddd;">${payment.date}</td>
//                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">-</td>
//                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Платеж</td>
//                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">→ ${currentPrincipal.toFixed(2)}</td>
//                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">-${payment.amount.toFixed(2)}</td>
//                    <td style="padding: 8px; border: 1px solid #ddd;">Погашение долга</td>
//                </tr>`;
//            }
//        });
//    });
//
//    html += `<tr style="background-color: #e8f5e8; font-weight: bold;">
//        <td style="padding: 8px; border: 1px solid #ddd;">Итого дней: ${totalDays}</td>
//        <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right;">Общая сумма начислений:</td>
//        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${totalInterest.toFixed(2)} руб.</td>
//        <td style="padding: 8px; border: 1px solid #ddd;"></td>
//    </tr>`;
//    html += `</table>`;
//
//    html += `<div class="formula-note" style="margin-top: 10px; font-style: italic;">
//        <strong>Формула для каждого периода:</strong> Сумма долга × Месячная ставка × Дни в периоде / Дней в месяце
//    </div>`;
//
//    return html;
//}


function createMonthlyDetailedResults(data) {
    const monthlyRate = data.interestRateValue / 100;
    let html = `<h3>Детализация расчета месячных процентов:</h3>`;

    // Добавляем информацию о частичных платежах
    if (data.calculationStages && data.calculationStages.length > 0) {
        const paymentStages = data.calculationStages.filter(stage => stage.daysMethod === 'payment');
        if (paymentStages.length > 0) {
            html += `<div class="payment-info" style="margin-bottom: 15px;">`;
            html += `<strong>Частичные платежи:</strong><br>`;
            paymentStages.forEach(stage => {
                const paymentType = stage.payment.destination === 'debt' ? 'в счет долга' : 'в счет неустойки';
                html += `- ${stage.startDate}: ${stage.payment.amount.toFixed(2)} руб. (${paymentType})<br>`;
            });
            html += `</div>`;
        }
    }

    html += `<table class="monthly-detailed-table" style="width: 100%; border-collapse: collapse; margin: 15px 0;">`;
    html += `<tr style="background-color: #f5f5f5;">
        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Период</th>
        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Дней</th>
        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Ставка</th>
        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Сумма долга</th>
        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Начислено</th>
        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Формула расчета</th>
    </tr>`;

    let totalInterest = 0;
    let totalDays = 0;
    let currentPrincipal = data.debtAmount;

    // Создаем детализированные месячные периоды
    const monthlyPeriods = generateMonthlyPeriods(
        new Date(data.startDate),
        new Date(data.endDate),
        data.calculationStages,
        data.daysMethod
    );

    // Обрабатываем каждый период
    monthlyPeriods.forEach((period, index) => {
        let periodInterest = 0;
        let formula = '';
        let daysDisplay = 0;
        let periodType = '';

        if (period.isPayment) {
            // Обработка платежа
            const payment = period.payments[0];
            if (payment.destination === 'debt') {
                const debtBeforePayment = currentPrincipal;
                currentPrincipal = Math.max(0, currentPrincipal - payment.amount);

                html += `<tr style="background-color: #fffde7;">
                    <td style="padding: 8px; border: 1px solid #ddd;">${period.startDate}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">-</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Платеж</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${debtBeforePayment.toFixed(2)} → ${currentPrincipal.toFixed(2)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">-${payment.amount.toFixed(2)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">Погашение долга</td>
                </tr>`;
            } else if (payment.destination === 'penalty') {
                html += `<tr style="background-color: #fff0f0;">
                    <td style="padding: 8px; border: 1px solid #ddd;">${period.startDate}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">-</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Платеж</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${currentPrincipal.toFixed(2)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">-${payment.amount.toFixed(2)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">Погашение неустойки</td>
                </tr>`;
            }
            return; // Пропускаем расчет процентов для платежа
        }

        // Расчет процентов для обычного периода
        if (period.isFullMonth) {
            // ПОЛНЫЙ МЕСЯЦ: применяем полную месячную ставку
            periodInterest = currentPrincipal * monthlyRate;
            const daysInMonth = getDaysInMonth(new Date(period.startDate));
            daysDisplay = daysInMonth;
            periodType = 'Полный месяц';
            formula = `${currentPrincipal.toFixed(2)} × ${data.interestRateValue}%`;
        } else {
            // ЧАСТИЧНЫЙ МЕСЯЦ: пропорциональный расчет
            const daysInCurrentMonth = getDaysInMonth(new Date(period.startDate));
            periodInterest = currentPrincipal * monthlyRate * (period.days / daysInCurrentMonth);
            daysDisplay = period.days;
            periodType = 'Часть месяца';
            formula = `${currentPrincipal.toFixed(2)} × ${data.interestRateValue}% × ${period.days} / ${daysInCurrentMonth}`;
        }

        totalInterest += periodInterest;
        totalDays += daysDisplay;

        html += `<tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${period.startDate} - ${period.endDate}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${daysDisplay}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${data.interestRateValue}% (${periodType})</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${currentPrincipal.toFixed(2)}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${periodInterest.toFixed(2)}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formula} = ${periodInterest.toFixed(2)} руб.</td>
        </tr>`;
    });

    html += `<tr style="background-color: #e8f5e8; font-weight: bold;">
        <td style="padding: 8px; border: 1px solid #ddd;">Итого дней: ${totalDays}</td>
        <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right;">Общая сумма начислений:</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${totalInterest.toFixed(2)} руб.</td>
        <td style="padding: 8px; border: 1px solid #ddd;"></td>
    </tr>`;
    html += `</table>`;

    html += `<div class="formula-note" style="margin-top: 10px; font-style: italic;">
        <strong>Формула для каждого периода:</strong><br>
        - Полный месяц: Сумма долга × Месячная ставка<br>
        - Часть месяца: Сумма долга × Месячная ставка × Дни в периоде / Дней в месяце<br>
        - Проценты начисляются по день платежа включительно
    </div>`;

    return html;
}


function generateMonthlyPeriods(startDate, endDate, calculationStages, overallDaysMethod = 'includeStartExcludeEnd') {
    const periods = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
        let periodEnd = calculateMonthlyPeriodEnd(currentDate);
        const actualEnd = periodEnd > end ? new Date(end) : periodEnd;

        // Получаем платежи для этого периода
        const paymentsInPeriod = getPaymentsInPeriod(currentDate, actualEnd, calculationStages);

        // Если есть платежи, разбиваем период
        if (paymentsInPeriod.length > 0) {
            const subPeriods = splitPeriodByPayments(currentDate, actualEnd, paymentsInPeriod, overallDaysMethod);
            periods.push(...subPeriods);
        } else {
            // Без платежей - добавляем целый период
            const daysInPeriod = calculateDaysBetween(currentDate, actualEnd, overallDaysMethod);
            if (daysInPeriod > 0) {
                periods.push({
                    startDate: formatDateToYYYYMMDD(currentDate),
                    endDate: formatDateToYYYYMMDD(actualEnd),
                    days: daysInPeriod,
                    payments: [],
                    isFullMonth: isPeriodFullMonth(currentDate, actualEnd)
                });
            }
        }

        // Переход к следующему периоду
        if (overallDaysMethod === 'excludeStartIncludeEnd') {
            currentDate = new Date(actualEnd);
        } else {
            currentDate = new Date(actualEnd);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    return periods;
}

function calculateMonthlyPeriodEnd(startDate) {
    const result = new Date(startDate);
    // Устанавливаем следующий месяц и 0 день (последний день текущего месяца)
    result.setMonth(result.getMonth() + 1);
    result.setDate(0);
    return result;
}

function isPeriodFullMonth(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Проверяем, что период начинается с 1 числа месяца
    if (start.getDate() !== 1) {
        return false;
    }

    // Проверяем, что период заканчивается последним днем месяца
    const lastDayOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0);

    // Сравниваем даты без времени
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const lastDayOnly = new Date(lastDayOfMonth.getFullYear(), lastDayOfMonth.getMonth(), lastDayOfMonth.getDate());

    return endDateOnly.getTime() === lastDayOnly.getTime();
}

function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function isStartLastDayOfMonth(date) {
    return date.getDate() === getDaysInMonth(date);
}

function getPaymentsInPeriod(startDate, endDate, calculationStages) {
    const payments = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    calculationStages.forEach(stage => {
        if (stage.daysMethod === 'payment' && stage.payment) {
            const paymentDate = new Date(stage.startDate);
            if (paymentDate >= start && paymentDate <= end) {
                payments.push({
                    date: stage.startDate,
                    amount: stage.payment.amount,
                    destination: stage.payment.destination
                });
            }
        }
    });
    return payments;
}

function calculateDaysBetweenMonthPeriod(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

//Функция расчёта процентов при частичном погашении долга в течение месячного периода
function calculateInclusiveDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Приводим даты к UTC для избежания проблем с часовыми поясами
    const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

    // Разница в днях + 1 (включая оба дня)
    return Math.floor((endUTC - startUTC) / (1000 * 60 * 60 * 24)) + 1;
}

function calculateInterestByPeriods(startDate, endDate, principal, monthlyRate, calculationStages, startDay) {
    const isFullMonth = isPeriodFullMonth(startDate, endDate, startDay);
    const daysInPeriod = calculateDaysBetween(startDate, endDate);

    // Получаем платежи, привязанные к этому периоду
    const paymentsInPeriod = getPaymentsInPeriod(startDate, endDate, calculationStages);

    // Обновляем сумму долга с учетом платежей
    let currentPrincipal = principal;
    paymentsInPeriod.forEach(payment => {
        currentPrincipal -= payment.amount;
    });

    let interestForPeriod;
    if (isFullMonth) {
        interestForPeriod = currentPrincipal * monthlyRate;
    } else {
        const daysInCurrentMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
        const dailyRate = monthlyRate / daysInCurrentMonth;
        interestForPeriod = currentPrincipal * dailyRate * daysInPeriod;
    }

    return {
        interest: interestForPeriod,
        newPrincipal: currentPrincipal
    };
}

function splitPeriodByPayments(startDate, endDate, payments, overallDaysMethod) {
    const periods = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    // Сортируем платежи по дате
    const sortedPayments = payments
        .filter(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate >= currentDate && paymentDate <= end;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    let paymentIndex = 0;

    while (currentDate <= end && paymentIndex < sortedPayments.length) {
        const payment = sortedPayments[paymentIndex];
        const paymentDate = new Date(payment.date);

        // Период ДО платежа (включая день платежа)
        if (paymentDate > currentDate) {
            const periodEnd = new Date(paymentDate);
            //const daysBeforePayment = calculateDaysBetween(currentDate, periodEnd, 'includeStartIncludeEnd');
            const daysBeforePayment = calculateInclusiveDaysBetween(currentDate, periodEnd);

            if (daysBeforePayment > 0) {
                periods.push({
                    startDate: formatDateToYYYYMMDD(currentDate),
                    endDate: formatDateToYYYYMMDD(periodEnd),
                    days: daysBeforePayment,
                    isFullMonth: false,
                    payments: []
                });
            }

            currentDate = new Date(periodEnd);
        }

        // Добавляем сам платеж как отдельный "период"
        periods.push({
            startDate: formatDateToYYYYMMDD(paymentDate),
            endDate: formatDateToYYYYMMDD(paymentDate),
            days: 0,
            isFullMonth: false,
            payments: [payment],
            isPayment: true
        });

        // Переходим к следующему дню после платежа
        currentDate = new Date(paymentDate);
        currentDate.setDate(currentDate.getDate() + 1);
        paymentIndex++;
    }

    // Добавляем оставшийся период после всех платежей
    if (currentDate <= end) {
        const remainingDays = calculateDaysBetween(currentDate, end, overallDaysMethod);
        if (remainingDays > 0) {
            periods.push({
                startDate: formatDateToYYYYMMDD(currentDate),
                endDate: formatDateToYYYYMMDD(end),
                days: remainingDays,
                isFullMonth: isPeriodFullMonth(currentDate, end),
                payments: []
            });
        }
    }

    return periods;
}

function formatDateToYYYYMMDD(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


function generateStageFormula(stage, data) {
    if (stage.daysMethod === 'payment' || !stage.interest) {
        return '';
    }

    const rateType = data.interestRateType;
    const ratePeriod = data.ratePeriod;
    const daysInYear = isLeapYear(new Date(stage.startDate)) ? 366 : 365;

    let formula = 'Формула: ';

    if (rateType.startsWith('cbr')) {
        // Для ключевой ставки ЦБ
        const rate = getCBRKeyRateByDate(new Date(stage.startDate));
        const cbrRate = rateType === 'cbr_double' ? rate * 2 : rate;
        formula += `${stage.principal.toFixed(2)} × ${(cbrRate * 100).toFixed(2)}% × ${stage.days} / ${daysInYear}`;

    } else if (ratePeriod === 'day') {
        // Дневная ставка
        formula += `${stage.principal.toFixed(2)} × ${data.interestRateValue}% × ${stage.days}`;

    } else if (ratePeriod === 'month') {
        // Месячная ставка
        const daysInMonth = getDaysInMonth(new Date(stage.startDate));
        formula += `${stage.principal.toFixed(2)} × ${data.interestRateValue}% × ${stage.days} / ${daysInMonth}`;

    } else if (ratePeriod === 'year') {
        // Годовая ставка
        formula += `${stage.principal.toFixed(2)} × ${data.interestRateValue}% × ${stage.days} / ${daysInYear}`;

    } else {
        // По умолчанию (годовая)
        formula += `${stage.principal.toFixed(2)} × ${data.interestRateValue}% × ${stage.days} / ${daysInYear}`;
    }

    formula += ` = ${stage.interest.toFixed(2)} руб.`;
    return formula;
}

function generateCalculationSummary(data) {
    let summary = '';
    const rateType = data.interestRateType;
    const ratePeriod = data.ratePeriod;
    if (data.cbrRatesUsed && data.cbrRatesUsed.length > 0) {
        summary += 'Список ключевых ставок ЦБ РФ, применённых в период:\n';
        data.cbrRatesUsed.forEach(cbrRate => {
            summary += `  - С ${cbrRate.startDate} по ${cbrRate.endDate}: ${cbrRate.rate.toFixed(2)}%\n`;
        });
        summary += '\n';
    }
    data.calculationStages.forEach(stage => {
        let line = '';
        if (stage.payment) {
            line = `${stage.startDate} - ${stage.endDate}: ${stage.description}`;
        } else {
            const daysInYear = isLeapYear(new Date(stage.startDate)) ? 366 : 365;
            let formula = '';
            let interestDisplay = ` = ${stage.interest.toFixed(2)} руб.`;
            if (rateType.startsWith('cbr')) {
                const rate = getCBRKeyRateByDate(new Date(stage.startDate));
                const cbrRate = rateType === 'cbr_double' ? rate * 2 : rate;
                formula = `(${stage.principal.toFixed(2)} × ${cbrRate.toFixed(2)} / 100) / ${daysInYear} × ${stage.days} дней`;
            } else if (ratePeriod === 'day') {
                //formula = `${stage.principal.toFixed(2)} × (${data.interestRateValue / 100} × ${stage.days} дней)`;
                formula = `${stage.principal.toFixed(2)} × ${data.interestRateValue}% × ${stage.days} дней`;
            } else if (ratePeriod === 'year') {
                formula = `${stage.principal.toFixed(2)} руб. × ${data.interestRateValue}% / ${daysInYear} × ${stage.days} дней`;
            } else if (ratePeriod === 'month') {
                const monthlyRate = data.interestRateValue / 100;
                const daysInMonth = getDaysInMonth(new Date(stage.startDate));
                formula = `(${stage.principal.toFixed(2)} × ${monthlyRate}) / ${daysInMonth} × ${stage.days} дней`;
            }
            line = `${stage.startDate} - ${stage.endDate}: На сумму ${stage.principal.toFixed(2)} руб. (${stage.days} дней) начислены проценты: ${stage.interest.toFixed(2)} руб.`;
            line += `\n    Формула: ${formula}${interestDisplay}`;
        }
        summary += line + '\n';
    });
    return summary;
}


//function createTextView(data) {
//    return `
//<h3>Результаты расчета</h3>
//<div class="results-text">
//    <p><strong>Основная сумма задолженности:</strong> ${data.debtAmount.toFixed(2)} руб.</p>
//    <p><strong>Период расчета:</strong> ${data.startDate} - ${data.endDate} (${data.days} ${getDaysWord(data.days)})</p>
//    <p><strong>Процентная ставка:</strong> ${data.interestRate}</p>
//    <p><strong>Начисленные ${data.interestRateType.startsWith('cbr') ? 'неустойки' : 'проценты'}:</strong> ${data.interest.toFixed(2)} руб.</p>
//    <p><strong>Частичные оплаты:</strong> ${data.totalPayments.toFixed(2)} руб.</p>
//    <p><strong>Остаток основного долга:</strong> ${data.remainingDebt.toFixed(2)} руб.</p>
//    <p><strong>Общая сумма задолженности:</strong> ${data.totalDebt.toFixed(2)} руб.</p>
//    <p><strong>К оплате:</strong> <span class="total-amount">${data.amountToPay.toFixed(2)} руб.</span></p>
//</div>
//`;
//}

// Добавьте вспомогательную функцию для правильного склонения
function getDaysWord(days) {
    if (days % 10 === 1 && days % 100 !== 11) return 'день';
    if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) return 'дня';
    return 'дней';
}

function createTableView(data) {
    return `
<h3>Результаты расчета</h3>
<table class="results-table">
    <tr><th>Показатель</th><th>Сумма (руб.)</th></tr>
    <tr><td>Основная сумма задолженности</td><td>${data.debtAmount.toFixed(2)}</td></tr>
    <tr><td>Начисленные ${data.interestRateType.startsWith('cbr') ? 'неустойки' : 'проценты'}</td><td>${data.interest.toFixed(2)}</td></tr>
    <tr><td>Оплачено (всего)</td><td>${data.totalPayments.toFixed(2)}</td></tr>
    <tr><td>Остаток основного долга</td><td>${data.remainingDebt.toFixed(2)}</td></tr>
    <tr><td>Общая задолженность</td><td>${data.totalDebt.toFixed(2)}</td></tr>
    <tr class="total-row"><td><strong>К оплате</strong></td><td><strong>${data.amountToPay.toFixed(2)}</strong></td></tr>
</table>
`;
}

// ================== Функции управления формой ==================

function clearForm(elements) {
    // Очищаем основные поля
    elements.debtAmountInput.value = '';
    elements.rateValueInput.value = '';
    elements.maxRateInput.value = '';

    // Сбрасываем даты к значениям по умолчанию
    setDefaultDates(elements);

    // Очищаем частичные оплаты (оставляем только первую строку)
    const paymentItems = document.querySelectorAll('.partial-payment-item');
    paymentItems.forEach((item, index) => {
        if (index > 0) {
            item.remove();
        } else {
            item.querySelector('.payment-date').value = '';
            item.querySelector('.payment-amount').value = '';
            item.querySelector('.payment-destination').value = 'debt';

            // Восстанавливаем кнопку добавления для первой строки
            const removeBtn = item.querySelector('.remove-payment-btn');
            if (removeBtn) {
                // Меняем кнопку удаления обратно на добавление
                removeBtn.innerHTML = '<i class="fas fa-plus"></i>';
                removeBtn.classList.remove('remove-payment-btn');
                removeBtn.classList.add('add-payment-btn');
                removeBtn.addEventListener('click', function() {
                    addPartialPayment();
                });
            }
        }
    });

    // Удаляем результаты
    const resultsContainer = document.querySelector('.results-container');
    if (resultsContainer) {
        resultsContainer.remove();
    }
}

function copyResults() {
    const resultsContainer = document.querySelector('.results-container');
    if (!resultsContainer) {
        alert('Сначала выполните расчет');
        return;
    }

    const textToCopy = resultsContainer.textContent;
    navigator.clipboard.writeText(textToCopy)
        .then(() => alert('Результаты скопированы в буфер обмена'))
        .catch(err => console.error('Ошибка копирования:', err));
}

// ================== Инициализация при загрузке ==================

//function initCalculator() {
//    // Очистка при уходе со страницы
//    window.addEventListener('beforeunload', () => {
//        domObservers.forEach(observer => observer.disconnect());
//        domObservers.length = 0;
//        calculatorInitialized = false;
//    });
//
//    // Пытаемся инициализировать сразу
//    if (document.readyState === 'complete') {
//        setTimeout(initializeCalculator, 0);
//    } else {
//        document.addEventListener('DOMContentLoaded', () => {
//            setTimeout(initializeCalculator, 100);
//        });
//    }
//
//    // Резервная инициализация через 2 секунды
//    setTimeout(() => {
//        if (!calculatorInitialized) {
//            initializeCalculator();
//        }
//    }, 2000);
//}

function initCalculator() {
    // Очистка при уходе со страницы
    window.addEventListener('beforeunload', () => {
        domObservers.forEach(observer => observer.disconnect());
        domObservers.length = 0;
        calculatorInitialized = false;
        initializationAttempts = 0;
    });

    // Отслеживаем возврат на страницу
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('Страница стала видимой. Проверяем состояние калькулятора...');

            // Проверяем, есть ли элементы калькулятора, но он не инициализирован
            const calculatorContainer = document.querySelector('.calculator-container');
            if (calculatorContainer && !calculatorInitialized) {
                console.log('Переинициализируем калькулятор после возврата на страницу...');
                initializeCalculator();
            }
        }
    });

    // Пытаемся инициализировать сразу
    if (document.readyState === 'complete') {
        setTimeout(initializeCalculator, 0);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeCalculator, 100);
        });
    }

    // Резервная инициализация через 2 секунды
    setTimeout(() => {
        if (!calculatorInitialized) {
            initializeCalculator();
        }
    }, 2000);
}

// ================== Тесты ==================

function testFullMonthDetection() {
    const testCases = [
        ['2023-11-01', '2023-11-30', true],
        ['2023-12-01', '2023-12-31', true],
        ['2024-02-01', '2024-02-29', true]
    ];

    testCases.forEach(([startStr, endStr, expected]) => {
        const start = new Date(startStr);
        const end = new Date(endStr);

        const lastDayOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        const lastDayOnly = new Date(lastDayOfMonth.getFullYear(), lastDayOfMonth.getMonth(), lastDayOfMonth.getDate());

        console.log(`Testing: ${startStr} - ${endStr}`);
        console.log(`Start day: ${start.getDate()}, End: ${endDateOnly.toISOString().split('T')[0]}, Last day: ${lastDayOnly.toISOString().split('T')[0]}`);
        console.log(`Comparison: ${endDateOnly.getTime()} === ${lastDayOnly.getTime()} -> ${endDateOnly.getTime() === lastDayOnly.getTime()}`);

        const result = isPeriodFullMonth(start, end);
        console.log(`Result: ${result}, Expected: ${expected}, ${result === expected ? '✓' : '✗'}`);
        console.log('---');
    });
}

function debugDaysCalculation() {
    const periods = [
        ['2023-11-01', '2023-11-30'],
        ['2023-12-01', '2023-12-31'],
        ['2024-02-01', '2024-02-29']
    ];

    periods.forEach(([startStr, endStr]) => {
        const start = new Date(startStr);
        const end = new Date(endStr);
        const days = calculateDaysBetween(start, end, 'includeStartExcludeEnd');

        console.log(`${startStr} - ${endStr}: ${days} дней`);

        // Правильное количество дней для полного месяца
        const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        const expectedDays = lastDay.getDate(); // Должно быть 30, 31, 29 и т.д.

        console.log(`Ожидалось: ${expectedDays} дней, Разница: ${days - expectedDays}`);
    });
}

window.addEventListener('beforeunload', () => {
    // Очищаем всех наблюдателей при уходе со страницы
    console.log('Пользователь покидает страницу. Очищаем наблюдателей.');
    domObservers.forEach(observer => observer.disconnect());
    domObservers.length = 0;

    // Сбрасываем флаги инициализации
    calculatorInitialized = false;
    isCalculatorPage = false;
    initializationAttempts = 0;
});

// Запуск инициализации
initCalculator();