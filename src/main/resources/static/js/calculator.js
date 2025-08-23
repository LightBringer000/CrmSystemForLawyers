// Глобальные переменные состояния
let calculatorInitialized = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;
const domObservers = [];

// Константы для расчета
const DAYS_IN_YEAR = 365;
const DAYS_IN_MONTH = 30; // Упрощенное значение

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
    for (const [key, element] of Object.entries(elements)) {
        if (!element && key !== 'partialPaymentGroup') {
            console.warn(`Element not found: ${key}`);
            return null;
        }
    }

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

function setDefaultDates(elements) {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    if (elements.startPeriodInput && !elements.startPeriodInput.value) {
        elements.startPeriodInput.value = oneMonthAgo.toISOString().split('T')[0];
    }

    if (elements.endPeriodInput && !elements.endPeriodInput.value) {
        elements.endPeriodInput.value = today.toISOString().split('T')[0];
    }
}

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
        });
    });
}

// ================== Функции расчета ==================

function calculateDebt(elements) {
    // Получение значений из формы
    const debtAmount = parseFloat(elements.debtAmountInput.value) || 0;
    const startDate = new Date(elements.startPeriodInput.value);
    const endDate = new Date(elements.endPeriodInput.value);
    const rateType = elements.rateTypeSelect.value;
    const rateValue = parseFloat(elements.rateValueInput.value) || 0;
    const ratePeriod = elements.ratePeriodSelect.value;
    const maxRate = parseFloat(elements.maxRateInput.value) || Infinity;

    // Валидация
    if (!validateCalculationInputs(debtAmount, startDate, endDate, rateValue)) {
        return;
    }

    // Расчет
    const calculationData = performCalculation(
        debtAmount, startDate, endDate, rateType,
        rateValue, ratePeriod, maxRate
    );

    // Отображение результатов
    showResults(calculationData);
}

function validateCalculationInputs(debtAmount, startDate, endDate, rateValue) {
    if (debtAmount <= 0) {
        alert('Основная сумма задолженности должна быть больше 0');
        return false;
    }

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        alert('Пожалуйста, выберите корректные даты периода расчета');
        return false;
    }

    if (startDate > endDate) {
        alert('Дата начала периода не может быть позже даты окончания');
        return false;
    }

    if (rateValue <= 0) {
        alert('Процентная ставка должна быть больше 0');
        return false;
    }

    return true;
}

function performCalculation(debtAmount, startDate, endDate, rateType, rateValue, ratePeriod, maxRate) {
    const payments = getPartialPayments();
    payments.sort((a, b) => new Date(a.date) - new Date(b.date));

    let currentDebt = debtAmount;
    let totalInterest = 0;
    let currentDate = new Date(startDate);
    const calculationStages = [];

    // Обрабатываем каждый платеж и период
    for (const payment of payments) {
        const paymentDate = new Date(payment.date);

        if (paymentDate > endDate) break;
        if (paymentDate < currentDate) continue;

        // Рассчитываем проценты за период до платежа
        const daysUntilPayment = Math.ceil((paymentDate - currentDate) / (1000 * 60 * 60 * 24));
        if (daysUntilPayment > 0) {
            const daysInYear = isLeapYear(currentDate) ? 366 : 365;
            let periodInterest;

            if (rateType === 'cbr_double') {
                const cbrRate = 0.075;
                periodInterest = (currentDebt * cbrRate * 2 * daysUntilPayment) / (100 * daysInYear);
            }
            else if (rateType === 'cbr_single') {
                const cbrRate = 0.075;
                periodInterest = (currentDebt * cbrRate * daysUntilPayment) / (100 * daysInYear);
            }
            else {
                // Для договорной ставки используем calculateDailyRate
                const dailyRate = calculateDailyRate(rateType, rateValue, ratePeriod, currentDate);
                periodInterest = currentDebt * dailyRate * daysUntilPayment;
            }

            totalInterest += periodInterest;

            calculationStages.push({
                startDate: currentDate.toISOString().split('T')[0],
                endDate: paymentDate.toISOString().split('T')[0],
                days: daysUntilPayment,
                principal: currentDebt,
                interest: periodInterest,
                dailyRate: periodInterest / (currentDebt * daysUntilPayment),
                payment: null
            });
        }

        // Применяем платеж
        if (payment.destination === 'debt') {
            currentDebt = Math.max(0, currentDebt - payment.amount);
        }

        if (calculationStages.length > 0) {
            calculationStages[calculationStages.length - 1].payment = {
                date: payment.date,
                amount: payment.amount,
                destination: payment.destination
            };
        }

        currentDate = paymentDate;
    }

    // Рассчитываем проценты за оставшийся период
    if (currentDate < endDate) {
        const remainingDays = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
        if (remainingDays > 0) {
            const daysInYear = isLeapYear(currentDate) ? 366 : 365;
            let remainingInterest;

            if (rateType === 'cbr_double') {
                const cbrRate = 0.075;
                remainingInterest = (currentDebt * cbrRate * 2 * remainingDays) / (100 * daysInYear);
            }
            else if (rateType === 'cbr_single') {
                const cbrRate = 0.075;
                remainingInterest = (currentDebt * cbrRate * remainingDays) / (100 * daysInYear);
            }
            else {
                if (ratePeriod === 'day') {
                    remainingInterest = (currentDebt * rateValue * remainingDays) / 100;
                } else {
                    remainingInterest = (currentDebt * rateValue * remainingDays) / (100 * daysInYear);
                }
            }

            totalInterest += remainingInterest;

            calculationStages.push({
                startDate: currentDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                days: remainingDays,
                principal: currentDebt,
                interest: remainingInterest,
                dailyRate: remainingInterest / (currentDebt * remainingDays),
                payment: null
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
                stage.interest = stage.interest * scaleFactor;
            });
        }
    }

    // Получаем информацию о платежах
    const totalPayments = getTotalPayments();
    const debtPayments = getDebtPayments();
    const penaltyPayments = getPenaltyPayments(); // Новая функция

    // Формируем текстовое описание типа ставки
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

    // ИСПРАВЛЕННЫЙ РАСЧЕТ
    const amountToPay = Math.max(0, currentDebt + totalInterest - penaltyPayments);

    return {
        debtAmount,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
        interestRate: rateDescription,
        interestRateType: rateType,
        interestRateValue: rateType.startsWith('cbr') ? 7.5 : rateValue,
        dailyRate: calculateDailyRate(rateType, rateValue, ratePeriod, startDate) * 100,
        interest: totalInterest, // Теперь здесь правильная сумма процентов
        totalPayments,
        debtPayments,
        penaltyPayments, // Добавляем отдельное поле для платежей в счет неустойки
        remainingDebt: currentDebt,
        totalDebt: currentDebt + totalInterest,
        amountToPay: amountToPay,
        maxRate: appliedMaxRate,
        calculationStages
    };
}

function getPenaltyPayments() {
    let penaltyPayments = 0;
    const paymentItems = document.querySelectorAll('.partial-payment-item');

    paymentItems.forEach(item => {
        const amount = parseFloat(item.querySelector('.payment-amount').value) || 0;
        const destination = item.querySelector('.payment-destination').value;

        if (destination === 'penalty') {
            penaltyPayments += amount;
        }
    });

    return penaltyPayments;
}


// ================== ФУНКЦИИ РАСЧЕТА КЛЮЧЕВОЙ СТАВКИ ЦБ ==================

// 1. Ключевая ставка ЦБ РФ с умножением на 2 (ст. 395 ГК РФ)
function calculateCBRDoubleRate(startDate) {
    const daysInYear = isLeapYear(startDate) ? 366 : 365;
    const cbrRate = 0.075; // 7.5% - должна получаться из API ЦБ
    return (cbrRate * 2) / daysInYear;
}

// 2. Ключевая ставка ЦБ РФ без умножения на 2
function calculateCBRSingleRate(startDate) {
    const daysInYear = isLeapYear(startDate) ? 366 : 365;
    const cbrRate = 0.075; // 7.5% - должна получаться из API ЦБ
    return cbrRate / daysInYear;
}

// 3. Договорная ставка
function calculateContractualRate(rateValue, ratePeriod, startDate) {
    const daysInYear = isLeapYear(startDate) ? 366 : 365;

    switch (ratePeriod) {
        case 'day':
            return rateValue / 100; // 1% в день = 0.01
        case 'month':
            return rateValue / (100 * DAYS_IN_MONTH);
        case 'year':
            return rateValue / (100 * daysInYear);
        default:
            return rateValue / (100 * daysInYear);
    }
}

// 4. Основная функция расчета дневной ставки
function calculateDailyRate(rateType, rateValue, ratePeriod, startDate) {
    switch (rateType) {
        case 'cbr_double':
            return calculateCBRDoubleRate(startDate);
        case 'cbr_single':
            return calculateCBRSingleRate(startDate);
        case 'fixed':
            return calculateContractualRate(rateValue, ratePeriod, startDate);
        default:
            return calculateContractualRate(rateValue, ratePeriod, startDate);
    }
}

function isLeapYear(date) {
    const year = date.getFullYear();
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
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
    // Определяем количество дней в году для формулы
    const daysInYear = isLeapYear(new Date(data.startDate)) ? 366 : 365;

    let rateDisplay, rateValue;

    // Определяем отображаемое значение ставки
    if (data.interestRateType === 'cbr_double') {
        rateDisplay = 'Ключевая ставка ЦБ РФ × 2';
        rateValue = data.interestRateValue;
    } else if (data.interestRateType === 'cbr_single') {
        rateDisplay = 'Ключевая ставка ЦБ РФ';
        rateValue = data.interestRateValue;
    } else {
        rateDisplay = `${data.interestRateValue}% (договорная)`;
        rateValue = data.interestRateValue;
    }

    let explanation = `
<div class="formula-explanation">
    <strong>Методика расчета:</strong><br>
    Формула расчёта ${data.interestRateType.startsWith('cbr') ? 'неустойки' : 'договорных процентов'} за каждый день просрочки:<br>
    <div class="math-formula">
        Сумма ${data.interestRateType.startsWith('cbr') ? 'неустойки' : 'процентов'} = <br>
        Сумма долга × ${data.interestRateType === 'cbr_double' ? '(Ставка ЦБ × 2)' : 'Ставка'} × Количество дней просрочки<br>
        ─────────────────────────────────────────────────────────────────<br>
                              100 × ${daysInYear}
    </div>
`;

    // Добавляем детальную информацию о этапах расчета с формулами
    if (data.calculationStages && data.calculationStages.length > 0) {
        explanation += `<br><strong>Детализация расчета по периодам:</strong>`;
        explanation += `
<table class="calculation-details">
    <tr>
        <th>Сумма долга</th>
        <th>Ставка</th>
        <th>Период просрочки</th>
        <th>Дней</th>
        <th>Формула расчета</th>
        <th>Начислено</th>
    </tr>
`;

        data.calculationStages.forEach((stage, index) => {
            const stageDaysInYear = isLeapYear(new Date(stage.startDate)) ? 366 : 365;
            const displayRate = data.interestRateType === 'cbr_double' ? rateValue * 2 : rateValue;

            explanation += `
    <tr>
        <td>${stage.principal.toFixed(2)} руб.</td>
        <td>${displayRate}%</td>
        <td>${stage.startDate} - ${stage.endDate}</td>
        <td>${stage.days}</td>
        <td>
            ${stage.principal.toFixed(2)} × ${displayRate}% × ${stage.days}<br>
            ───────────────────────<br>
            100 × ${stageDaysInYear}
        </td>
        <td>${stage.interest.toFixed(2)} руб.</td>
    </tr>
`;

            if (stage.payment) {
                explanation += `
    <tr class="payment-row">
        <td colspan="6">
            → Платеж ${stage.payment.date}: ${stage.payment.amount.toFixed(2)} руб.
            (в счет ${stage.payment.destination === 'debt' ? 'долга' : 'неустойки'})
        </td>
    </tr>
`;
            }
        });

        explanation += `</table>`;
    }

    // Добавляем информацию о применении ограничения
    if (data.maxRate) {
        explanation += `<br><strong>Применено ограничение:</strong> неустойка не может превышать ${data.maxRate}% от суммы долга (${(data.debtAmount * data.maxRate / 100).toFixed(2)} руб.)<br>`;
    }

    // Добавляем информацию о частичных оплатах
    if (data.totalPayments > 0) {
        explanation += `<br><strong>Частичные оплаты:</strong> ${data.totalPayments.toFixed(2)} руб. `;
        if (data.debtPayments > 0) {
            explanation += `(в счёт долга: ${data.debtPayments.toFixed(2)} руб.) `;
        }
        if (data.penaltyPayments > 0) {
            explanation += `(в счёт неустойки: ${data.penaltyPayments.toFixed(2)} руб.)`;
        }
    }

    // ДОБАВЛЯЕМ ИТОГОВУЮ СУММУ ЗАДОЛЖЕННОСТИ
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

    // Реализация таблицы с правильными формулами
    return tableHtml;
}

function showResults(data) {
    let resultsContainer = document.querySelector('.results-container');

    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container';
        document.querySelector('.calculator-container').appendChild(resultsContainer);
    }

    const formulaHtml = createFormulaExplanation(data);

    resultsContainer.innerHTML = `
        <div class="calculation-header">
            <h3>Расчёт задолженности</h3>
            ${formulaHtml}
        </div>
        ${document.getElementById('text-view').checked ? createTextView(data) : createTableView(data)}
    `;
}

function createTextView(data) {
    return `
<h3>Результаты расчета</h3>
<div class="results-text">
    <p><strong>Основная сумма задолженности:</strong> ${data.debtAmount.toFixed(2)} руб.</p>
    <p><strong>Период расчета:</strong> ${data.startDate} - ${data.endDate} (${data.days} дней)</p>
    <p><strong>Процентная ставка:</strong> ${data.interestRate} (${data.dailyRate.toFixed(4)}% в день)</p>
    <p><strong>Начисленные ${data.interestRateType.startsWith('cbr') ? 'неустойки' : 'проценты'}:</strong> ${data.interest.toFixed(2)} руб.</p>
    <p><strong>Частичные оплаты:</strong> ${data.totalPayments.toFixed(2)} руб.</p>
    <p><strong>Остаток основного долга:</strong> ${data.remainingDebt.toFixed(2)} руб.</p>
    <p><strong>Общая сумма задолженности:</strong> ${data.totalDebt.toFixed(2)} руб.</p>
    <p><strong>К оплате:</strong> <span class="total-amount">${data.amountToPay.toFixed(2)} руб.</span></p>
</div>
`;
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