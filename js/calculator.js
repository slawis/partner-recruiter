/* ========================================
   PARTNER RECRUITER - CALCULATOR
   Kalkulator prowizji, projekcje
   ======================================== */

// ============ CALCULATOR INITIALIZATION ============
function initCalculator() {
    const clientsSlider = document.getElementById('calcClients');
    const valueSlider = document.getElementById('calcValue');
    const tierSlider = document.getElementById('calcTier');
    const tierSelector = document.getElementById('tierSelector');
    const tierInfoBar = document.getElementById('tierInfoBar');

    // Exit if required elements don't exist
    if (!clientsSlider || !valueSlider || !tierSlider) return;

    // Tier info mapping
    const tierInfo = {
        10: { name: 'Start', req: 'Każdy nowy partner' },
        15: { name: 'Brązowy', req: '3+ klientów' },
        20: { name: 'Srebrny', req: '10+ klientów' },
        25: { name: 'Złoty', req: '25+ klientów' },
        35: { name: 'Platynowy', req: '50+ klientów' }
    };

    // Update slider progress color
    function updateSliderProgress(slider) {
        if (!slider) return;
        const min = parseFloat(slider.min) || 0;
        const max = parseFloat(slider.max) || 100;
        const val = parseFloat(slider.value) || 0;
        const percent = ((val - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(to right, #667eea 0%, #667eea ${percent}%, #e2e8f0 ${percent}%, #e2e8f0 100%)`;
    }

    function updateCalculator() {
        const clients = parseInt(clientsSlider.value) || 0;
        const avgValue = parseInt(valueSlider.value) || 0;
        const tierPercent = parseInt(tierSlider.value) || 20;

        // Update slider progress
        updateSliderProgress(clientsSlider);
        updateSliderProgress(valueSlider);

        // Update display values
        const calcClientsValueEl = document.getElementById('calcClientsValue');
        const calcValueDisplayEl = document.getElementById('calcValueDisplay');
        if (calcClientsValueEl) calcClientsValueEl.textContent = clients;
        if (calcValueDisplayEl) calcValueDisplayEl.textContent = avgValue.toLocaleString('pl-PL');

        // Update tier value display if exists (legacy)
        const tierValueEl = document.getElementById('calcTierValue');
        if (tierValueEl) tierValueEl.textContent = tierPercent;

        // Calculate earnings
        const monthlyCommission = clients * avgValue * (tierPercent / 100);
        const quarterlyCommission = monthlyCommission * 3;
        const yearlyCommission = monthlyCommission * 12;

        // Update results
        const resultMonthlyEl = document.getElementById('resultMonthly');
        const resultQuarterlyEl = document.getElementById('resultQuarterly');
        const resultYearlyEl = document.getElementById('resultYearly');
        if (resultMonthlyEl) resultMonthlyEl.textContent = formatCurrency(monthlyCommission);
        if (resultQuarterlyEl) resultQuarterlyEl.textContent = formatCurrency(quarterlyCommission);
        if (resultYearlyEl) resultYearlyEl.textContent = formatCurrency(yearlyCommission);

        // Update tier info bar
        if (tierInfoBar && tierInfo[tierPercent]) {
            const info = tierInfo[tierPercent];
            tierInfoBar.innerHTML = `<span class="tier-info-text"><strong>${info.name}</strong> — ${info.req}</span>`;
        }

        // Update projection chart
        updateProjectionChart(clients, avgValue, tierPercent);
    }

    // Tier button click handler
    if (tierSelector) {
        const tierBtns = tierSelector.querySelectorAll('.tier-btn');
        tierBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active from all
                tierBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                this.classList.add('active');
                // Update hidden input
                const tierValue = this.getAttribute('data-tier');
                tierSlider.value = tierValue;
                // Recalculate
                updateCalculator();
            });
        });
    }

    clientsSlider.addEventListener('input', updateCalculator);
    valueSlider.addEventListener('input', updateCalculator);

    // Legacy: if tierSlider is a range input, listen to it
    if (tierSlider && tierSlider.type === 'range') {
        tierSlider.addEventListener('input', updateCalculator);
    }

    // Initial calculation
    updateCalculator();

    // Initialize projection chart toggles
    initProjectionToggles();
}

// ============ PROJECTION CHART ============
function initProjectionToggles() {
    const growthToggle = document.getElementById('includeGrowth');
    const tierToggle = document.getElementById('includeTierProgression');

    if (growthToggle) {
        growthToggle.addEventListener('change', triggerProjectionUpdate);
    }
    if (tierToggle) {
        tierToggle.addEventListener('change', triggerProjectionUpdate);
    }
}

function triggerProjectionUpdate() {
    const clientsSlider = document.getElementById('calcClients');
    const valueSlider = document.getElementById('calcValue');
    const tierSlider = document.getElementById('calcTier');

    if (clientsSlider && valueSlider && tierSlider) {
        const clients = parseInt(clientsSlider.value);
        const avgValue = parseInt(valueSlider.value);
        const tierPercent = parseInt(tierSlider.value);
        updateProjectionChart(clients, avgValue, tierPercent);
    }
}

function updateProjectionChart(baseClients, avgValue, baseTier) {
    const includeGrowth = document.getElementById('includeGrowth')?.checked ?? true;
    const includeTierProgression = document.getElementById('includeTierProgression')?.checked ?? true;

    // Tier progression thresholds (total clients needed for tier upgrade)
    const tierThresholds = [
        { clients: 0, tier: 10 },
        { clients: 3, tier: 15 },
        { clients: 10, tier: 20 },
        { clients: 25, tier: 25 },
        { clients: 50, tier: 35 }
    ];

    function getTierForTotalClients(totalClients, baseTier) {
        if (!includeTierProgression) return baseTier;

        let tier = baseTier;
        for (const threshold of tierThresholds) {
            if (totalClients >= threshold.clients && threshold.tier > tier) {
                tier = threshold.tier;
            }
        }
        return Math.min(tier, 35); // Cap at 35%
    }

    // Calculate projections for each year
    let projections = [];
    let cumulativeClients = 0;
    let cumulativeEarnings = 0;

    for (let year = 1; year <= 5; year++) {
        // Client growth: +2 clients per year if growth is enabled
        const clientsThisYear = includeGrowth
            ? baseClients + (year - 1) * 2
            : baseClients;

        const yearlyClients = clientsThisYear * 12;
        cumulativeClients += yearlyClients;

        // Get tier based on cumulative clients
        const currentTier = getTierForTotalClients(cumulativeClients, baseTier);

        // Calculate yearly earnings
        const monthlyEarnings = clientsThisYear * avgValue * (currentTier / 100);
        const yearlyEarnings = monthlyEarnings * 12;
        cumulativeEarnings += yearlyEarnings;

        projections.push({
            year,
            clientsPerMonth: clientsThisYear,
            yearlyClients,
            cumulativeClients,
            tier: currentTier,
            monthlyEarnings,
            yearlyEarnings,
            cumulativeEarnings
        });
    }

    // Get data for years 1, 2, 5
    const year1 = projections[0];
    const year2 = projections[1];
    const year5 = projections[4];

    // Calculate max value for chart scaling
    const maxValue = year5.cumulativeEarnings;

    // Update chart bars
    updateChartBar(1, year1.cumulativeEarnings, maxValue, year1.cumulativeClients);
    updateChartBar(2, year2.cumulativeEarnings, maxValue, year2.cumulativeClients, year1.cumulativeEarnings);
    updateChartBar(5, year5.cumulativeEarnings, maxValue, year5.cumulativeClients, year1.cumulativeEarnings);

    // Update Y-axis labels
    updateYAxis(maxValue);

    // Update breakdown cards
    updateBreakdownCard(1, year1);
    updateBreakdownCard(2, year2, year1.cumulativeEarnings);
    updateBreakdownCard(5, year5, projections[3].cumulativeEarnings);

    // Update summary stats (with null checks)
    const summaryTotal = document.getElementById('summaryTotal5Year');
    const summaryAvg = document.getElementById('summaryAvgMonthly');
    const summaryClients = document.getElementById('summaryTotalClients');

    if (summaryTotal) summaryTotal.textContent = formatCurrency(year5.cumulativeEarnings);
    if (summaryAvg) summaryAvg.textContent = formatCurrency(year5.cumulativeEarnings / 60);
    if (summaryClients) summaryClients.textContent = year5.cumulativeClients.toLocaleString('pl-PL');
}

function updateChartBar(year, cumulativeValue, maxValue, totalClients, previousValue = 0) {
    const barFill = document.getElementById(`bar${year}Year`);
    const barAmount = document.getElementById(`projection${year}Year`);
    const barGrowth = document.getElementById(`growth${year}Year`);
    const barClients = document.getElementById(`clients${year}Year`);

    if (!barFill || !barAmount) return;

    // Calculate height percentage (min 10% for visibility)
    const heightPercent = Math.max(10, (cumulativeValue / maxValue) * 100);
    barFill.style.height = `${heightPercent}%`;

    // Update amount
    barAmount.textContent = formatCurrencyShort(cumulativeValue);

    // Update growth percentage
    if (barGrowth && previousValue > 0) {
        const growthPercent = Math.round(((cumulativeValue - previousValue) / previousValue) * 100);
        barGrowth.textContent = `+${growthPercent}%`;
        barGrowth.style.display = 'inline-block';
    } else if (barGrowth) {
        barGrowth.style.display = 'none';
    }

    // Update clients count
    if (barClients) {
        barClients.textContent = `${totalClients} klientów`;
    }
}

function updateYAxis(maxValue) {
    const yMax = document.getElementById('yMax');
    const yMid = document.getElementById('yMid');
    const yMin = document.getElementById('yMin');

    if (yMax) yMax.textContent = formatCurrencyShort(maxValue);
    if (yMid) yMid.textContent = formatCurrencyShort(maxValue / 2);
    if (yMin) yMin.textContent = '0';
}

function updateBreakdownCard(year, data, previousCumulative = 0) {
    const clientsEl = document.getElementById(`breakdown${year}Clients`);
    const commissionEl = document.getElementById(`breakdown${year}Commission`);
    const monthlyEl = document.getElementById(`breakdown${year}Monthly`);
    const totalEl = document.getElementById(`breakdown${year}Total`);

    if (clientsEl) clientsEl.textContent = data.clientsPerMonth;
    if (commissionEl) commissionEl.textContent = `${data.tier}%`;
    if (monthlyEl) monthlyEl.textContent = formatCurrency(data.monthlyEarnings);
    if (totalEl) totalEl.textContent = formatCurrency(data.cumulativeEarnings);
}

// ============ MOBILE CALCULATOR ============
function initMobileCalculator() {
    const clientsSlider = document.getElementById('calcClients');
    const valueSlider = document.getElementById('calcValue');
    const tierSlider = document.getElementById('calcTier');

    if (!clientsSlider || !valueSlider || !tierSlider) return;

    function updateRangeBackground(slider) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const val = parseFloat(slider.value);
        const percentage = ((val - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percentage}%, var(--border-light) ${percentage}%)`;
    }

    [clientsSlider, valueSlider, tierSlider].forEach(slider => {
        slider.addEventListener('input', () => updateRangeBackground(slider));
        updateRangeBackground(slider);
    });
}

// ============ DESKTOP CALCULATOR ============
function initDesktopCalculator() {
    console.log('initDesktopCalculator called');

    const clientsSlider = document.getElementById('desktopCalcClients');
    const valueSlider = document.getElementById('desktopCalcValue');
    const tierInput = document.getElementById('desktopCalcTier');
    const tierSelector = document.getElementById('desktopTierSelector');

    if (!clientsSlider || !valueSlider || !tierInput) {
        console.log('Desktop calculator elements not found, skipping init');
        return;
    }

    const clientsValue = document.getElementById('desktopCalcClientsValue');
    const valueDisplay = document.getElementById('desktopCalcValueDisplay');
    const resultMonthly = document.getElementById('desktopResultMonthly');
    const resultQuarterly = document.getElementById('desktopResultQuarterly');
    const resultYearly = document.getElementById('desktopResultYearly');

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function updateRangeBackground(slider) {
        if (!slider) return;
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const val = parseFloat(slider.value);
        const percentage = ((val - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(to right, #667eea 0%, #667eea ${percentage}%, #e2e8f0 ${percentage}%)`;
    }

    function calculateResults() {
        const clients = parseInt(clientsSlider.value);
        const value = parseInt(valueSlider.value);
        const tier = parseInt(tierInput.value);

        if (clientsValue) clientsValue.textContent = clients;
        if (valueDisplay) valueDisplay.textContent = formatNumber(value);

        // Update slider backgrounds
        updateRangeBackground(clientsSlider);
        updateRangeBackground(valueSlider);

        const monthly = Math.round(clients * value * (tier / 100));
        const quarterly = monthly * 3;
        const yearly = monthly * 12;

        if (resultMonthly) resultMonthly.textContent = formatNumber(monthly) + ' zł';
        if (resultQuarterly) resultQuarterly.textContent = formatNumber(quarterly) + ' zł';
        if (resultYearly) resultYearly.textContent = formatNumber(yearly) + ' zł';
    }

    // Tier buttons handler
    if (tierSelector) {
        const tierBtns = tierSelector.querySelectorAll('.tier-btn-desktop');
        tierBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active from all
                tierBtns.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                this.classList.add('active');
                // Update hidden input
                const tierValue = this.getAttribute('data-tier');
                tierInput.value = tierValue;
                // Recalculate
                calculateResults();
            });
        });
    }

    // Slider event listeners
    clientsSlider.addEventListener('input', calculateResults);
    valueSlider.addEventListener('input', calculateResults);

    // Initial calculation
    calculateResults();
    console.log('initDesktopCalculator completed');
}
