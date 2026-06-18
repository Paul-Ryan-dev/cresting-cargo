function switchTab(event, serviceId) {
  const panels = document.querySelectorAll('.tab-panel');
  panels.forEach(panel => panel.classList.remove('active'));

  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(button => button.classList.remove('active'));

  const targetPanel = document.getElementById(serviceId);
  if (targetPanel) targetPanel.classList.add('active');
  
  if (event) {
    event.currentTarget.classList.add('active');
  } else {
    const backupButton = document.getElementById('btn-' + serviceId);
    if (backupButton) backupButton.classList.add('active');
  }
}

document.addEventListener("DOMContentLoaded", function() {
  
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const currentTheme = localStorage.getItem("crestingTheme") || "light";

  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeIcon(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const activeTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = activeTheme === "dark" ? "light" : "dark";
      
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("crestingTheme", newTheme);
      updateThemeIcon(newTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    themeToggleBtn.innerHTML = theme === "dark" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }

  const defaultManifestFallback = {
    "CRG-111": { status: "In Transit", location: "Frankfurt, Germany", delivery: "June 20, 2026", step: 3, style: "#d39e00" },
    "CRG-222": { status: "Delivered Successfully", location: "Lekki Phase 1, Lagos", delivery: "Completed", step: 6, style: "#28a745" },
    "CRG-333": { status: "Customs Hold Notification", location: "London Heathrow Airport", delivery: "Delayed pending clearance", step: 4, style: "#dc3545" }
  };

  async function fetchTrackingDataFromServer(trackingID) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const lookup = trackingID.trim().toUpperCase();
        const currentLiveDB = JSON.parse(localStorage.getItem("crestingActiveDatabase")) || defaultManifestFallback;
        resolve(currentLiveDB[lookup] || null);
      }, 1200);
    });
  }

  async function fetchLiveExchangeRates() {
    return new Promise((resolve) => {
      setTimeout(() => { resolve({ USD: 1.0, EUR: 0.92, NGN: 1500.0 }); }, 300);
    });
  }

  const trackingForm = document.getElementById("tracking-form");
  const trackingNumberInput = document.getElementById("tracking-number");
  const trackingErrorNode = document.getElementById("tracking-error-node");
  const trackingSubmitBtn = document.getElementById("tracking-submit-btn");
  const resultsContainer = document.getElementById("tracking-results");
  const timelineContainer = document.getElementById("app-timeline");
  const recentTracksContainer = document.getElementById("recent-tracks");

  let savedSearches = JSON.parse(localStorage.getItem("crestingSearches")) || [];

  function renderRecentSearchTags() {
    if (!recentTracksContainer) return;
    recentTracksContainer.innerHTML = "";
    savedSearches.forEach(num => {
      const btn = document.createElement("button");
      btn.className = "recent-tag";
      btn.innerText = escapeHTML(num);
      btn.type = "button";
      btn.addEventListener("click", () => {
        trackingNumberInput.value = num;
        clearTrackingError();
        handleTrackingFormAction(num);
      });
      recentTracksContainer.appendChild(btn);
    });
  }

  function clearTrackingError() {
    if (trackingNumberInput) trackingNumberInput.classList.remove("invalid-field");
    if (trackingErrorNode) trackingErrorNode.innerText = "";
  }

  function saveTrackingToMemory(num) {
    const standardizedNum = num.trim().toUpperCase();
    if (!savedSearches.includes(standardizedNum)) {
      savedSearches.unshift(standardizedNum);
      if (savedSearches.length > 3) savedSearches.pop();
      localStorage.setItem("crestingSearches", JSON.stringify(savedSearches));
      renderRecentSearchTags();
    }
  }

  async function handleTrackingFormAction(trackNum) {
    if (!trackingSubmitBtn) return;
    trackingSubmitBtn.disabled = true;
    trackingSubmitBtn.classList.add("loading");
    resultsContainer.style.display = "none";
    timelineContainer.style.display = "none";

    try {
      const record = await fetchTrackingDataFromServer(trackNum);
      
      trackingSubmitBtn.disabled = false;
      trackingSubmitBtn.classList.remove("loading");
      resultsContainer.style.display = "block";
      resultsContainer.classList.remove("tracking-err");

      if (record) {
        saveTrackingToMemory(trackNum);
        resultsContainer.innerHTML = `
          <h3>Shipment Status Matrix</h3>
          <p><strong>Waybill Target ID:</strong> ${escapeHTML(trackNum.toUpperCase())}</p>
          <p><strong>System Status:</strong> <span style="color:${record.style}; font-weight:bold;">${escapeHTML(record.status)}</span></p>
          <p><strong>Current Coordinates:</strong> ${escapeHTML(record.location)}</p>
          <p><strong>ETA Delivery Window:</strong> ${escapeHTML(record.delivery)}</p>
        `;

        timelineContainer.style.display = "block";
        for (let i = 1; i <= 6; i++) {
          const item = document.getElementById(`step-${i}`);
          if (item) {
            if (i < record.step) item.className = "completed";
            else if (i === record.step) item.className = "current";
            else item.className = "";
          }
        }
      } else {
        resultsContainer.classList.add("tracking-err");
        resultsContainer.innerHTML = `
          <h3 style="color:#dc3545;"><i class="fas fa-exclamation-triangle"></i> Waybill ID Unknown</h3>
          <p>Reference code <strong>"${escapeHTML(trackNum)}"</strong> matches no logs inside our registry.</p>
        `;
      }
    } catch (err) {
      trackingSubmitBtn.disabled = false;
      trackingSubmitBtn.classList.remove("loading");
    }
  }

  if (trackingForm) {
    trackingForm.addEventListener("submit", function(e) {
      e.preventDefault();
      clearTrackingError();
      const val = trackingNumberInput.value.trim();
      if (!val) {
        trackingNumberInput.classList.add("invalid-field");
        trackingErrorNode.innerText = "Tracking number reference code cannot be left blank.";
        return;
      }
      handleTrackingFormAction(val);
    });
    trackingNumberInput.addEventListener("input", clearTrackingError);
    renderRecentSearchTags();
  }

  const quoteForm = document.getElementById("cargo-quote-form");
  const weightInput = document.getElementById("weight");
  const lengthInput = document.getElementById("length");
  const widthInput = document.getElementById("width");
  const heightInput = document.getElementById("height");
  const methodSelect = document.getElementById("shipping-method");
  const currencySelect = document.getElementById("currency-select");
  const quoteSubmitBtn = document.getElementById("quote-submit-btn");

  const volWeightDisplay = document.getElementById("vol-weight-display");
  const billableWeightDisplay = document.getElementById("billable-weight-display");
  const costDisplay = document.getElementById("cost-display");

  const serviceRatesUSD = { air: 5.50, sea: 1.20, land: 2.50 };
  const currencySymbols = { USD: "$", EUR: "€", NGN: "₦" };
  let activeFetchedRates = { USD: 1.0, EUR: 0.92, NGN: 1500.0 };

  async function initExchangeRates() {
    try { activeFetchedRates = await fetchLiveExchangeRates(); } catch(e){}
    updateLiveReadout();
  }
  initExchangeRates();

  function validateCalculatorInputs() {
    let isValid = true;
    document.getElementById("weight-error").innerText = "";
    document.getElementById("dimensions-error").innerText = "";
    weightInput.classList.remove("invalid-field");
    [lengthInput, widthInput, heightInput].forEach(i => i.classList.remove("invalid-field"));

    const weightVal = parseFloat(weightInput.value);
    if (weightInput.value !== "" && (isNaN(weightVal) || weightVal <= 0 || weightVal > 75000)) {
      weightInput.classList.add("invalid-field");
      document.getElementById("weight-error").innerText = "Enter a valid mass load between 0.1 and 75,000 kg.";
      isValid = false;
    }

    const dims = [parseFloat(lengthInput.value), parseFloat(widthInput.value), parseFloat(heightInput.value)];
    const inputs = [lengthInput, widthInput, heightInput];
    let dimError = false;
    
    inputs.forEach((input, index) => {
      if (input.value !== "" && (isNaN(dims[index]) || dims[index] <= 0 || dims[index] > 1200)) {
        input.classList.add("invalid-field");
        dimError = true;
        isValid = false;
      }
    });

    if (dimError) document.getElementById("dimensions-error").innerText = "Dimensions must match valid standard bounds (1 - 1,200 cm).";
    return isValid;
  }

  function calculateCompleteLogisticsOutput() {
    const actualWeight = Math.max(0, parseFloat(weightInput.value) || 0);
    const length = Math.max(0, parseFloat(lengthInput.value) || 0);
    const width = Math.max(0, parseFloat(widthInput.value) || 0);
    const height = Math.max(0, parseFloat(heightInput.value) || 0);
    
    const selectedMethod = methodSelect ? methodSelect.value : "air";
    const targetCurrency = currencySelect ? currencySelect.value : "USD";

    const volumetricWeight = (length * width * height) / 5000;
    const billableWeight = Math.max(actualWeight, volumetricWeight);

    const baseRateUSD = serviceRatesUSD[selectedMethod];
    const totalCostUSD = billableWeight * baseRateUSD;
    const convertedCost = totalCostUSD * activeFetchedRates[targetCurrency];

    return {
      actualWeight, length, width, height,
      volumetricWeight, billableWeight,
      convertedCost, targetCurrency, selectedMethod
    };
  }

  function updateLiveReadout() {
    validateCalculatorInputs();
    const metrics = calculateCompleteLogisticsOutput();
    if (volWeightDisplay && billableWeightDisplay && costDisplay) {
      volWeightDisplay.textContent = metrics.volumetricWeight.toFixed(2);
      billableWeightDisplay.textContent = metrics.billableWeight.toFixed(2);
      costDisplay.textContent = `${currencySymbols[metrics.targetCurrency]}${metrics.convertedCost.toFixed(2)}`;
    }
  }

  if (weightInput && lengthInput && widthInput && heightInput && methodSelect && currencySelect) {
    [weightInput, lengthInput, widthInput, heightInput].forEach(el => el.addEventListener("input", updateLiveReadout));
    methodSelect.addEventListener("change", updateLiveReadout);
    currencySelect.addEventListener("change", updateLiveReadout);
  }

  const quoteModal = document.getElementById("quote-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const summaryContent = document.getElementById("modal-summary-content");
  const downloadPdfBtn = document.getElementById("download-pdf-btn");

  if (quoteForm && quoteModal && summaryContent) {
    quoteForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const isFormValid = validateCalculatorInputs();
      const originInput = document.getElementById("origin");
      const destinationInput = document.getElementById("destination");

      document.getElementById("origin-error").innerText = "";
      document.getElementById("destination-error").innerText = "";
      originInput.classList.remove("invalid-field");
      destinationInput.classList.remove("invalid-field");

      if (!originInput.value.trim()) {
        originInput.classList.add("invalid-field");
        document.getElementById("origin-error").innerText = "Origin shipping location is required.";
        return;
      }
      if (!destinationInput.value.trim()) {
        destinationInput.classList.add("invalid-field");
        document.getElementById("destination-error").innerText = "Destination delivery endpoint is required.";
        return;
      }

      if (!isFormValid) return;

      if (quoteSubmitBtn) {
        quoteSubmitBtn.disabled = true;
        quoteSubmitBtn.classList.add("loading");
      }

      setTimeout(() => {
        if (quoteSubmitBtn) {
          quoteSubmitBtn.disabled = false;
          quoteSubmitBtn.classList.remove("loading");
        }

        const origin = originInput.value;
        const destination = destinationInput.value;
        const metrics = calculateCompleteLogisticsOutput();
        const methodNames = { air: "Premium Air Cargo", sea: "Ocean Container Line", land: "Cross-Border Road Trucking" };

        summaryContent.innerHTML = `
          <table class="modal-data-table">
            <tr><td><strong>Logistics Route:</strong></td><td style="text-align: right;">${escapeHTML(origin)} <i class="fas fa-arrow-right" style="font-size:0.8rem; color:#0056b3;"></i> ${escapeHTML(destination)}</td></tr>
            <tr><td><strong>Carrier Service:</strong></td><td style="text-align: right; font-weight:600; color:#0056b3;">${escapeHTML(methodNames[metrics.selectedMethod])}</td></tr>
            <tr><td><strong>Scale True Weight:</strong></td><td style="text-align: right;">${metrics.actualWeight.toFixed(2)} kg</td></tr>
            <tr><td><strong>Physical Footprint:</strong></td><td style="text-align: right; color:#718096;">${metrics.length} × ${metrics.width} × ${metrics.height} cm</td></tr>
            <tr><td><strong>Calculated Volumetric:</strong></td><td style="text-align: right;">${metrics.volumetricWeight.toFixed(2)} kg</td></tr>
            <tr style="font-weight: 600;"><td>Chargeable Weight:</td><td style="text-align: right; color:#003d82;">${metrics.billableWeight.toFixed(2)} kg</td></tr>
            <tr style="font-size: 1.3rem; font-weight: bold; color: #28a745; border-top: 2px solid #28a745;">
              <td>Total Invoice Estimate:</td>
              <td style="text-align: right;">${currencySymbols[metrics.targetCurrency]}${metrics.convertedCost.toFixed(2)}</td>
            </tr>
          </table>
        `;
        quoteModal.classList.add("open");
      }, 1200);
    });
  }

  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", () => { window.print(); });
  }

  if (closeModalBtn && quoteModal) {
    closeModalBtn.addEventListener("click", () => quoteModal.classList.remove("open"));
    quoteModal.addEventListener("click", (e) => {
      if (e.target === quoteModal) quoteModal.classList.remove("open");
    });
  }
});