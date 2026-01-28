/* ========================================
   PARTNER RECRUITER - SCHEDULER
   Scheduler spotkań (mobile + desktop)
   ======================================== */

// ============ SCHEDULER STATE ============
let schedulerState = {
    selectedDate: null,
    selectedTime: null,
    selectedMethod: 'phone',
    dateOffset: 0
};

// ============ MOBILE APP STATE ============
let mobileAppState = {
    selectedDate: null,
    selectedTime: null,
    selectedMethod: 'phone',
    existingMeetingId: null
};

// ============ DESKTOP SCHEDULER STATE ============
let desktopSchedulerState = {
    selectedDate: null,
    selectedTime: null,
    selectedMethod: 'phone',
    dateOffset: 0,
    existingMeetingId: null
};

// ============ MEETING SCHEDULER INITIALIZATION ============
function initMeetingScheduler() {
    // Generate date options
    generateDateOptions();

    // Setup date navigation (with null checks)
    const datePrev = document.getElementById('datePrev');
    const dateNext = document.getElementById('dateNext');

    if (datePrev) {
        datePrev.addEventListener('click', () => {
            if (schedulerState.dateOffset > 0) {
                schedulerState.dateOffset -= 5;
                generateDateOptions();
            }
        });
    }

    if (dateNext) {
        dateNext.addEventListener('click', () => {
            if (schedulerState.dateOffset < 9) {
                schedulerState.dateOffset += 5;
                generateDateOptions();
            }
        });
    }

    // Setup contact method selector
    const methodOptions = document.querySelectorAll('.method-option');
    methodOptions.forEach(option => {
        option.addEventListener('click', () => {
            methodOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            schedulerState.selectedMethod = option.querySelector('input').value;
            updateSchedulerSummary();
        });
    });

    // Setup time slots
    const timeSlots = document.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            timeSlots.forEach(s => s.classList.remove('active'));
            slot.classList.add('active');
            schedulerState.selectedTime = slot.dataset.time;
            updateSchedulerSummary();
        });
    });
}

function generateDateOptions() {
    const dateList = document.getElementById('dateList');
    if (!dateList) return; // Exit if element doesn't exist

    const today = new Date();
    const dayNames = ['ND', 'PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB'];
    const monthNames = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

    dateList.innerHTML = '';

    let daysAdded = 0;
    let dayOffset = 1 + schedulerState.dateOffset;

    while (daysAdded < 5 && dayOffset < 30) {
        const date = new Date(today);
        date.setDate(today.getDate() + dayOffset);
        dayOffset++;

        const dayOfWeek = date.getDay();
        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            continue;
        }

        const dateString = date.toISOString().split('T')[0];
        const isSelected = schedulerState.selectedDate === dateString;

        const dateItem = document.createElement('div');
        dateItem.className = `date-item${isSelected ? ' active' : ''}`;
        dateItem.dataset.date = dateString;
        dateItem.innerHTML = `
            <span class="date-weekday">${dayNames[dayOfWeek]}</span>
            <span class="date-day">${date.getDate()}</span>
            <span class="date-month">${monthNames[date.getMonth()]}</span>
        `;

        dateItem.addEventListener('click', () => {
            document.querySelectorAll('.date-item').forEach(d => d.classList.remove('active'));
            dateItem.classList.add('active');
            schedulerState.selectedDate = dateString;
            updateSchedulerSummary();
        });

        dateList.appendChild(dateItem);
        daysAdded++;
    }

    // Update navigation buttons (with null checks)
    const datePrev = document.getElementById('datePrev');
    const dateNext = document.getElementById('dateNext');
    if (datePrev) datePrev.disabled = schedulerState.dateOffset === 0;
    if (dateNext) dateNext.disabled = schedulerState.dateOffset >= 15;
}

function updateSchedulerSummary() {
    const summary = document.getElementById('schedulerSummary');
    const dateTimeEl = document.getElementById('summaryDateTime');
    const methodEl = document.getElementById('summaryMethod');

    if (schedulerState.selectedDate && schedulerState.selectedTime) {
        const date = new Date(schedulerState.selectedDate);
        const formattedDate = `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
        if (dateTimeEl) dateTimeEl.textContent = `${formattedDate}, godz. ${schedulerState.selectedTime}`;

        if (summary) summary.classList.add('ready');
    } else {
        if (dateTimeEl) dateTimeEl.textContent = '-';
        if (summary) summary.classList.remove('ready');
    }

    const methodIcon = schedulerState.selectedMethod === 'phone' ? '📞' : '🎥';
    const methodText = schedulerState.selectedMethod === 'phone' ? 'Rozmowa telefoniczna' : 'Video rozmowa';
    if (methodEl) methodEl.textContent = `${methodIcon} ${methodText}`;

    updateScheduleButton();
}

function updateScheduleButton() {
    const btn = document.getElementById('btnSchedule');
    if (!btn) return;

    const isReady = schedulerState.selectedDate && schedulerState.selectedTime;

    btn.disabled = !isReady;
}

// ============ MOBILE APP ============
function initMobileApp() {
    // Only initialize on landing page
    if (AppState.mode !== 'landing') return;

    // Initialize bottom sheet
    initBottomSheet();

    // Initialize mobile date picker
    initMobileDatePicker();

    // Initialize time grid
    initTimeGrid();

    // Initialize method toggle
    initMethodToggle();

    // Initialize services carousel
    initServicesCarousel();

    // Initialize calculator sliders for mobile
    initMobileCalculator();

    // Setup header call button
    setupHeaderCallButton();

    // Check for existing meeting and update UI
    updateMeetingConfirmedUI();
}

function getExistingMeetingForInvitation() {
    const meetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');
    if (meetings.length === 0) return null;

    const invitationId = AppState.landingParams.invitationId;
    const partnerName = AppState.landingParams.partnerName;
    const partnerPhone = AppState.landingParams.partnerPhone;
    const inviterName = AppState.landingParams.inviterName;

    // First try to find by invitationId if available
    if (invitationId) {
        const byId = meetings.find(m => m.invitationId === invitationId);
        if (byId) return byId;
    }

    // Fallback: find by partner name + phone + inviter combination
    if (partnerName) {
        const byPartner = meetings.find(m =>
            m.partnerName === partnerName &&
            (m.partnerPhone === partnerPhone || !partnerPhone) &&
            (m.inviterName === inviterName || !inviterName)
        );
        if (byPartner) return byPartner;
    }

    return null;
}

function updateMeetingConfirmedUI(meeting = null) {
    const existing = meeting || getExistingMeetingForInvitation();

    // Mobile bottom bar elements
    const mobileBar = document.getElementById('mobileBottomBar');
    const mobileTitle = document.getElementById('mobileBarTitle');
    const mobileSubtitle = document.getElementById('mobileBarSubtitle');
    const mobileIcon = document.getElementById('mobileBarIcon');
    const mobileBtnText = document.getElementById('mobileBarBtnText');

    // Desktop elements
    const desktopConfirmed = document.getElementById('desktopMeetingConfirmed');
    const desktopForm = document.getElementById('desktopMeetingForm');
    const desktopDate = document.getElementById('desktopConfirmedDate');
    const desktopMethod = document.getElementById('desktopConfirmedMethod');
    const btnChangeDesktop = document.getElementById('btnChangeDesktopMeeting');

    if (existing) {
        const formattedDate = formatMeetingDateForDisplay(existing);
        const methodIcon = existing.method === 'phone' ? '📞' : '🎥';
        const methodText = existing.method === 'phone' ? 'Rozmowa telefoniczna' : 'Video rozmowa';

        // Update mobile bottom bar
        if (mobileBar) mobileBar.classList.add('confirmed');
        if (mobileTitle) mobileTitle.textContent = 'Umówione spotkanie';
        if (mobileSubtitle) mobileSubtitle.textContent = `${formattedDate}, ${existing.time}`;
        if (mobileIcon) mobileIcon.textContent = '✏️';
        if (mobileBtnText) mobileBtnText.textContent = 'Zmień';

        // Update desktop panel
        if (desktopConfirmed) {
            desktopConfirmed.style.display = 'block';
        }
        if (desktopForm) {
            desktopForm.style.display = 'none';
        }
        if (desktopDate) {
            desktopDate.textContent = `📅 ${formattedDate}, godz. ${existing.time}`;
        }
        if (desktopMethod) {
            desktopMethod.innerHTML = `${methodIcon} ${methodText}`;
        }

        // Setup change button
        if (btnChangeDesktop) {
            btnChangeDesktop.onclick = () => {
                if (desktopConfirmed) desktopConfirmed.style.display = 'none';
                if (desktopForm) desktopForm.style.display = 'block';
                showDesktopExistingMeetingBanner();
            };
        }
    } else {
        // Reset to default state
        if (mobileBar) mobileBar.classList.remove('confirmed');
        if (mobileTitle) mobileTitle.textContent = 'Gotowy na współpracę?';
        if (mobileSubtitle) mobileSubtitle.textContent = 'Umów bezpłatną rozmowę';
        if (mobileIcon) mobileIcon.textContent = '📅';
        if (mobileBtnText) mobileBtnText.textContent = 'Umów się';

        if (desktopConfirmed) desktopConfirmed.style.display = 'none';
        if (desktopForm) desktopForm.style.display = 'block';
    }
}

function showExistingMeetingBanner() {
    const banner = document.getElementById('existingMeetingBanner');
    const detailsEl = document.getElementById('existingMeetingDetails');

    if (!banner || !detailsEl) return;

    const existing = getExistingMeetingForInvitation();

    if (existing) {
        // Store existing meeting ID for later update
        mobileAppState.existingMeetingId = existing.id;

        // Format the date for display
        const date = new Date(existing.date);
        const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
        const methodIcon = existing.method === 'phone' ? '📞' : '🎥';
        const formattedDate = `${dayNames[date.getDay()]}, ${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')} o ${existing.time}`;

        detailsEl.textContent = `${methodIcon} ${formattedDate}`;
        banner.style.display = 'flex';

        // Pre-select the existing method
        const methodRadio = document.querySelector(`input[name="contactMethod"][value="${existing.method}"]`);
        if (methodRadio) {
            methodRadio.checked = true;
            methodRadio.closest('.method-toggle-option')?.classList.add('active');
            document.querySelectorAll('.method-toggle-option').forEach(opt => {
                if (opt !== methodRadio.closest('.method-toggle-option')) {
                    opt.classList.remove('active');
                }
            });
            mobileAppState.selectedMethod = existing.method;
        }
    } else {
        mobileAppState.existingMeetingId = null;
        banner.style.display = 'none';
    }
}

function initBottomSheet() {
    const overlay = document.getElementById('schedulerOverlay');
    const sheet = document.getElementById('schedulerSheet');
    const openBtn = document.getElementById('btnOpenScheduler');
    const closeBtn = document.getElementById('btnCloseScheduler');

    if (!overlay || !sheet || !openBtn) return;

    openBtn.addEventListener('click', () => {
        // Check for existing meeting before showing
        showExistingMeetingBanner();

        overlay.classList.add('active');
        sheet.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closeBottomSheet);
    }

    overlay.addEventListener('click', closeBottomSheet);

    // Handle form submission
    const form = document.getElementById('meetingForm');
    if (form) {
        form.addEventListener('submit', handleMobileScheduleSubmit);
    }
}

function closeBottomSheet() {
    const overlay = document.getElementById('schedulerOverlay');
    const sheet = document.getElementById('schedulerSheet');

    if (overlay) overlay.classList.remove('active');
    if (sheet) sheet.classList.remove('active');
    document.body.style.overflow = '';
}

function initMobileDatePicker() {
    const container = document.getElementById('dateScrollContainer');
    if (!container) return;

    const today = new Date();
    const dayNames = ['ND', 'PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB'];
    const monthNames = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

    container.innerHTML = '';

    let daysAdded = 0;
    let dayOffset = 0;

    while (daysAdded < 14 && dayOffset < 30) {
        const date = new Date(today);
        date.setDate(today.getDate() + dayOffset);

        const dayOfWeek = date.getDay();
        const isToday = dayOffset === 0;

        // Skip weekends (unless today is weekend)
        if (!isToday && (dayOfWeek === 0 || dayOfWeek === 6)) {
            dayOffset++;
            continue;
        }

        const dateString = date.toISOString().split('T')[0];

        const dateItem = document.createElement('div');
        dateItem.className = `date-scroll-item${isToday ? ' today' : ''}`;
        dateItem.dataset.date = dateString;
        dateItem.innerHTML = `
            <span class="dsi-weekday">${dayNames[dayOfWeek]}</span>
            <span class="dsi-day">${date.getDate()}</span>
            <span class="dsi-month">${monthNames[date.getMonth()]}</span>
            ${isToday ? '<span class="dsi-today-badge">DZIŚ</span>' : ''}
        `;

        dateItem.addEventListener('click', () => {
            document.querySelectorAll('.date-scroll-item').forEach(d => d.classList.remove('selected'));
            dateItem.classList.add('selected');
            mobileAppState.selectedDate = dateString;
            updateMobileSummary();
        });

        container.appendChild(dateItem);
        daysAdded++;
        dayOffset++;
    }
}

function initTimeGrid() {
    const timeGrid = document.getElementById('timeGrid');
    if (!timeGrid) return;

    const timeBtns = timeGrid.querySelectorAll('.time-btn');
    timeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            timeBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            mobileAppState.selectedTime = btn.dataset.time;
            updateMobileSummary();
        });
    });
}

function initMethodToggle() {
    const methodOptions = document.querySelectorAll('.method-toggle-option');
    methodOptions.forEach(option => {
        option.addEventListener('click', () => {
            methodOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            const input = option.querySelector('input');
            if (input) {
                input.checked = true;
                mobileAppState.selectedMethod = input.value;
            }
            updateMobileSummary();
        });
    });
}

function updateMobileSummary() {
    const dateEl = document.getElementById('summaryDate');
    const methodEl = document.getElementById('summaryMethodText');
    const submitBtn = document.getElementById('btnScheduleSubmit');

    if (mobileAppState.selectedDate && mobileAppState.selectedTime) {
        const date = new Date(mobileAppState.selectedDate);
        const formattedDate = `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}, ${mobileAppState.selectedTime}`;
        if (dateEl) dateEl.textContent = formattedDate;

        if (submitBtn) submitBtn.disabled = false;
    } else {
        if (dateEl) dateEl.textContent = 'Wybierz termin';
        if (submitBtn) submitBtn.disabled = true;
    }

    const methodIcon = mobileAppState.selectedMethod === 'phone' ? '📞' : '🎥';
    const methodText = mobileAppState.selectedMethod === 'phone' ? 'Rozmowa telefoniczna' : 'Video rozmowa';
    if (methodEl) methodEl.textContent = `${methodIcon} ${methodText}`;
}

function handleMobileScheduleSubmit(e) {
    e.preventDefault();

    if (!mobileAppState.selectedDate || !mobileAppState.selectedTime) {
        showToast('Wybierz datę i godzinę', 'error');
        return;
    }

    const name = document.getElementById('regName')?.value.trim() || AppState.landingParams.partnerName;
    const phone = document.getElementById('regPhone')?.value.trim() || AppState.landingParams.partnerPhone || '';
    const email = document.getElementById('regEmail')?.value.trim() || AppState.landingParams.partnerEmail || '';

    const date = new Date(mobileAppState.selectedDate);
    const formattedDate = `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;

    const isUpdate = !!mobileAppState.existingMeetingId;

    const meeting = {
        id: isUpdate ? mobileAppState.existingMeetingId : generateMeetingId(),
        partnerName: name,
        partnerPhone: phone,
        partnerEmail: email,
        date: mobileAppState.selectedDate,
        time: mobileAppState.selectedTime,
        method: mobileAppState.selectedMethod,
        formattedDateTime: `${formattedDate}, godz. ${mobileAppState.selectedTime}`,
        inviterKey: AppState.landingParams.inviterKey || '',
        inviterName: AppState.landingParams.inviterName,
        invitationId: AppState.landingParams.invitationId,
        scheduledAt: new Date().toISOString()
    };

    // Save to localStorage (scheduledMeetings - shared with calendar)
    let meetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');

    if (isUpdate) {
        // Update existing meeting - remove old one and add updated
        meetings = meetings.filter(m => m.id !== mobileAppState.existingMeetingId);
    }

    meetings.push(meeting);
    localStorage.setItem('scheduledMeetings', JSON.stringify(meetings));

    // Zapisz do Supabase
    saveMeetingToSupabase(meeting);

    // Update invitation status
    if (AppState.landingParams.invitationId) {
        updateInvitationStatus(AppState.landingParams.invitationId, 'registered');
    }

    // Aktualizuj statystyki partnera (tylko dla nowych spotkań)
    if (!isUpdate && typeof findPartnerByPhone === 'function') {
        const inviterKey = AppState.landingParams.inviterKey || '';
        findPartnerByPhone(phone, inviterKey).then(partner => {
            if (partner && typeof updatePartnerMeetingsCount === 'function') {
                updatePartnerMeetingsCount(partner.id, 1);
            }
        }).catch(err => console.error('Error updating partner stats:', err));
    }

    // Close bottom sheet
    closeBottomSheet();

    // Update and show success modal
    const modalDateTime = document.getElementById('modalDateTime');
    const modalMethodIcon = document.getElementById('modalMethodIcon');
    const modalMethodText = document.getElementById('modalMethodText');

    if (modalDateTime) modalDateTime.textContent = meeting.formattedDateTime;
    if (modalMethodIcon) modalMethodIcon.textContent = mobileAppState.selectedMethod === 'phone' ? '📞' : '🎥';
    if (modalMethodText) modalMethodText.textContent = mobileAppState.selectedMethod === 'phone' ? 'Rozmowa telefoniczna' : 'Video rozmowa';

    document.getElementById('successModal').classList.add('active');

    // Update the bottom bar to show confirmed state
    updateMeetingConfirmedUI(meeting);

    showToast(isUpdate ? 'Termin spotkania zmieniony!' : 'Spotkanie umówione!', 'success');
}

function initServicesCarousel() {
    const carousel = document.getElementById('servicesCarousel');
    const dotsContainer = document.getElementById('carouselDots');

    if (!carousel || !dotsContainer) return;

    const slides = carousel.querySelectorAll('.service-slide');
    const dots = dotsContainer.querySelectorAll('.dot');

    carousel.addEventListener('scroll', () => {
        const scrollLeft = carousel.scrollLeft;
        const slideWidth = slides[0]?.offsetWidth + 12 || 272; // 260 + 12 gap
        const activeIndex = Math.round(scrollLeft / slideWidth);

        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });
    });

    // Make dots clickable
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            const slideWidth = slides[0]?.offsetWidth + 12 || 272;
            carousel.scrollTo({
                left: index * slideWidth,
                behavior: 'smooth'
            });
        });
    });
}

function setupHeaderCallButton() {
    const callBtn = document.getElementById('btnCallInviter');
    if (!callBtn) return;

    callBtn.addEventListener('click', () => {
        const phone = window.inviterPhoneNumber;
        if (phone) {
            window.location.href = `tel:${phone.replace(/\s/g, '')}`;
        } else {
            showToast('Brak numeru telefonu', 'info');
        }
    });
}

// ============ DESKTOP APP ============
function showDesktopExistingMeetingBanner() {
    const banner = document.getElementById('desktopExistingMeetingBanner');
    const detailsEl = document.getElementById('desktopExistingMeetingDetails');

    if (!banner || !detailsEl) return;

    const existing = getExistingMeetingForInvitation();

    if (existing) {
        // Store existing meeting ID for later update
        desktopSchedulerState.existingMeetingId = existing.id;

        // Format the date for display
        const date = new Date(existing.date);
        const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
        const methodIcon = existing.method === 'phone' ? '📞' : '🎥';
        const formattedDate = `${dayNames[date.getDay()]}, ${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')} o ${existing.time}`;

        detailsEl.textContent = `${methodIcon} ${formattedDate}`;
        banner.style.display = 'flex';

        // Pre-select the existing method
        const methodRadio = document.querySelector(`input[name="desktopContactMethod"][value="${existing.method}"]`);
        if (methodRadio) {
            methodRadio.checked = true;
            document.querySelectorAll('.method-option').forEach(opt => {
                opt.classList.toggle('active', opt.contains(methodRadio));
            });
            desktopSchedulerState.selectedMethod = existing.method;
        }
    } else {
        desktopSchedulerState.existingMeetingId = null;
        banner.style.display = 'none';
    }
}

function initDesktopScheduler() {
    initDesktopDatePicker();
    initDesktopTimeSlots();
    initDesktopMethodSelector();

    // Check for existing meetings
    showDesktopExistingMeetingBanner();

    const form = document.getElementById('desktopMeetingForm');
    if (form) {
        form.addEventListener('submit', handleDesktopScheduleSubmit);
    }
}

function initDesktopDatePicker() {
    const dateList = document.getElementById('desktopDateList');
    const prevBtn = document.getElementById('desktopDatePrev');
    const nextBtn = document.getElementById('desktopDateNext');

    if (!dateList) return;

    function renderDates() {
        dateList.innerHTML = '';
        const today = new Date();
        const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
        const monthNames = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + desktopSchedulerState.dateOffset + i);

            const dateStr = date.toISOString().split('T')[0];
            const dayName = dayNames[date.getDay()];
            const dayNum = date.getDate();
            const monthName = monthNames[date.getMonth()];

            const isSelected = desktopSchedulerState.selectedDate === dateStr;

            const dateItem = document.createElement('div');
            dateItem.className = `date-item${isSelected ? ' active' : ''}`;
            dateItem.dataset.date = dateStr;
            dateItem.innerHTML = `
                <span class="date-weekday">${dayName}</span>
                <span class="date-day">${dayNum}</span>
                <span class="date-month">${monthName}</span>
            `;

            dateItem.addEventListener('click', () => {
                desktopSchedulerState.selectedDate = dateStr;
                dateList.querySelectorAll('.date-item').forEach(opt => {
                    opt.classList.toggle('active', opt.dataset.date === dateStr);
                });
                updateDesktopSummary();
            });

            dateList.appendChild(dateItem);
        }
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (desktopSchedulerState.dateOffset > 0) {
                desktopSchedulerState.dateOffset -= 7;
                renderDates();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            desktopSchedulerState.dateOffset += 7;
            renderDates();
        });
    }

    renderDates();
}

function initDesktopTimeSlots() {
    const timeSlotsContainer = document.getElementById('desktopTimeSlots');
    if (!timeSlotsContainer) return;

    const timeSlots = timeSlotsContainer.querySelectorAll('.time-slot');

    timeSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            const time = slot.dataset.time;
            desktopSchedulerState.selectedTime = time;

            timeSlots.forEach(s => s.classList.remove('active'));
            slot.classList.add('active');

            updateDesktopSummary();
        });
    });
}

function initDesktopMethodSelector() {
    const methodOptions = document.querySelectorAll('.desktop-layout .method-option');

    methodOptions.forEach(option => {
        const input = option.querySelector('input');

        option.addEventListener('click', () => {
            methodOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            if (input) {
                input.checked = true;
                desktopSchedulerState.selectedMethod = input.value;
                updateDesktopSummary();
            }
        });
    });
}

function updateDesktopSummary() {
    const summaryBox = document.getElementById('desktopSchedulerSummary');
    const summaryDateTime = document.getElementById('desktopSummaryDateTime');
    const summaryMethod = document.getElementById('desktopSummaryMethod');
    const submitBtn = document.getElementById('desktopBtnSchedule');

    const { selectedDate, selectedTime, selectedMethod } = desktopSchedulerState;

    if (selectedDate && selectedTime) {
        const date = new Date(selectedDate);
        const formattedDate = `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;

        if (summaryDateTime) {
            summaryDateTime.textContent = `${formattedDate} o ${selectedTime}`;
        }

        if (summaryMethod) {
            summaryMethod.textContent = selectedMethod === 'phone'
                ? '📞 Rozmowa telefoniczna'
                : '🎥 Video rozmowa';
        }

        if (summaryBox) {
            summaryBox.classList.add('ready');
        }

        if (submitBtn) {
            submitBtn.disabled = false;
        }
    } else {
        if (summaryBox) {
            summaryBox.classList.remove('ready');
        }
        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }
}

function handleDesktopScheduleSubmit(e) {
    e.preventDefault();

    const { selectedDate, selectedTime, selectedMethod, existingMeetingId } = desktopSchedulerState;

    if (!selectedDate || !selectedTime) {
        showToast('Wybierz datę i godzinę', 'error');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const isUpdate = !!existingMeetingId;

    const meeting = {
        id: isUpdate ? existingMeetingId : generateMeetingId(),
        date: selectedDate,
        time: selectedTime,
        method: selectedMethod,
        partnerName: urlParams.get('n') || 'Partner',
        partnerPhone: urlParams.get('p') || '',
        partnerEmail: urlParams.get('e') || '',
        inviterKey: urlParams.get('z') || '',
        inviterName: AppState.landingParams.inviterName || urlParams.get('z') || 'Nieznany',
        invitationId: AppState.landingParams.invitationId,
        scheduledAt: new Date().toISOString()
    };

    let meetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');

    if (isUpdate) {
        // Update existing meeting - remove old one and add updated
        meetings = meetings.filter(m => m.id !== existingMeetingId);
    }

    meetings.push(meeting);
    localStorage.setItem('scheduledMeetings', JSON.stringify(meetings));

    // Zapisz do Supabase
    saveMeetingToSupabase(meeting);

    // Update invitation status
    if (AppState.landingParams.invitationId) {
        updateInvitationStatus(AppState.landingParams.invitationId, 'registered');
    }

    // Aktualizuj statystyki partnera (tylko dla nowych spotkań)
    const partnerPhone = urlParams.get('p') || '';
    if (!isUpdate && partnerPhone && typeof findPartnerByPhone === 'function') {
        const inviterKey = urlParams.get('z') || '';
        findPartnerByPhone(partnerPhone, inviterKey).then(partner => {
            if (partner && typeof updatePartnerMeetingsCount === 'function') {
                updatePartnerMeetingsCount(partner.id, 1);
            }
        }).catch(err => console.error('Error updating partner stats:', err));
    }

    // Show success modal
    const date = new Date(selectedDate);
    const formattedDate = `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} o ${selectedTime}`;

    const modalDateTime = document.getElementById('modalDateTime');
    const modalMethodIcon = document.getElementById('modalMethodIcon');
    const modalMethodText = document.getElementById('modalMethodText');

    if (modalDateTime) modalDateTime.textContent = formattedDate;
    if (modalMethodIcon) modalMethodIcon.textContent = selectedMethod === 'phone' ? '📞' : '🎥';
    if (modalMethodText) modalMethodText.textContent = selectedMethod === 'phone'
        ? 'Rozmowa telefoniczna'
        : 'Video rozmowa';

    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.style.display = 'flex';
    }

    // Update UI to show confirmed state
    updateMeetingConfirmedUI(meeting);

    showToast(isUpdate ? 'Termin spotkania zmieniony!' : 'Spotkanie umówione!', 'success');
}

function initDesktopApp() {
    console.log('initDesktopApp called');
    initDesktopCalculator();
    initDesktopScheduler();

    // Check for existing meeting and update UI
    updateMeetingConfirmedUI();

    console.log('initDesktopApp completed');
}
