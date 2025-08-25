// Глобальные переменные состояния
let calculatorInitialized = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;
const domObservers = [];
const rateCache = new Map();

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

function setupDOMObservers() {
    // Очищаем старых наблюдателей
    domObservers.forEach(observer => observer.disconnect());
    domObservers.length = 0;

    // Наблюдатель за изменениями в DOM
    const mainObserver = new MutationObserver((mutations) => {
        // Проверяем, не удалились ли важные элементы
        const calculatorContainer = document.querySelector('.calculator-container');
        if (!calculatorContainer) {
            console.log('Calculator container removed, reinitializing...');
            calculatorInitialized = false;
            initializeCalculator();
            return;
        }

        // Проверяем, не добавились ли новые элементы, которые нам нужны
        const missingElements = findCalculatorElements();
        if (!missingElements && !calculatorInitialized) {
            initializeCalculator();
        }
    });

    mainObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    domObservers.push(mainObserver);
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

    // Валидация
    if (!validateCalculationInputs(debtAmount, startDate, endDate, rateValue)) {
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

function validateCalculationInputs(debtAmount, startDate, endDate, rateValue) {
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

    if (rateValue <= 0 || isNaN(rateValue)) {
        console.log('❌ Ошибка: rateValue <= 0 или не число');
        alert('Процентная ставка должна быть положительным числом');
        return false;
    }

    console.log('✅ Валидация пройдена успешно');
    return true;
}

function performCalculation(debtAmount, startDate, endDate, rateType, rateValue, ratePeriod, maxRate) {
    console.log('=== НАЧАЛО РАСЧЕТА (UTC даты) ===');

    // Получаем выбранный метод расчета дней
    const overallDaysMethod = getDaysCalculationMethod();
    console.log('Выбранный метод расчета дней:', overallDaysMethod);

    // Создаем UTC даты для расчета
    const startUTC = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
    const endUTC = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));

    const payments = getPartialPayments();
    payments.sort((a, b) => {
        const dateA = parseDateWithoutTimezone(a.date);
        const dateB = parseDateWithoutTimezone(b.date);
        return dateA - dateB;
    });

    let currentDebt = debtAmount;
    let totalInterest = 0;

    // Используем UTC даты для расчета
    let currentDate = new Date(startUTC);
    const endDateOnly = new Date(endUTC);

    const calculationStages = [];

    // Для ВСЕГО периода используем выбранный пользователем метод
    const totalDays = calculateDaysBetween(currentDate, endDateOnly, overallDaysMethod);

    console.log('=== ДЕТАЛИ РАСЧЕТА ===');
    console.log('Выбранный метод расчета дней:', overallDaysMethod);
    console.log('Общее количество дней:', totalDays);

    // Обрабатываем каждый платеж
    for (const payment of payments) {
        const paymentDate = parseDateWithoutTimezone(payment.date);
        const paymentDateUTC = new Date(Date.UTC(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate()));

        if (paymentDateUTC > endDateOnly) break;
        if (paymentDateUTC < currentDate) continue;

        // Расчет процентов за период ДО платежа
        const daysUntilPayment = calculateDaysBetween(currentDate, paymentDateUTC, overallDaysMethod);
        console.log('Дней до платежа:', daysUntilPayment);

        if (daysUntilPayment > 0) {
            let periodInterest;

            if (rateType === 'cbr_double') {
                periodInterest = currentDebt * calculateCBRDoubleRate(currentDate, paymentDateUTC, overallDaysMethod);
            }
            else if (rateType === 'cbr_single') {
                periodInterest = currentDebt * calculateCBRSingleRate(currentDate, paymentDateUTC, overallDaysMethod);
            }
            else if (ratePeriod === 'month') {
                // ИСПРАВЛЕНИЕ: Правильный расчет для месячной ставки
                periodInterest = calculateMonthlyInterest(
                    currentDebt,
                    rateValue,
                    currentDate,
                    paymentDateUTC, // Теперь переменная определена
                    overallDaysMethod
                );
            }
            else {
                 if (ratePeriod === 'day') {
                        periodInterest = (currentDebt * rateValue * daysUntilPayment) / 100;
                    } else if (ratePeriod === 'year') {
                        // ИСПРАВЛЕНИЕ: Правильный расчет для годовой ставки
                        periodInterest = calculateYearlyInterest(
                            currentDebt,
                            rateValue,
                            currentDate,
                            paymentDateUTC,
                            overallDaysMethod
                        );
                    } else {
                        const daysInYear = isLeapYear(currentDate) ? 366 : 365;
                        periodInterest = (currentDebt * rateValue * daysUntilPayment) / (100 * daysInYear);
                    }
                }

            totalInterest += periodInterest;

            calculationStages.push({
                startDate: currentDate.toISOString().split('T')[0],
                endDate: paymentDateUTC.toISOString().split('T')[0],
                days: daysUntilPayment,
                principal: currentDebt,
                interest: periodInterest,
                dailyRate: daysUntilPayment > 0 ? periodInterest / (currentDebt * daysUntilPayment) : 0,
                payment: null,
                daysMethod: overallDaysMethod,
                description: `Проценты на сумму ${currentDebt.toFixed(2)} руб. за ${daysUntilPayment} дней`
            });
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
            totalInterest = Math.max(0, totalInterest - payment.amount);

            calculationStages.push({
                startDate: paymentDateUTC.toISOString().split('T')[0],
                endDate: paymentDateUTC.toISOString().split('T')[0],
                days: 0,
                principal: currentDebt,
                interest: 0,
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
        }

        // Переходим к следующему дню после платежа
        currentDate = new Date(paymentDateUTC);
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Расчет за оставшийся период
    if (currentDate <= endDateOnly) {
        const remainingDays = calculateDaysBetween(currentDate, endDateOnly, overallDaysMethod);
        console.log('Оставшихся дней:', remainingDays);

        if (remainingDays > 0) {
            let remainingInterest;

            if (rateType === 'cbr_double') {
                remainingInterest = currentDebt * calculateCBRDoubleRate(currentDate, endDateOnly, overallDaysMethod);
            }
            else if (rateType === 'cbr_single') {
                remainingInterest = currentDebt * calculateCBRSingleRate(currentDate, endDateOnly, overallDaysMethod);
            }
            else if (ratePeriod === 'month') {
                // ИСПРАВЛЕНИЕ: Правильный расчет для месячной ставки
                remainingInterest = calculateMonthlyInterest(
                    currentDebt,
                    rateValue,
                    currentDate,
                    endDateOnly, // Используем endDateOnly вместо paymentDateUTC
                    overallDaysMethod
                );
            }
            else {
                if (ratePeriod === 'day') {
                    remainingInterest = (currentDebt * rateValue * remainingDays) / 100;
                } else {
                    const daysInYear = isLeapYear(currentDate) ? 366 : 365;
                    remainingInterest = (currentDebt * rateValue * remainingDays) / (100 * daysInYear);
                }
            }

            totalInterest += remainingInterest;

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
        }
    }

    // Применяем ограничение максимальной ставки
    let appliedMaxRate = null;
    if (maxRate && !isNaN(maxRate) && maxRate !== Infinity) {
        const maxInterest = debtAmount * (maxRate / 100);
        if (totalInterest > maxInterest) {
            totalInterest = maxInterest;
            appliedMaxRate = maxRate;

            const scaleFactor = maxInterest / totalInterest;
            calculationStages.forEach(stage => {
                if (stage.interest > 0) {
                    stage.interest = stage.interest * scaleFactor;
                }
            });
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
        case 'fixed':
            rateDescription = `${rateValue}% (договорная)`;
            break;
        default:
            rateDescription = `${rateValue}%`;
    }

    const amountToPay = Math.max(0, currentDebt + totalInterest - penaltyPayments);

    console.log('=== КОНЕЦ РАСЧЕТА ===');
    console.log('Итоговая сумма к оплате:', amountToPay.toFixed(2));

    return {
        debtAmount,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: totalDays,
        interestRate: rateDescription,
        interestRateType: rateType,
        interestRateValue: rateType.startsWith('cbr') ? getCBRKeyRateByDate(startDate) * 100 : rateValue,
        dailyRate: calculateDailyRate(rateType, rateValue, ratePeriod, startDate, endDate, overallDaysMethod) * 100,
        interest: totalInterest,
        totalPayments,
        debtPayments,
        penaltyPayments,
        remainingDebt: currentDebt,
        totalDebt: currentDebt + totalInterest,
        amountToPay: amountToPay,
        maxRate: appliedMaxRate,
        calculationStages,
        daysMethod: overallDaysMethod
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

function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

//Функция для расчёта процентов, исходя из годовой ставки
function calculateYearlyInterest(principal, rateValue, startDate, endDate, daysMethod) {
    const yearlyRate = rateValue / 100;
    let totalInterest = 0;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate < end) {
        // Конец текущего года (31 декабря)
        const yearEnd = new Date(currentDate.getFullYear(), 11, 31); // 31 декабря

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

//Функция для определения окончания годового периода
function getYearEndDate(date) {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + 1);

    // Корректировка: возвращаем дату на 1 год позже, но тот же день и месяц
    // Например: 01.11.2023 → 01.11.2024
    // Но если такая дата не существует (29 февраля), используем последний день февраля
    const originalMonth = date.getMonth();
    const originalDate = date.getDate();

    if (result.getMonth() !== originalMonth || result.getDate() !== originalDate) {
        // Для 29 февраля в невисокосном году используем 28 февраля
        result.setMonth(originalMonth);
        result.setDate(0); // Последний день предыдущего месяца
    }

    return result;
}

// ================== ФУНКЦИИ РАСЧЕТА КЛЮЧЕВОЙ СТАВКИ ЦБ ==================

// 1. Функция, содержащая в себе размеры ключевых ставок ЦБ РФ в определённые периоды времени


function getCBRKeyRateByDate(date) {
    const targetDate = new Date(date);
    const dateKey = targetDate.toISOString().split('T')[0];

    // Проверяем кэш
    if (rateCache.has(dateKey)) {
        return rateCache.get(dateKey);
    }

    // Исторические данные ключевой ставки ЦБ РФ
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

    // Ищем подходящий период
    const period = rateHistory.find(p => targetDate >= p.start && targetDate <= p.end);

    let rate;
    if (period) {
        rate = period.rate / 100; // Конвертируем в десятичную дробь
    } else {
        // Если дата раньше всех известных периодов
        console.warn(`Ключевая ставка не найдена для даты ${targetDate.toLocaleDateString()}`);
        rate = 0.105; // Значение по умолчанию (10.5% - первая известная ставка)
    }

    // Сохраняем в кэш
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

// 2. Функция расчёта с ключевой ставкой ЦБ РФ с умножением на 2 (ст. 395 ГК РФ)
function calculateCBRDoubleRate(startDate, endDate, daysMethod = 'includeStartExcludeEnd') {
    const days = calculatePeriodDays(startDate, endDate);
    const cbrRate = getCBRKeyRateByDate(startDate);
    const daysInYear = isLeapYear(startDate) ? 366 : 365;
    return (cbrRate * 2 * days) / daysInYear;
}

// 3. Функция расчёта с ключевой ставкой ЦБ РФ без умножения на 2
function calculateCBRSingleRate(startDate, endDate, daysMethod = 'includeStartExcludeEnd') {
    const days = calculatePeriodDays(startDate, endDate);
    const cbrRate = getCBRKeyRateByDate(startDate);
    const daysInYear = isLeapYear(startDate) ? 366 : 365;
    return (cbrRate * days) / daysInYear;
}

// 4. Функция расчёта договорной ставки
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

// 4. Основная функция расчета дневной ставки
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


function createFormulaExplanation(data) {
    // Определяем количество дней в году для годовых ставок
    const daysInYear = isLeapYear(new Date(data.startDate)) ? 366 : 365;

    // Форматируем отображение процентной ставки
    let rateDisplay = data.interestRateValue.toFixed(2) + '%';
    if (data.interestRateType.startsWith('cbr')) {
        rateDisplay = data.interestRateValue.toFixed(2) + '%';
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
    let totalCalculatedInterest = 0; // Для подсчета итоговой суммы процентов

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
            // МЕСЯЧНАЯ СТАВКА - исправленная формула
            const fullMonths = calculateFullMonthsBetween(new Date(data.startDate), new Date(data.endDate));
            const remainingDays = calculateRemainingDaysAfterMonths(new Date(data.startDate), new Date(data.endDate), fullMonths);

            // Расчет процентов за полные месяцы
            const interestForFullMonths = data.debtAmount * (data.interestRateValue / 100) * fullMonths;

            // Расчет процентов за неполный месяц
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
                    formulaDetails += `Год ${yearCount}: ${currentDate.toISOString().split('T')[0]} - ${periodEnd.toISOString().split('T')[0]} (полный год) = ${periodInterest.toFixed(2)} руб.<br>`;
                } else {
                    periodInterest = data.debtAmount * (data.interestRateValue / 100) * (daysInPeriod / daysInCurrentYear);
                    formulaDetails += `Год ${yearCount}: ${currentDate.toISOString().split('T')[0]} - ${periodEnd.toISOString().split('T')[0]} (${daysInPeriod} дней из ${daysInCurrentYear}) = ${periodInterest.toFixed(2)} руб.<br>`;
                }

                totalCalculatedInterest += periodInterest;
                currentDate = new Date(periodEnd);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            formulaHtml = `
Сумма процентов = Σ(Сумма долга × Ставка × (Период / Год))<br>
<strong>Детали по годам:</strong><br>
${formulaDetails}
<strong>Итого:</strong> ${totalCalculatedInterest.toFixed(2)} руб.
            `;
        } else if (data.ratePeriod === 'day') {
            // ДНЕВНАЯ СТАВКА
            totalCalculatedInterest = (data.debtAmount * data.interestRateValue * data.days) / 100;

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

    let explanation = `
    <div class="formula-explanation">
        <strong>Методика расчета:</strong><br>
        <strong>Тип ставки:</strong> ${data.interestRateType.startsWith('cbr') ? 'Ключевая ставка ЦБ РФ' : 'Договорная ставка'}${data.ratePeriod === 'month' ? ' (месячная)' : data.ratePeriod === 'day' ? ' (дневная)' : data.ratePeriod === 'year' ? ' (годовая)' : ''}<br>
        <strong>Учет дней для начального/конечного периода:</strong> ${daysMethodDescription}<br>
        <strong>Учет дней для промежуточных периодов:</strong> всегда включая начальный день, исключая конечный<br>
        <strong>Важно:</strong> Проценты начисляются по конец дня, платежи применяются на начало следующего дня<br>
        Формула расчёта ${rateTypeDescription}:<br>
        <div class="math-formula">
            ${formulaHtml}
        </div>
    `;

    // Добавляем детальную информацию о этапах расчета
    if (data.calculationStages && data.calculationStages.length > 0) {
        explanation += `<br><strong>Детализация расчета по периодам:</strong>`;
        explanation += `
<table class="calculation-details">
    <tr>
        <th>Период</th>
        <th>Дней</th>
        <th>Тип периода</th>
        <th>Сумма долга</th>
        <th>Начислено</th>
    </tr>
`;

        let tableTotalInterest = 0;
        let tableTotalDebt = 0;

        // Для годовой ставки показываем разбивку по годам
        if (data.ratePeriod === 'year') {
            let currentDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            let periodCount = 0;

            while (currentDate < endDate) {
                const nextYearDate = getYearEndDate(currentDate);
                const periodEnd = nextYearDate > endDate ? new Date(endDate) : nextYearDate;
                const daysInPeriod = calculateDaysBetween(currentDate, periodEnd, data.daysMethod);
                const daysInCurrentYear = isLeapYear(currentDate) ? 366 : 365;

                periodCount++;

                let periodType = 'Неполный год';
                let periodInterest;

                if (periodEnd.getTime() === nextYearDate.getTime()) {
                    periodType = 'Полный год';
                    periodInterest = data.debtAmount * (data.interestRateValue / 100);
                } else {
                    periodInterest = data.debtAmount * (data.interestRateValue / 100) * (daysInPeriod / daysInCurrentYear);
                }

                tableTotalInterest += periodInterest;
                tableTotalDebt += data.debtAmount;

                explanation += `
    <tr>
        <td>${currentDate.toISOString().split('T')[0]} - ${periodEnd.toISOString().split('T')[0]}</td>
        <td>${daysInPeriod}</td>
        <td>${periodType}</td>
        <td>${data.debtAmount.toFixed(2)} руб.</td>
        <td>${periodInterest.toFixed(2)} руб.</td>
    </tr>
`;

                currentDate = new Date(periodEnd);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        } else {
            // Для других типов ставок используем старую логику
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
                    explanation += `
    <tr class="payment-row">
        <td>${stage.startDate}</td>
        <td>${stage.days}</td>
        <td>${methodDesc}</td>
        <td>${stage.principal.toFixed(2)} руб.</td>
        <td>-${stage.payment.amount.toFixed(2)} руб.</td>
    </tr>
`;
                } else {
                    tableTotalInterest += stage.interest;
                    tableTotalDebt += stage.principal;

                    explanation += `
    <tr>
        <td>${stage.startDate} - ${stage.endDate}</td>
        <td>${stage.days}</td>
        <td>${methodDesc}</td>
        <td>${stage.principal.toFixed(2)} руб.</td>
        <td>${stage.interest.toFixed(2)} руб.</td>
    </tr>
`;
                }
            });
        }

        // ДОБАВЛЯЕМ ИТОГОВУЮ СТРОКУ ДЛЯ ВСЕХ ТИПОВ РАСЧЕТОВ
        explanation += `
    <tr class="total-row">
        <td colspan="3"><strong>Итого</strong></td>
        <td><strong>${data.debtAmount.toFixed(2)} руб.</strong></td>
        <td><strong>${tableTotalInterest.toFixed(2)} руб.</strong></td>
    </tr>
`;

        explanation += `</table>`;
    }

    // Добавляем информацию о применении ограничения
    if (data.maxRate) {
        explanation += `<br><strong>Применено ограничение:</strong> неустойка не может превышать ${data.maxRate}% от суммы долга (${(data.debtAmount * data.maxRate / 100).toFixed(2)} руб.)<br>`;
    }

    // Итоговая сумма задолженности
    explanation += `
<br><br>
<strong>Итоговая сумма задолженности:</strong><br>
Основной долг: ${data.debtAmount.toFixed(2)} руб.<br>
Начисленные ${data.interestRateType.startsWith('cbr') ? 'неустойки' : 'проценты'}: ${data.interest.toFixed(2)} руб.<br>
Оплачено: ${data.totalPayments.toFixed(2)} руб.<br>
<strong>Общая сумма к оплате: ${data.amountToPay.toFixed(2)} руб.</strong>
`;

    explanation += `</div>`;
    return explanation;
}

//function createFormulaExplanation(data) {
//    // Определяем количество дней в году для годовых ставок
//    const daysInYear = isLeapYear(new Date(data.startDate)) ? 366 : 365;
//
//    // Форматируем отображение процентной ставки
//    let rateDisplay = data.interestRateValue.toFixed(2) + '%';
//    if (data.interestRateType.startsWith('cbr')) {
//        rateDisplay = data.interestRateValue.toFixed(2) + '%';
//    }
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
//            formulaHtml = `
//                Сумма процентов = <br>
//                Проценты за полные месяцы + Проценты за неполный месяц<br>
//                = ${data.debtAmount.toFixed(2)} × ${data.interestRateValue}% × ${fullMonths}<br>
//                + ${data.debtAmount.toFixed(2)} × ${data.interestRateValue}% × (${remainingDays} / дней в месяце)<br>
//                = ${data.interest.toFixed(2)} руб.
//            `;
//        } else if (data.ratePeriod === 'year') {
//            // ГОДОВАЯ СТАВКА - детализированный расчет по годам
//            let currentDate = new Date(data.startDate);
//            const endDate = new Date(data.endDate);
//            let formulaDetails = '';
//            let yearCount = 0;
//            let totalCalculatedInterest = 0;
//
//            while (currentDate < endDate) {
//                const nextYearDate = getYearEndDate(currentDate);
//                const periodEnd = nextYearDate > endDate ? new Date(endDate) : nextYearDate;
//                const daysInPeriod = calculateDaysBetween(currentDate, periodEnd, data.daysMethod);
//                const daysInCurrentYear = isLeapYear(currentDate) ? 366 : 365;
//
//                yearCount++;
//
//                let periodInterest;
//                if (periodEnd.getTime() === nextYearDate.getTime()) {
//                    periodInterest = data.debtAmount * (data.interestRateValue / 100);
//                    formulaDetails += `Год ${yearCount}: ${currentDate.toISOString().split('T')[0]} - ${periodEnd.toISOString().split('T')[0]} (полный год) = ${periodInterest.toFixed(2)} руб.<br>`;
//                } else {
//                    periodInterest = data.debtAmount * (data.interestRateValue / 100) * (daysInPeriod / daysInCurrentYear);
//                    formulaDetails += `Год ${yearCount}: ${currentDate.toISOString().split('T')[0]} - ${periodEnd.toISOString().split('T')[0]} (${daysInPeriod} дней из ${daysInCurrentYear}) = ${periodInterest.toFixed(2)} руб.<br>`;
//                }
//
//                totalCalculatedInterest += periodInterest;
//                currentDate = new Date(periodEnd);
//                currentDate.setDate(currentDate.getDate() + 1);
//            }
//
//            formulaHtml = `
//Сумма процентов = Σ(Сумма долга × Ставка × (Период / Год))<br>
//<strong>Детали по годам:</strong><br>
//${formulaDetails}
//<strong>Итого:</strong> ${totalCalculatedInterest.toFixed(2)} руб.
//            `;
//        } else if (data.ratePeriod === 'day') {
//            // ДНЕВНАЯ СТАВКА
//            formulaHtml = `
//                Сумма процентов = <br>
//                Сумма долга × Дневная ставка × Количество дней<br>
//                = ${data.debtAmount.toFixed(2)} × ${data.interestRateValue}% × ${data.days}<br>
//                = ${data.interest.toFixed(2)} руб.
//            `;
//        } else {
//            // ГОДОВАЯ СТАВКА (старый вариант)
//            formulaHtml = `
//                Сумма процентов = <br>
//                Сумма долга × ${rateDisplay} × Количество дней<br>
//                ─────────────────────────────────────────────────────────────────<br>
//                                      100 × ${daysInYear}
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
//                    explanation += `
//    <tr class="payment-row">
//        <td>${stage.startDate}</td>
//        <td>${stage.days}</td>
//        <td>${methodDesc}</td>
//        <td>${stage.principal.toFixed(2)} руб.</td>
//        <td>-${stage.payment.amount.toFixed(2)} руб.</td>
//    </tr>
//`;
//                } else {
//                    explanation += `
//    <tr>
//        <td>${stage.startDate} - ${stage.endDate}</td>
//        <td>${stage.days}</td>
//        <td>${methodDesc}</td>
//        <td>${stage.principal.toFixed(2)} руб.</td>
//        <td>${stage.interest.toFixed(2)} руб.</td>
//    </tr>
//`;
//                }
//            });
//        }
//
//        explanation += `</table>`;
//    }
//
//    // Добавляем информацию о применении ограничения
//    if (data.maxRate) {
//        explanation += `<br><strong>Применено ограничение:</strong> неустойка не может превышать ${data.maxRate}% от суммы долга (${(data.debtAmount * data.maxRate / 100).toFixed(2)} руб.)<br>`;
//    }
//
//    // Итоговая сумма задолженности
//    explanation += `
//<br><br>
//<strong>Итоговая сумма задолженности:</strong><br>
//Основной долг: ${data.debtAmount.toFixed(2)} руб.<br>
//Начисленные ${data.interestRateType.startsWith('cbr') ? 'неустойки' : 'проценты'}: ${data.interest.toFixed(2)} руб.<br>
//Оплачено: ${data.totalPayments.toFixed(2)} руб.<br>
//<strong>Общая сумма к оплате: ${data.amountToPay.toFixed(2)} руб.</strong>
//`;
//
//    explanation += `</div>`;
//    return explanation;
//}

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
        case 'includeBothDays': return 'включая начальный и конечный день';
        case 'excludeBothDays': return 'исключая начальный и конечный день';
        case 'includeStartExcludeEnd':
        default: return 'включая начальный день, исключая конечный';
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

//function showResults(data) {
//    let resultsContainer = document.querySelector('.results-container');
//
//    if (!resultsContainer) {
//        resultsContainer = document.createElement('div');
//        resultsContainer.className = 'results-container';
//        document.querySelector('.calculator-container').appendChild(resultsContainer);
//    }
//
//    const formulaHtml = createFormulaExplanation(data);
//
//    resultsContainer.innerHTML = `
//        <div class="calculation-header">
//            <h3>Расчёт задолженности</h3>
//            ${formulaHtml}
//        </div>
//        ${document.getElementById('text-view').checked ? createTextView(data) : createTableView(data)}
//    `;
//    // Добавляем расчет дневной ставки для отображения
//        const dailyRateDisplay = getDailyRateDisplay(
//            data.interestRateType,
//            data.interestRateValue,
//            data.ratePeriod,
//            new Date(data.startDate),
//            new Date(data.endDate),
//            data.daysMethod
//        );
//
//        // Передаем данные в создание представления
//        if (document.getElementById('text-view').checked) {
//            resultsContainer.innerHTML += createTextView(data, dailyRateDisplay);
//        } else {
//            resultsContainer.innerHTML += createTableView(data);
//        }
//}

function showResults(data) {
    let resultsContainer = document.querySelector('.results-container');

    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container';
        document.querySelector('.calculator-container').appendChild(resultsContainer);
    }

    const formulaHtml = createFormulaExplanation(data);

    // УБИРАЕМ дублирующее добавление результатов в конце функции
    resultsContainer.innerHTML = `
        <div class="calculation-header">
            <h3>Расчёт задолженности</h3>
            ${formulaHtml}
        </div>
        ${document.getElementById('text-view').checked ? createTextView(data) : createTableView(data)}
    `;
}

//function createTextView(data) {
//    return `
//<h3>Результаты расчета</h3>
//<div class="results-text">
//    <p><strong>Основная сумма задолженности:</strong> ${data.debtAmount.toFixed(2)} руб.</p>
//    <p><strong>Период расчета:</strong> ${data.startDate} - ${data.endDate} (${data.days} дней)</p>
//    <p><strong>Процентная ставка:</strong> ${data.interestRate} (${data.dailyRate.toFixed(4)}% в день)</p>
//    <p><strong>Начисленные ${data.interestRateType.startsWith('cbr') ? 'неустойки' : 'проценты'}:</strong> ${data.interest.toFixed(2)} руб.</p>
//    <p><strong>Частичные оплаты:</strong> ${data.totalPayments.toFixed(2)} руб.</p>
//    <p><strong>Остаток основного долга:</strong> ${data.remainingDebt.toFixed(2)} руб.</p>
//    <p><strong>Общая сумма задолженности:</strong> ${data.totalDebt.toFixed(2)} руб.</p>
//    <p><strong>К оплате:</strong> <span class="total-amount">${data.amountToPay.toFixed(2)} руб.</span></p>
//</div>
//`;
//}

function createTextView(data) {
    return `
<h3>Результаты расчета</h3>
<div class="results-text">
    <p><strong>Основная сумма задолженности:</strong> ${data.debtAmount.toFixed(2)} руб.</p>
    <p><strong>Период расчета:</strong> ${data.startDate} - ${data.endDate} (${data.days} ${getDaysWord(data.days)})</p>
    <p><strong>Процентная ставка:</strong> ${data.interestRate}</p>
    <p><strong>Начисленные ${data.interestRateType.startsWith('cbr') ? 'неустойки' : 'проценты'}:</strong> ${data.interest.toFixed(2)} руб.</p>
    <p><strong>Частичные оплаты:</strong> ${data.totalPayments.toFixed(2)} руб.</p>
    <p><strong>Остаток основного долга:</strong> ${data.remainingDebt.toFixed(2)} руб.</p>
    <p><strong>Общая сумма задолженности:</strong> ${data.totalDebt.toFixed(2)} руб.</p>
    <p><strong>К оплате:</strong> <span class="total-amount">${data.amountToPay.toFixed(2)} руб.</span></p>
</div>
`;
}

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

function initCalculator() {
    // Очистка при уходе со страницы
    window.addEventListener('beforeunload', () => {
        domObservers.forEach(observer => observer.disconnect());
        domObservers.length = 0;
        calculatorInitialized = false;
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
// Запуск инициализации
initCalculator();