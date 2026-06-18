document.addEventListener("DOMContentLoaded", function() {
  

  const defaultManifest = {
    "CRG-111": { status: "In Transit", location: "Frankfurt, Germany", delivery: "June 20, 2026", step: 3, style: "#d39e00" },
    "CRG-222": { status: "Delivered Successfully", location: "Lekki Phase 1, Lagos", delivery: "Completed", step: 6, style: "#28a745" },
    "CRG-333": { status: "Customs Hold Notification", location: "London Heathrow Airport", delivery: "Delayed pending clearance", step: 4, style: "#dc3545" }
  };


  function getLiveDatabase() {
    const savedData = localStorage.getItem("crestingActiveDatabase");
    if (!savedData) {
      localStorage.setItem("crestingActiveDatabase", JSON.stringify(defaultManifest));
      return defaultManifest;
    }
    return JSON.parse(savedData);
  }

  function saveDatabaseToCloudSync(db) {
    localStorage.setItem("crestingActiveDatabase", JSON.stringify(db));
    renderManifestTable();
  }


  const tableBody = document.getElementById("manifest-table-body");
  const totalMetric = document.getElementById("metric-total");
  const holdsMetric = document.getElementById("metric-holds");
  const resetBtn = document.getElementById("reset-db-btn");

  function renderManifestTable() {
    const currentDb = getLiveDatabase();
    if (!tableBody) return;
    
    tableBody.innerHTML = "";
    let totalCount = 0;
    let holdCount = 0;

    Object.keys(currentDb).forEach(waybill => {
      totalCount++;
      const packageObj = currentDb[waybill];
      if (packageObj.step === 4) holdCount++; 

      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid var(--border-color)";
      
      tr.innerHTML = `
        <td style="padding: 16px 8px;"><strong>${waybill}</strong></td>
        <td style="padding: 16px 8px;"><input type="text" value="${packageObj.location}" data-id="${waybill}" class="admin-table-input geo-input" style="width:90%; padding:6px; border:1px solid var(--input-border); border-radius:4px; background:var(--input-bg); color:var(--text-main);"></td>
        <td style="padding: 16px 8px;"><input type="text" value="${packageObj.delivery}" data-id="${waybill}" class="admin-table-input eta-input" style="width:90%; padding:6px; border:1px solid var(--input-border); border-radius:4px; background:var(--input-bg); color:var(--text-main);"></td>
        <td style="padding: 16px 8px;">
          <select data-id="${waybill}" class="admin-table-select status-select" style="padding:6px; border:1px solid var(--input-border); border-radius:4px; background:var(--input-bg); color:var(--text-main);">
            <option value="1" ${packageObj.step === 1 ? 'selected' : ''}>1. Picked Up</option>
            <option value="2" ${packageObj.step === 2 ? 'selected' : ''}>2. Departed Origin Port</option>
            <option value="3" ${packageObj.step === 3 ? 'selected' : ''}>3. In Transit Logistics Facility</option>
            <option value="4" ${packageObj.step === 4 ? 'selected' : ''}>4. Customs Hold Notification</option>
            <option value="5" ${packageObj.step === 5 ? 'selected' : ''}>5. Out for Delivery</option>
            <option value="6" ${packageObj.step === 6 ? 'selected' : ''}>6. Delivered Successfully</option>
          </select>
        </td>
        <td style="padding: 16px 8px; text-align: right;">
          <button class="submit-btn save-row-btn" data-id="${waybill}" style="padding: 6px 12px; font-size: 0.8rem; width:auto; display:inline-block;"><i class="fas fa-floppy-disk"></i> Update</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    if (totalMetric) totalMetric.innerText = totalCount;
    if (holdsMetric) holdsMetric.innerText = holdCount;


    document.querySelectorAll(".save-row-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        const targetId = this.getAttribute("data-id");
        const row = this.closest("tr");
        
        const newLocation = row.querySelector(".geo-input").value;
        const newEta = row.querySelector(".eta-input").value;
        const selectNode = row.querySelector(".status-select");
        const newStep = parseInt(selectNode.value);
        const newStatusText = selectNode.options[selectNode.selectedIndex].text.substring(3); // Drops numerical step formatting label prefix

        let activeColor = "#d39e00"; // 
        if (newStep === 6) activeColor = "#28a745"; 
        if (newStep === 4) activeColor = "#dc3545"; 

        const currentDbState = getLiveDatabase();
        currentDbState[targetId] = {
          status: newStatusText,
          location: newLocation,
          delivery: newEta,
          step: newStep,
          style: activeColor
        };

        saveDatabaseToCloudSync(currentDbState);
        

        this.innerHTML = `<i class="fas fa-check"></i> Saved`;
        this.style.background = "#28a745";
        setTimeout(() => {
          this.innerHTML = `<i class="fas fa-floppy-disk"></i> Update`;
          this.style.background = "#0077cc";
        }, 1000);
      });
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if(confirm("Are you sure you want to restore default demo manifest statuses?")) {
        saveDatabaseToCloudSync(defaultManifest);
      }
    });
  }

  renderManifestTable();
});