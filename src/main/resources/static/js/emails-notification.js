// Глобальные переменные для писем
let emailsNotificationBtn = null;
let emailsBadge = null;
let currentEmailsCount = 0;
let emailsCheckInterval = null;
let emailsServerView = null;

// Инициализация уведомлений о письмах
function initEmailsNotification() {
    createEmailsNotificationButton();
    findEmailsServerView();
    startEmailsPolling();
    setupEmailsEventListeners();
    console.log('Уведомления о письмах инициализированы');
}

// Поиск серверного View компонента для писем
function findEmailsServerView() {
    const vaadinElements = document.querySelectorAll('[id$="View"]');

    for (const element of vaadinElements) {
        if (element.$server && typeof element.$server.getUnreadEmailsCount === 'function') {
            emailsServerView = element.$server;
            console.log('Emails server view found');
            break;
        }
    }

    if (!emailsServerView) {
        console.log('Emails server view not found, will use fallback');
    }
}

// Запрос количества писем через Vaadin Flow
async function fetchEmailsCount() {
    try {
        if (!emailsServerView) {
            findEmailsServerView();
            return;
        }

        // Используем Vaadin Client-Server communication
        const count = await emailsServerView.getUnreadEmailsCount();
        updateEmailsNotification(count);

    } catch (error) {
        console.error('Ошибка при получении количества писем:', error);
        updateEmailsNotification(0);
    }
}

// Создание кнопки уведомлений о письмах
function createEmailsNotificationButton() {
    // Проверяем, не существует ли уже кнопка
    if (document.getElementById('emailsNotificationBtn')) {
        return;
    }

    // Ждём, пока кнопка событий появится на странице
    const eventsBtn = document.getElementById('eventsNotificationBtn');
    if (!eventsBtn) {
        // Если кнопка событий ещё не существует, повторяем попытку через короткое время
        setTimeout(createEmailsNotificationButton, 100);
        return;
    }

    emailsNotificationBtn = document.createElement('button');
    emailsNotificationBtn.id = 'emailsNotificationBtn';

    // Вычисляем новую позицию
    const newTop = eventsBtn.offsetTop + eventsBtn.offsetHeight + 10; // 10px - отступ между кнопками

    emailsNotificationBtn.style.cssText = `
        position: fixed;
        top: ${newTop}px;
        right: 20px;
        padding: 12px 24px;
        background: #27ae60;
        color: white;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
    `;

    // Создаем иконку
    const icon = document.createElement('i');
    icon.className = 'fas fa-envelope';

    // Создаем текст
    const text = document.createElement('span');
    text.textContent = 'Письма';
    text.id = 'emailsButtonText';

    // Создаем бейдж для отображения количества
    emailsBadge = document.createElement('span');
    emailsBadge.id = 'emailsBadge';
    emailsBadge.style.cssText = `
        background: #c0392b;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        display: none;
    `;

    // Собираем кнопку
    emailsNotificationBtn.appendChild(icon);
    emailsNotificationBtn.appendChild(text);
    emailsNotificationBtn.appendChild(emailsBadge);

    // Добавляем кнопку на страницу
    document.body.appendChild(emailsNotificationBtn);
}

// Запрос количества новых писем через Vaadin Flow (эта функция уже была правильной)
async function fetchEmailsCount() {
    try {
        if (!emailsServerView) {
            findEmailsServerView();
            return;
        }

        // Используем Vaadin Client-Server communication
        const count = await emailsServerView.getUnreadEmailsCount();
        updateEmailsNotification(count);

    } catch (error) {
        console.error('Ошибка при получении количества писем:', error);
        updateEmailsNotification(0);
    }
}

// Обновление уведомления о письмах
function updateEmailsNotification(count) {
    currentEmailsCount = count;

    if (count > 0) {
        emailsBadge.textContent = count > 99 ? '99+' : count.toString();
        emailsBadge.style.display = 'flex';
        emailsNotificationBtn.style.background = '#c0392b';
        emailsNotificationBtn.style.boxShadow = '0 2px 15px rgba(192, 57, 43, 0.4)';
        addEmailsPulseAnimation();
    } else {
        emailsBadge.style.display = 'none';
        emailsNotificationBtn.style.background = '#27ae60';
        emailsNotificationBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        emailsNotificationBtn.style.animation = 'none';
    }
}

// Добавление CSS анимации для писем
function addEmailsPulseAnimation() {
    if (!document.getElementById('emailsPulseAnimation')) {
        const style = document.createElement('style');
        style.id = 'emailsPulseAnimation';
        style.textContent = `
            @keyframes emailsPulse {
                0% { transform: scale(1); box-shadow: 0 2px 15px rgba(192, 57, 43, 0.4); }
                50% { transform: scale(1.05); box-shadow: 0 2px 20px rgba(192, 57, 43, 0.6); }
                100% { transform: scale(1); box-shadow: 0 2px 15px rgba(192, 57, 43, 0.4); }
            }
            #emailsNotificationBtn {
                animation: emailsPulse 2s infinite;
            }
        `;
        document.head.appendChild(style);
    }
}

// Показать модальное окно с письмами
function showEmailsModal() {
    // Перенаправляем на страницу с письмами вместо показа модального окна
    window.location.href = '/EmailListView';
    //window.location.href = '/EmailListView?filter=unread';
}

// Новая функция для загрузки писем с сервера
function loadEmails() {
    if (emailsServerView) {
        emailsServerView.fetchEmailsForDisplay().then(result => {
            const emails = JSON.parse(result);
            // Здесь ваша логика для отображения писем на UI
            console.log(emails);
        }).catch(error => {
            console.error('Failed to load emails:', error);
        });
    }
}

// Закрыть модальное окно писем
function closeEmailsModal() {
    const modal = document.getElementById('emailsModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

// Правильная форма слова для писем
function getEmailWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) return 'новое письмо';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
        return 'новых письма';
    }
    return 'новых писем';
}

// Запуск периодической проверки писем
function startEmailsPolling() {
    fetchEmailsCount();
    emailsCheckInterval = setInterval(fetchEmailsCount, 3600000);
}

// Настройка обработчиков событий
function setupEmailsEventListeners() {
    if (emailsNotificationBtn) {
        emailsNotificationBtn.addEventListener('click', showEmailsModal);
    }
}

// Очистка интервалов
function cleanupEmails() {
    if (emailsCheckInterval) {
        clearInterval(emailsCheckInterval);
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализируем уведомления о письмах...');
    setTimeout(initEmailsNotification, 1000); // Задержка для инициализации Vaadin
});

// Резервная инициализация
if (document.readyState !== 'loading') {
    setTimeout(initEmailsNotification, 1000);
}

// Очистка при выгрузке страницы
window.addEventListener('beforeunload', cleanupEmails);