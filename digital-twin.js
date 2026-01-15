// ===================================
// Digital Twin Calculator Page
// Campus Community Energy Data
// ===================================

let comparisonChart = null;

// Initialize when page loads
function initDigitalTwin() {
  populateHouseSelector();
  populateBackupHouseSelector();
  createComparisonChart(); // Keep initial chart creation here
}

// Listen for data updates
document.addEventListener('energyDataUpdated', () => {
  populateHouseSelector();
  populateBackupHouseSelector();
  if (comparisonChart) {
    updateComparisonChart();
  }
});

function populateBackupHouseSelector() {
  const select = document.getElementById('backup-house-select');
  if (!select) return;

  select.innerHTML = '<option value="">-- Select House or Enter Manually --</option>';

  window.energyData.houses.forEach(house => {
    const option = document.createElement('option');
    option.value = house.id;
    option.textContent = `${house.name} (${house.dailyConsumption.toFixed(1)} kWh/day)`;
    select.appendChild(option);
  });
}

function fillBackupFromHouse() {
  const houseId = parseInt(document.getElementById('backup-house-select').value);

  if (!houseId) {
    // Reset to default values if no house selected
    // Or clear fields, depending on desired behavior. For now, do nothing if no house selected.
    return;
  }

  const house = window.energyData.getHouse(houseId);
  if (house) {
    const solarCapacityKW = (house.solarPanels * 0.4); // 400W per panel = 0.4kW
    const avgConsumptionKW = house.dailyConsumption / 24; // Convert daily kWh to average kW

    document.getElementById('backup-solar-capacity').value = solarCapacityKW.toFixed(1);
    document.getElementById('backup-battery-capacity').value = house.batteryCapacity.toFixed(1);
    document.getElementById('backup-consumption').value = avgConsumptionKW.toFixed(2);

    // Hide previous results
    const resultDiv = document.getElementById('backup-calc-result');
    if (resultDiv) {
      resultDiv.style.display = 'none';
    }
  }
}

function populateHouseSelector() {
  const select = document.getElementById('solar-calc-house');
  select.innerHTML = '<option value="">-- Select House --</option>';

  window.energyData.houses.forEach(house => {
    const option = document.createElement('option');
    option.value = house.id;
    option.textContent = `${house.name} (${house.dailyConsumption.toFixed(1)} kWh/day)`;
    select.appendChild(option);
  });

  // Auto-select when changed - fill both solar calc AND backup calc
  select.addEventListener('change', (e) => {
    if (e.target.value) {
      const house = window.energyData.getHouse(parseInt(e.target.value));
      if (house) {
        // Fill solar calculator
        document.getElementById('daily-consumption-input').value = house.dailyConsumption.toFixed(1);

        // Fill backup calculator with actual house data
        const solarCapacityKW = (house.solarPanels * 0.4); // 400W per panel = 0.4kW
        const avgConsumptionKW = house.dailyConsumption / 24; // Convert daily kWh to average kW

        document.getElementById('backup-solar-capacity').value = solarCapacityKW.toFixed(1);
        document.getElementById('backup-battery-capacity').value = house.batteryCapacity.toFixed(1);
        document.getElementById('backup-consumption').value = avgConsumptionKW.toFixed(2);

        // Show info message
        const resultDiv = document.getElementById('backup-calc-result');
        if (resultDiv) {
          resultDiv.style.display = 'none'; // Hide previous results
        }
      }
    }
  });
}

function calculateSolar() {
  const dailyConsumption = parseFloat(document.getElementById('daily-consumption-input').value);

  if (!dailyConsumption || dailyConsumption <= 0) {
    alert('Please enter valid consumption value');
    return;
  }

  const result = window.energyData.calculateSolarRequirement(dailyConsumption);

  // Display results
  document.getElementById('recommended-capacity').textContent = result.capacity;
  document.getElementById('panel-count').textContent = result.numberOfPanels;
  document.getElementById('estimated-cost').textContent = parseInt(result.estimatedCost).toLocaleString();

  document.getElementById('solar-calc-result').style.display = 'block';
}

function calculateBackup() {
  const solarCapacity = parseFloat(document.getElementById('backup-solar-capacity').value);
  const batteryCapacity = parseFloat(document.getElementById('backup-battery-capacity').value);
  const consumption = parseFloat(document.getElementById('backup-consumption').value);

  if (!solarCapacity || !batteryCapacity || !consumption) {
    alert('Please fill in all information');
    return;
  }

  const result = window.energyData.calculateBackupDuration(solarCapacity, batteryCapacity, consumption);

  // Display results
  document.getElementById('backup-hours').textContent = result.backupHours;
  document.getElementById('solar-contribution').textContent = result.solarContribution;
  document.getElementById('net-consumption').textContent = result.netConsumption;

  document.getElementById('backup-calc-result').style.display = 'block';
}

function createComparisonChart() {
  const houses = window.energyData.houses;

  const data = {
    labels: houses.map(h => h.name),
    datasets: [{
      label: 'Current Usage (kW)',
      data: houses.map(h => h.currentConsumption),
      backgroundColor: 'rgba(0, 212, 255, 0.6)',
      borderColor: '#00d4ff',
      borderWidth: 2
    }, {
      label: 'Daily Usage (kWh)',
      data: houses.map(h => h.dailyConsumption),
      backgroundColor: 'rgba(124, 58, 237, 0.6)',
      borderColor: '#7c3aed',
      borderWidth: 2
    }]
  };

  comparisonChart = window.chartManager.createBarChart('comparison-chart', data, {
    chartOptions: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function updateComparisonChart() {
  if (!comparisonChart) return;

  const houses = window.energyData.houses;

  const newData = {
    labels: houses.map(h => h.name),
    datasets: [{
      label: 'Current Usage (kW)',
      data: houses.map(h => h.currentConsumption),
      backgroundColor: 'rgba(0, 212, 255, 0.6)',
      borderColor: '#00d4ff',
      borderWidth: 2
    }, {
      label: 'Daily Usage (kWh)',
      data: houses.map(h => h.dailyConsumption),
      backgroundColor: 'rgba(124, 58, 237, 0.6)',
      borderColor: '#7c3aed',
      borderWidth: 2
    }]
  };

  window.chartManager.updateChart('comparison-chart', newData);
}
