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
    
    // Get cost comparison data
    const currentCost = window.energyData.calculateCurrentMonthlyCost(house.id);
    const savingsData = window.energyData.calculatePotentialSavings(house.id);
    
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
      
      ${savingsData.hasSolar ? `
        <!-- Houses WITH solar: Show before/after costs -->
        <div class="cost-comparison mt-2">
          <div style="padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border-left: 3px solid var(--success);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <div>
                <div style="font-size: 0.7rem; color: var(--text-muted);">ค่าไฟก่อนหักโซล่า</div>
                <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-muted); text-decoration: line-through;">
                  ${currentCost.toFixed(0)} ฿
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.7rem; color: var(--success);">ค่าไฟหลังหักโซล่า</div>
                <div style="font-size: 1.2rem; font-weight: 700; color: var(--success);">
                  ${savingsData.cost.toFixed(0)} ฿
                </div>
              </div>
            </div>
            <div style="text-align: center; padding-top: 0.5rem; border-top: 1px solid rgba(16, 185, 129, 0.2);">
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--success);">
                <i class="fas fa-arrow-down"></i> ประหยัด ${savingsData.savings.toFixed(0)} ฿/เดือน (${window.energyData.getSolarSavingsPercentage(house.id)}%)
              </div>
            </div>
          </div>
        </div>
      ` : `
        <!-- Houses WITHOUT solar: Show monthly cost only -->
        <div class="cost-comparison mt-2">
          <div style="padding: 0.75rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 3px solid var(--primary-accent);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                ค่าไฟรายเดือน
              </div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--primary-accent);">
                ${currentCost.toFixed(0)} ฿
              </div>
            </div>
          </div>
        </div>
      `}
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
  
  // Get cost comparison data
  const currentCost = window.energyData.calculateCurrentMonthlyCost(house.id);
  const savingsData = window.energyData.calculatePotentialSavings(house.id);
  const savingsPercentage = window.energyData.getSolarSavingsPercentage(house.id);
  
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
    
    <!-- Cost Comparison Section -->
    <div class="card mb-3" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(30, 35, 60, 0.5) 100%); border: 1px solid rgba(16, 185, 129, 0.3);">
      <div class="card-header" style="border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
        <h4 style="margin: 0; color: var(--text-primary); font-size: 1.1rem;">
          <i class="fas fa-chart-line" style="color: var(--success);"></i>
          ${savingsData.hasSolar ? 'Monthly Cost Comparison' : 'Potential Cost Savings with Solar'}
        </h4>
      </div>
      <div class="card-body">
        <div class="grid grid-2 gap-3 mb-3">
          <div style="text-align: center; padding: 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3);">
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
              <i class="fas fa-bolt"></i> Current Cost (No Solar)
            </div>
            <div style="font-size: 2rem; font-weight: 700; color: #ef4444;">
              ${currentCost.toFixed(0)} ฿
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
              ${house.monthlyConsumption.toFixed(0)} kWh × 4 ฿/kWh
            </div>
          </div>
          
          <div style="text-align: center; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);">
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
              <i class="fas fa-solar-panel"></i> ${savingsData.hasSolar ? 'Cost with Solar' : 'Projected Cost with Solar'}
            </div>
            <div style="font-size: 2rem; font-weight: 700; color: var(--success);">
              ${savingsData.cost.toFixed(0)} ฿
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
              ${savingsData.hasSolar ? house.solarPanels : savingsData.recommendedPanels} panels producing ${savingsData.solarProduction.toFixed(0)} kWh/month
            </div>
          </div>
        </div>
        
        <div style="text-align: center; padding: 1.5rem; background: rgba(16, 185, 129, 0.15); border-radius: 8px; border: 2px solid var(--success);">
          <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">
            <i class="fas fa-piggy-bank"></i> ${savingsData.hasSolar ? 'Monthly Savings' : 'Potential Monthly Savings'}
          </div>
          <div style="font-size: 2.5rem; font-weight: 700; color: var(--success); margin-bottom: 0.5rem;">
            ${savingsData.savings.toFixed(0)} ฿
          </div>
          <div style="display: inline-block; padding: 0.5rem 1rem; background: var(--success); color: white; border-radius: 20px; font-weight: 600;">
            <i class="fas fa-arrow-down"></i> ${savingsPercentage}% reduction
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 1rem;">
            <i class="fas fa-calendar-alt"></i> Annual savings: <strong style="color: var(--success);">${(savingsData.savings * 12).toFixed(0)} ฿/year</strong>
          </div>
        </div>
        
        ${!savingsData.hasSolar ? `
          <div class="alert alert-info mt-3" style="margin-bottom: 0;">
            <i class="fas fa-lightbulb"></i>
            <div>
              <strong>Recommendation:</strong> Install ${savingsData.recommendedPanels} solar panels (${(savingsData.recommendedPanels * 0.4).toFixed(1)} kW system) to achieve these savings.
              <br><strong>Estimated Investment:</strong> ${((savingsData.recommendedPanels * 0.4) * 50000).toFixed(0)} ฿
              <br><strong>Payback Period:</strong> ~${(((savingsData.recommendedPanels * 0.4) * 50000) / (savingsData.savings * 12)).toFixed(1)} years
            </div>
          </div>
        ` : ''}
      </div>
    </div>
    
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
