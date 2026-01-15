// ===================================
// Solar Control System Page
// Campus Community Energy Data
// ===================================

let distributionChart = null;

function initSolarControl() {
  // Create allocation sliders
  createAllocationSliders();
  
  // Populate house selector for blackout recommendations
  populateBlackoutSelector();
  
  // Create distribution chart
  createDistributionChart();
  
  // Initial update - make sure everything is displayed correctly
  updateSolarControl();
  
  // Update power values for all houses
  window.energyData.houses.forEach(house => {
    const power = window.energyData.getDistributedSolarPower(house.id);
    const powerElement = document.getElementById(`power-${house.id}`);
    if (powerElement) {
      powerElement.textContent = power + ' kW';
    }
  });
}

function updateSolarControl() {
  // Update solar stats
  const solarData = window.energyData.solarData;
  
  document.getElementById('central-solar-production').textContent = 
    solarData.currentProduction.toFixed(2) + ' kW';
  document.getElementById('central-battery-level').textContent = 
    solarData.batteryLevel.toFixed(1) + '%';
  document.getElementById('central-battery-progress').style.width = 
    solarData.batteryLevel + '%';
  
  // Update total allocation
  updateTotalAllocation();
  
  // Update distribution chart
  if (distributionChart) {
    updateDistributionChart();
  }
}

function createAllocationSliders() {
  const container = document.getElementById('allocation-sliders');
  container.innerHTML = '';
  
  // Add allocation summary at the top
  const summaryDiv = document.createElement('div');
  summaryDiv.className = 'allocation-summary warning';
  summaryDiv.id = 'allocation-summary';
  summaryDiv.innerHTML = `
    <div class="allocation-total" id="allocation-total-display">0%</div>
    <div class="allocation-status-text" id="allocation-status-text">
      <i class="fas fa-info-circle"></i>
      <span>Please distribute power to reach 100%</span>
    </div>
  `;
  container.appendChild(summaryDiv);
  
  window.energyData.houses.forEach(house => {
    const sliderDiv = document.createElement('div');
    sliderDiv.className = 'solar-slider-card';
    sliderDiv.id = `slider-card-${house.id}`;
    sliderDiv.innerHTML = `
      <div class="slider-header">
        <div class="slider-house-name">
          <i class="fas fa-home"></i>
          <span>${house.name}</span>
        </div>
        <div class="slider-value-display" id="allocation-${house.id}">${house.solarAllocation || 0}%</div>
      </div>
      <input type="range" 
             class="enhanced-slider allocation-slider" 
             id="slider-${house.id}"
             min="0" 
             max="100" 
             value="${house.solarAllocation || 0}"
             data-house-id="${house.id}">
      <div class="slider-power-info">
        <span><i class="fas fa-bolt"></i> Power Received</span>
        <span class="slider-power-value" id="power-${house.id}">0.00 kW</span>
      </div>
    `;
    
    container.appendChild(sliderDiv);
    
    // Add event listener with auto-lock functionality
    const slider = sliderDiv.querySelector('.allocation-slider');
    slider.addEventListener('input', (e) => {
      handleAllocationChangeWithLock(parseInt(e.target.dataset.houseId), parseInt(e.target.value));
    });
  });
  
  // Initial update
  updateAllSliderStates();
}

function handleAllocationChangeWithLock(houseId, requestedPercentage) {
  const currentTotal = window.energyData.getTotalSolarAllocation();
  const house = window.energyData.getHouse(houseId);
  const currentHouseAllocation = house.solarAllocation || 0;
  
  // Calculate what the new total would be
  const newTotal = currentTotal - currentHouseAllocation + requestedPercentage;
  
  // If new total would exceed 100%, cap it
  let finalPercentage = requestedPercentage;
  if (newTotal > 100) {
    finalPercentage = requestedPercentage - (newTotal - 100);
    finalPercentage = Math.max(0, finalPercentage);
  }
  
  // Update data
  window.energyData.updateSolarAllocation(houseId, finalPercentage);
  
  // Update display for this house
  document.getElementById(`slider-${houseId}`).value = finalPercentage;
  document.getElementById(`allocation-${houseId}`).textContent = finalPercentage + '%';
  
  const power = window.energyData.getDistributedSolarPower(houseId);
  document.getElementById(`power-${houseId}`).textContent = power + ' kW';
  
  // Update all slider states (lock/unlock)
  updateAllSliderStates();
  
  // Update total display
  updateTotalAllocation();
  
  // Update chart
  if (distributionChart) {
    updateDistributionChart();
  }
}

function updateAllSliderStates() {
  const currentTotal = window.energyData.getTotalSolarAllocation();
  const remaining = 100 - currentTotal;
  
  window.energyData.houses.forEach(house => {
    const slider = document.getElementById(`slider-${house.id}`);
    const card = document.getElementById(`slider-card-${house.id}`);
    const currentValue = house.solarAllocation || 0;
    
    // Calculate max value for this slider
    const maxPossible = currentValue + remaining;
    slider.max = maxPossible;
    
    // Lock slider if at 100% and this slider is at 0
    if (currentTotal >= 100 && currentValue === 0) {
      card.classList.add('locked');
      slider.disabled = true;
    } else {
      card.classList.remove('locked');
      slider.disabled = false;
    }
  });
}

function updateTotalAllocation() {
  const total = window.energyData.getTotalSolarAllocation();
  
  // Update old display (for compatibility)
  const oldDisplay = document.getElementById('total-allocation');
  if (oldDisplay) {
    oldDisplay.textContent = total.toFixed(0) + '%';
  }
  
  // Update new enhanced display
  const totalDisplay = document.getElementById('allocation-total-display');
  const statusText = document.getElementById('allocation-status-text');
  const summary = document.getElementById('allocation-summary');
  
  if (totalDisplay) {
    totalDisplay.textContent = total.toFixed(0) + '%';
  }
  
  if (summary && statusText) {
    // Remove all status classes
    summary.classList.remove('valid', 'invalid', 'warning');
    
    if (total === 100) {
      summary.classList.add('valid');
      statusText.innerHTML = '<i class="fas fa-check-circle"></i><span>Perfect! Power distribution at 100%</span>';
    } else if (total > 100) {
      summary.classList.add('invalid');
      statusText.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Exceeds limit! Please reduce values</span>';
    } else {
      summary.classList.add('warning');
      const remaining = 100 - total;
      statusText.innerHTML = `<i class="fas fa-info-circle"></i><span>Remaining ${remaining.toFixed(0)}% not yet distributed</span>`;
    }
  }
  
  // Update old status element (for compatibility)
  const statusElement = document.getElementById('allocation-status');
  if (statusElement) {
    if (total === 100) {
      statusElement.innerHTML = '<i class="fas fa-check-circle"></i><span>Complete</span>';
      statusElement.className = 'stat-change positive';
    } else if (total > 100) {
      statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Exceeds 100%</span>';
      statusElement.className = 'stat-change negative';
    } else {
      statusElement.innerHTML = '<i class="fas fa-info-circle"></i><span>Not yet 100%</span>';
      statusElement.className = 'stat-change';
    }
  }
}

function resetAllocation() {
  window.energyData.houses.forEach(house => {
    window.energyData.updateSolarAllocation(house.id, 0);
    const slider = document.getElementById(`slider-${house.id}`);
    if (slider) {
      slider.value = 0;
      slider.max = 100;
    }
    const allocation = document.getElementById(`allocation-${house.id}`);
    if (allocation) {
      allocation.textContent = '0%';
    }
    const power = document.getElementById(`power-${house.id}`);
    if (power) {
      power.textContent = '0.00 kW';
    }
  });
  
  updateAllSliderStates();
  updateTotalAllocation();
  if (distributionChart) {
    updateDistributionChart();
  }
}

function createDistributionChart() {
  const houses = window.energyData.houses.filter(h => h.solarAllocation > 0);
  
  const data = {
    labels: houses.length > 0 ? houses.map(h => h.name) : ['No distribution yet'],
    datasets: [{
      data: houses.length > 0 ? houses.map(h => h.solarAllocation) : [100],
      backgroundColor: window.chartManager.getColorArray(houses.length || 1),
      borderWidth: 2,
      borderColor: '#1e233c'
    }]
  };
  
  distributionChart = window.chartManager.createPieChart('distribution-chart', data, {
    type: 'doughnut'
  });
}

function updateDistributionChart() {
  const houses = window.energyData.houses.filter(h => h.solarAllocation > 0);
  
  const newData = {
    labels: houses.length > 0 ? houses.map(h => h.name) : ['No distribution yet'],
    datasets: [{
      data: houses.length > 0 ? houses.map(h => h.solarAllocation) : [100],
      backgroundColor: window.chartManager.getColorArray(houses.length || 1),
      borderWidth: 2,
      borderColor: '#1e233c'
    }]
  };
  
  window.chartManager.updateChart('distribution-chart', newData);
}

function populateBlackoutSelector() {
  const select = document.getElementById('blackout-house-select');
  select.innerHTML = '<option value="">-- Select House --</option>';
  
  window.energyData.houses.forEach(house => {
    const option = document.createElement('option');
    option.value = house.id;
    option.textContent = house.name;
    select.appendChild(option);
  });
}

function showBlackoutRecommendations() {
  const houseId = parseInt(document.getElementById('blackout-house-select').value);
  
  if (!houseId) {
    document.getElementById('blackout-recommendations').style.display = 'none';
    return;
  }
  
  const recommendations = window.energyData.getLoadSheddingRecommendations(houseId);
  const tbody = document.getElementById('recommendations-table');
  tbody.innerHTML = '';
  
  recommendations.forEach(rec => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${rec.step}</td>
      <td>${rec.appliance}</td>
      <td>${rec.power.toFixed(2)} kW</td>
      <td>${rec.extendedTime} hrs</td>
    `;
    tbody.appendChild(row);
  });
  
  document.getElementById('blackout-recommendations').style.display = 'block';
}
