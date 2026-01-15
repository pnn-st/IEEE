// ===================================
// EV Management Page
// Campus Community Energy Data
// ===================================

let evStatusChart = null;
let evConsumptionChart = null;

function initEVManagement() {
  // Create charts
  createEVCharts();
  
  // Initial update
  updateEVManagement();
}

function updateEVManagement() {
  // Update stats
  updateEVStats();
  
  // Update EV list
  updateEVList();
  
  // Update charts
  if (evStatusChart) {
    updateEVStatusChart();
  }
  if (evConsumptionChart) {
    updateEVConsumptionChart();
  }
}

function updateEVStats() {
  const evData = window.energyData.evData;
  const chargingEVs = evData.filter(ev => ev.isCharging);
  const totalPower = chargingEVs.reduce((sum, ev) => sum + ev.chargingPower, 0);
  
  // Estimate daily cost (assuming 4 THB per kWh)
  const dailyCost = totalPower * 24 * 4;
  
  document.getElementById('total-evs').textContent = evData.length;
  document.getElementById('charging-evs').textContent = chargingEVs.length;
  document.getElementById('ev-power-consumption').textContent = totalPower.toFixed(2) + ' kW';
  document.getElementById('ev-daily-cost').textContent = dailyCost.toFixed(0) + ' ฿';
}

function updateEVList() {
  const container = document.getElementById('ev-list');
  container.innerHTML = '';
  
  window.energyData.evData.forEach(ev => {
    const house = window.energyData.getHouse(ev.houseId);
    
    const evCard = document.createElement('div');
    evCard.className = 'card mb-3';
    evCard.style.background = ev.isCharging ? 
      'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(30, 35, 60, 0.7) 100%)' : 
      'var(--card-bg)';
    
    evCard.innerHTML = `
      <div class="card-body">
        <div class="grid grid-4 gap-3">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <i class="fas fa-car" style="font-size: 1.5rem; color: var(--primary-accent);"></i>
              <div>
                <div style="font-weight: 600; font-size: 1.1rem;">${ev.model}</div>
                <div style="color: var(--text-muted); font-size: 0.85rem;">${house ? house.name : 'N/A'}</div>
              </div>
            </div>
          </div>
          
          <div>
            <div class="stat-label">Status</div>
            <div style="margin-top: 0.25rem;">
              ${ev.isCharging ? 
                '<span class="badge badge-success"><i class="fas fa-charging-station"></i> Charging</span>' :
                '<span class="badge badge-info"><i class="fas fa-pause"></i> Not Charging</span>'
              }
            </div>
          </div>
          
          <div>
            <div class="stat-label">Battery Level</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: ${ev.currentCharge > 80 ? 'var(--success)' : ev.currentCharge > 50 ? 'var(--warning)' : 'var(--danger)'};">
              ${ev.currentCharge.toFixed(1)}%
            </div>
            <div class="progress-bar mt-1">
              <div class="progress-fill" style="width: ${ev.currentCharge}%; background: ${ev.currentCharge > 80 ? 'var(--success)' : ev.currentCharge > 50 ? 'var(--warning)' : 'var(--danger)'};"></div>
            </div>
          </div>
          
          <div>
            <div class="stat-label">${ev.isCharging ? 'Time Remaining' : 'Battery Capacity'}</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-accent);">
              ${ev.isCharging ? ev.estimatedTimeToFull + ' hrs' : ev.batteryCapacity + ' kWh'}
            </div>
            ${ev.isCharging ? 
              `<div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">
                <i class="fas fa-bolt"></i> ${ev.chargingPower.toFixed(1)} kW
              </div>` : ''
            }
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(evCard);
  });
}

function createEVCharts() {
  // EV Status Chart (Pie)
  const chargingCount = window.energyData.evData.filter(ev => ev.isCharging).length;
  const notChargingCount = window.energyData.evData.length - chargingCount;
  
  const statusData = {
    labels: ['Charging', 'Not Charging'],
    datasets: [{
      data: [chargingCount, notChargingCount],
      backgroundColor: ['#10b981', '#3b82f6'],
      borderWidth: 2,
      borderColor: '#1e233c'
    }]
  };
  
  evStatusChart = window.chartManager.createPieChart('ev-status-chart', statusData, {
    type: 'doughnut'
  });
  
  // EV Consumption Chart (Bar - simulated daily data)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const consumptionData = days.map(() => window.energyData.randomInRange(50, 150));
  
  const consData = {
    labels: days,
    datasets: [{
      label: 'Energy Consumption (kWh)',
      data: consumptionData,
      backgroundColor: 'rgba(124, 58, 237, 0.6)',
      borderColor: '#7c3aed',
      borderWidth: 2
    }]
  };
  
  evConsumptionChart = window.chartManager.createBarChart('ev-consumption-chart', consData);
}

function updateEVStatusChart() {
  const chargingCount = window.energyData.evData.filter(ev => ev.isCharging).length;
  const notChargingCount = window.energyData.evData.length - chargingCount;
  
  const newData = {
    labels: ['Charging', 'Not Charging'],
    datasets: [{
      data: [chargingCount, notChargingCount],
      backgroundColor: ['#10b981', '#3b82f6'],
      borderWidth: 2,
      borderColor: '#1e233c'
    }]
  };
  
  window.chartManager.updateChart('ev-status-chart', newData);
}

function updateEVConsumptionChart() {
  // Keep the same data for now (in real app, this would update with actual data)
  // This is just for demonstration
}
