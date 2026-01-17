/* ========================================
   PARTNER RECRUITER - LANDING MODE
   Landing page, personalizacja treści
   ======================================== */

// ============ LANDING INITIALIZATION ============
function initLanding() {
    // Personalize content
    personalizeContent();

    // Initialize calculator
    initCalculator();

    // Initialize meeting scheduler
    initMeetingScheduler();

    // Initialize mobile and desktop apps
    initMobileApp();
    initDesktopApp();
}

// ============ PERSONALIZATION ============
function personalizeContent() {
    const params = AppState.landingParams;

    // ========== PERSONALIZACJA PARTNERA ==========

    // Imię do powitania (tylko imię, bez nazwiska - bardziej osobiste)
    const greetingName = params.partnerName || 'Partnerze';
    setTextContent('partnerDisplayName', greetingName);
    setTextContent('desktopPartnerName', greetingName);

    // Pełne dane partnera do formularza rejestracji
    const regName = document.getElementById('regName');
    if (regName && params.partnerName) {
        regName.value = params.partnerFullName || params.partnerName;
    }

    const regPhone = document.getElementById('regPhone');
    if (regPhone && params.partnerPhone) {
        regPhone.value = params.partnerPhone;
    }

    const regEmail = document.getElementById('regEmail');
    if (regEmail && params.partnerEmail) {
        regEmail.value = params.partnerEmail;
    }

    // ========== PERSONALIZACJA ZAPRASZAJĄCEGO ==========

    // Wszystkie miejsca gdzie wyświetlane jest imię zapraszającego
    const inviterNameElements = [
        'appInviterName',           // Mobile welcome card
        'inviterName',              // Legacy element
        'ctaInviterName',           // CTA section
        'modalInviterName',         // Success modal
        'inviterContactName',       // Mobile contact card
        'desktopInviterName',       // Desktop hero
        'desktopInviterCardName'    // Desktop scheduler card
    ];

    inviterNameElements.forEach(id => {
        setTextContent(id, params.inviterName);
    });

    // Rola zapraszającego
    const inviterRoleElements = [
        'appInviterRole',
        'ctaInviterRole',
        'inviterContactRole',
        'desktopInviterCardRole'
    ];

    inviterRoleElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (params.inviterRole) {
                el.textContent = params.inviterRole;
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        }
    });

    // Zdjęcie zapraszającego
    const inviterPhotoElements = [
        'appInviterPhoto',
        'inviterContactPhoto',
        'desktopInviterPhoto'
    ];

    inviterPhotoElements.forEach(id => {
        const img = document.getElementById(id);
        if (img) {
            img.src = params.inviterPhoto || DEFAULT_PHOTO;
            img.onerror = function() { this.src = DEFAULT_PHOTO; };
        }
    });

    // Telefon zapraszającego
    setupContactLink('inviterBtnPhone', 'tel:', params.inviterPhone);
    setupContactLink('ctaInviterPhoneLink', 'tel:', params.inviterPhone, 'ctaInviterPhone');
    setupContactLink('desktopInviterPhoneLink', 'tel:', params.inviterPhone, 'desktopInviterCardPhone');

    // Email zapraszającego
    setupContactLink('inviterBtnEmail', 'mailto:', params.inviterEmail);
    setupContactLink('ctaInviterEmailLink', 'mailto:', params.inviterEmail, 'ctaInviterEmail');
    setupContactLink('desktopInviterEmailLink', 'mailto:', params.inviterEmail, 'desktopInviterCardEmail');

    // Kontakty zapraszającego w hero sekcji (mobile)
    // Phone link (obok roli)
    const phoneLink = document.getElementById('inviterPhoneLink');
    if (phoneLink) {
        if (params.inviterPhone) {
            phoneLink.href = 'tel:' + params.inviterPhone.replace(/\s/g, '');
            setTextContent('inviterPhoneText', params.inviterPhone);
            phoneLink.style.display = 'inline-flex';
        } else {
            phoneLink.style.display = 'none';
        }
    }

    // Email link (pod rolą)
    const emailLink = document.getElementById('inviterEmailLink');
    if (emailLink) {
        if (params.inviterEmail) {
            emailLink.href = 'mailto:' + params.inviterEmail;
            setTextContent('inviterEmailText', params.inviterEmail);
            emailLink.style.display = 'inline-flex';
        } else {
            emailLink.style.display = 'none';
        }
    }

    // Kontakty zapraszającego w hero sekcji (desktop)
    const desktopInviterContacts = document.getElementById('desktopInviterContacts');
    if (desktopInviterContacts) {
        const hasInviterContact = params.inviterPhone || params.inviterEmail;
        if (hasInviterContact) {
            desktopInviterContacts.style.display = 'flex';

            // Phone link
            const phoneLink = document.getElementById('desktopInviterPhoneBadge');
            if (phoneLink) {
                if (params.inviterPhone) {
                    phoneLink.href = 'tel:' + params.inviterPhone.replace(/\s/g, '');
                    setTextContent('desktopInviterPhoneText', params.inviterPhone);
                    phoneLink.style.display = 'flex';
                } else {
                    phoneLink.style.display = 'none';
                }
            }

            // Email link
            const emailLink = document.getElementById('desktopInviterEmailBadge');
            if (emailLink) {
                if (params.inviterEmail) {
                    emailLink.href = 'mailto:' + params.inviterEmail;
                    setTextContent('desktopInviterEmailText', params.inviterEmail);
                    emailLink.style.display = 'flex';
                } else {
                    emailLink.style.display = 'none';
                }
            }
        } else {
            desktopInviterContacts.style.display = 'none';
        }
    }

    // Bio zapraszającego
    const bioElements = ['inviterContactBio', 'ctaInviterBio', 'desktopInviterCardBio'];
    bioElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (params.inviterBio) {
                el.textContent = params.inviterBio;
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        }
    });

    // Zapisz numer do przycisku w headerze
    window.inviterPhoneNumber = params.inviterPhone;

    // ========== AKTUALIZACJA TYTUŁU STRONY ==========
    if (params.partnerName && params.inviterName) {
        document.title = `${params.partnerName}, zaproszenie od ${params.inviterName} | posrednik.app`;
    }

    // ========== PARTNER BUSINESS CARD ==========
    populatePartnerBusinessCard(params);

    console.log('Personalizacja zakończona:', params);
}

function populatePartnerBusinessCard(params) {
    // Sprawdź czy mamy dane partnera do wyświetlenia (przynajmniej firma lub szczegóły kontaktowe)
    const hasBusinessData = params.partnerCompany || params.partnerNIP ||
                            params.partnerPhone || params.partnerEmail || params.partnerAddress;

    const fullName = params.partnerFullName || params.partnerName || 'Partner';
    const initials = generateInitials(fullName);

    // ========== MOBILE VERSION ==========
    const mobileSection = document.getElementById('partnerBusinessCard');
    if (mobileSection) {
        if (!hasBusinessData) {
            mobileSection.style.display = 'none';
        } else {
            mobileSection.style.display = 'block';

            setTextContent('partnerCardName', fullName);
            setTextContent('partnerAvatarInitials', initials);

            // Firma
            const companyRow = document.getElementById('partnerCardCompany');
            if (companyRow) {
                if (params.partnerCompany) {
                    companyRow.style.display = '';
                    setTextContent('partnerCardCompanyName', params.partnerCompany);
                } else {
                    companyRow.style.display = 'none';
                }
            }

            // Szczegóły
            toggleDetailRow('partnerCardNipRow', 'partnerCardNip', params.partnerNIP);
            toggleDetailRow('partnerCardPhoneRow', 'partnerCardPhone', params.partnerPhone);
            toggleDetailRow('partnerCardEmailRow', 'partnerCardEmail', params.partnerEmail);
            toggleDetailRow('partnerCardAddressRow', 'partnerCardAddress', params.partnerAddress);

            // Ukryj siatkę szczegółów jeśli nie ma żadnych danych
            const detailsGrid = mobileSection.querySelector('.for-details-grid');
            if (detailsGrid) {
                const hasAnyDetail = params.partnerNIP || params.partnerPhone ||
                                     params.partnerEmail || params.partnerAddress;
                detailsGrid.style.display = hasAnyDetail ? 'grid' : 'none';
            }
        }
    }

    // ========== DESKTOP VERSION ==========
    const desktopCard = document.getElementById('desktopPartnerCard');
    if (desktopCard) {
        if (!hasBusinessData) {
            desktopCard.style.display = 'none';
        } else {
            desktopCard.style.display = 'block';

            setTextContent('desktopPartnerFullName', fullName);
            setTextContent('desktopPartnerInitials', initials);

            // Firma
            const companyRow = document.getElementById('desktopPartnerCompanyRow');
            if (companyRow) {
                if (params.partnerCompany) {
                    companyRow.style.display = '';
                    setTextContent('desktopPartnerCompany', params.partnerCompany);
                } else {
                    companyRow.style.display = 'none';
                }
            }

            // Szczegóły
            toggleDetailRow('desktopPartnerNipRow', 'desktopPartnerNip', params.partnerNIP);
            toggleDetailRow('desktopPartnerPhoneRow', 'desktopPartnerPhone', params.partnerPhone);
            toggleDetailRow('desktopPartnerEmailRow', 'desktopPartnerEmail', params.partnerEmail);
            toggleDetailRow('desktopPartnerAddressRow', 'desktopPartnerAddress', params.partnerAddress);

            // Ukryj siatkę szczegółów jeśli nie ma żadnych danych
            const detailsGrid = desktopCard.querySelector('.dpc-details');
            if (detailsGrid) {
                const hasAnyDetail = params.partnerNIP || params.partnerPhone ||
                                     params.partnerEmail || params.partnerAddress;
                detailsGrid.style.display = hasAnyDetail ? 'grid' : 'none';
            }
        }
    }
}

// ============ SUCCESS MODAL ============
function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

// ============ GLOBAL FUNCTIONS ============
window.closeModal = closeModal;
