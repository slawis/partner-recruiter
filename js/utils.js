/* ========================================
   PARTNER RECRUITER - UTILITIES
   Funkcje pomocnicze, toast notifications
   ======================================== */

// ============ TOAST NOTIFICATIONS ============
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : '❌';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============ FORMATTING HELPERS ============
function formatCurrency(value) {
    return value.toLocaleString('pl-PL') + ' zł';
}

function formatCurrencyShort(value) {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1).replace('.0', '') + ' mln zł';
    }
    if (value >= 1000) {
        return Math.round(value / 1000) + 'k zł';
    }
    return Math.round(value) + ' zł';
}

// ============ ID GENERATION ============
function generateId() {
    return 'inv_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function generateMeetingId() {
    return 'meeting_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============ INITIALS HELPERS ============
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function generateInitials(name) {
    if (!name) return '?';

    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return words[0].substring(0, 2).toUpperCase();
}

// ============ DOM HELPERS ============
function setTextContent(elementId, text) {
    const el = document.getElementById(elementId);
    if (el && text) {
        el.textContent = text;
    }
}

function setupContactLink(linkId, prefix, value, textId) {
    const link = document.getElementById(linkId);
    if (link) {
        if (value) {
            link.href = prefix + value.replace(/\s/g, '');
            link.style.display = '';
            if (textId) {
                setTextContent(textId, value);
            }
        } else {
            link.style.display = 'none';
        }
    }
}

function toggleDetailRow(rowId, valueId, value) {
    const row = document.getElementById(rowId);
    if (row) {
        if (value) {
            row.style.display = '';
            setTextContent(valueId, value);
        } else {
            row.style.display = 'none';
        }
    }
}

// ============ EMAIL FORMATTING ============
function formatEmailForDisplay(text) {
    return text
        .split('\n')
        .map(line => {
            if (line.startsWith('•')) {
                return `<p style="padding-left: 20px;">${line}</p>`;
            }
            if (line.trim() === '') {
                return '<br>';
            }
            return `<p>${line}</p>`;
        })
        .join('');
}

// ============ DATE FORMATTING ============
const DAY_NAMES = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
const DAY_NAMES_SHORT = ['ND', 'PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB'];
const MONTH_NAMES = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const MONTH_NAMES_SHORT = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

function formatMeetingDateForDisplay(meeting) {
    const date = new Date(meeting.date);
    return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

// ============ DEFAULT PHOTO ============
const DEFAULT_PHOTO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%232563eb'/%3E%3Ctext x='50' y='55' font-size='40' fill='white' text-anchor='middle' dominant-baseline='middle'%3E👤%3C/text%3E%3C/svg%3E";
