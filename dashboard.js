// ===================================
// Dashboard Page
// Campus Community Energy Data
// ===================================

let realtimeChart = null;

function initDashboard() {
  // Create real-time chart
  realtimeChart = window.chartManager.createRealTimeChart('realtime-chart', 20);
  
  // Initial update
  updateDashboard();
  
  // Update real-time chart every 3 seconds
  setInterval(() => {
    const totalConsumption = window.energyData.getTotalConsumption();
    const now = new Date();
    const timeLabel = now.getHours().toString().padStart(2, '0') + ':' + 
                     now.getMinutes().toString().padStart(2, '0') + ':' +
                     now.getSeconds().toString().padStart(2, '0');
    
    if (realtimeChart) {
      realtimeChart.addDataPoint(timeLabel, totalConsumption);
    }
  }, 3000);
}

function updateDashboard() {
  updateSummaryStats();
  updateHouseCards();
}

function updateSummaryStats() {
  const totalConsumption = window.energyData.getTotalConsumption();
  const solarData = window.energyData.solarData;
  
  // Update stats
  document.getElementById('total-consumption').textContent = totalConsumption.toFixed(2) + ' kW';
  document.getElementById('total-houses').textContent = window.energyData.houses.length;
  document.getElementById('solar-production').textContent = solarData.currentProduction.toFixed(2) + ' kW';
  document.getElementById('battery-level').textContent = solarData.batteryLevel.toFixed(1) + '%';
}

function updateHouseCards() {
  const container = document.getElementById('house-cards-container');
  container.innerHTML = '';
  
  window.energyData.houses.forEach(house => {
    const status = window.energyData.getConsumptionStatus(house.currentConsumption);
    
    const card = document.createElement('div');
    card.className = 'house-card';
    card.innerHTML = `
      <div class="house-header">
        <div class="house-name">${house.name}</div>
        <div class="house-status ${status}"></div>
      </div>
      <div class="house-consumption">${house.currentConsumption.toFixed(2)} kW</div>
      <div class="house-details">
        <span><i class="fas fa-users"></i> ${house.residents} people</span>
        <span><i class="fas fa-calendar-day"></i> ${house.dailyConsumption.toFixed(1)} kWh/day</span>
      </div>
      ${house.solarPanels > 0 ? `
        <div class="mt-2">
          <span class="badge badge-success">
            <i class="fas fa-solar-panel"></i> ${house.solarPanels} panels
          </span>
        </div>
      ` : ''}
    `;
    
    card.addEventListener('click', () => {
      showHouseDetails(house.id);
    });
    
    container.appendChild(card);
  });
}

function showHouseDetails(houseId) {
  const house = window.energyData.getHouse(houseId);
  if (!house) return;
  
  // Create modal if it doesn't exist
  let modal = document.getElementById('house-details-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'house-details-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-house-name">House Details</h3>
          <button class="modal-close" onclick="closeHouseModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" id="modal-house-content">
          <!-- Content will be inserted here -->
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="closeHouseModal()">
            <i class="fas fa-check"></i>
            OK
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeHouseModal();
      }
    });
  }
  
  // Update modal content
  document.getElementById('modal-house-name').textContent = house.name;
  
  const appliancesHtml = house.appliances.map(a => `
    <tr>
      <td>${a.name}</td>
      <td>${a.power.toFixed(2)} kW</td>
      <td>
        ${a.isOn ? 
          '<span class="badge badge-success"><i class="fas fa-power-off"></i> On</span>' : 
          '<span class="badge badge-info"><i class="fas fa-power-off"></i> Off</span>'
        }
      </td>
    </tr>
  `).join('');
  
  document.getElementById('modal-house-content').innerHTML = `
    <div class="grid grid-2 gap-3 mb-3">
      <div class="stat-card">
        <div class="stat-label">Current Usage</div>
        <div class="stat-value" style="font-size: 2rem;">${house.currentConsumption.toFixed(2)} kW</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Daily Usage</div>
        <div class="stat-value" style="font-size: 2rem;">${house.dailyConsumption.toFixed(1)} kWh</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Monthly Usage</div>
        <div class="stat-value" style="font-size: 2rem;">${house.monthlyConsumption.toFixed(0)} kWh</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Residents</div>
        <div class="stat-value" style="font-size: 2rem;">${house.residents} people</div>
      </div>
    </div>
    
    ${house.solarPanels > 0 ? `
      <div class="alert alert-success mb-3">
        <i class="fas fa-solar-panel"></i>
        <div>
          <strong>Solar Panels:</strong> ${house.solarPanels} panels<br>
          <strong>Battery:</strong> ${house.batteryCapacity} kWh
        </div>
      </div>
    ` : ''}
    
    <h4 style="margin: 1.5rem 0 1rem 0; color: var(--text-primary);">
      <i class="fas fa-plug"></i> Appliances
    </h4>
    <table class="table">
      <thead>
        <tr>
          <th>Appliance</th>
          <th>Power</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${appliancesHtml}
      </tbody>
    </table>
  `;
  
  // Show modal
  modal.classList.add('active');
}

function closeHouseModal() {
  const modal = document.getElementById('house-details-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}
