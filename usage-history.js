// ===================================
// Usage History Page
// Campus Community Energy Data
// ===================================

let historyChart = null;
let applianceChart = null;
let comparisonAvgChart = null;

function initUsageHistory() {
  // Populate house selector
  populateHistoryHouseSelector();
  
  // Initial update
  updateHistory();
}

function populateHistoryHouseSelector() {
  const select = document.getElementById('history-house-select');
  select.innerHTML = '<option value="">-- Select House --</option>';
  
  window.energyData.houses.forEach(house => {
    const option = document.createElement('option');
    option.value = house.id;
    option.textContent = house.name;
    select.appendChild(option);
  });
}

function updateHistory() {
  const houseId = parseInt(document.getElementById('history-house-select').value);
  const period = document.getElementById('history-period-select').value;
  
  if (!houseId) {
    // Show community overview when no house is selected
    showCommunityOverview(period);
    return;
  }
  
  const house = window.energyData.getHouse(houseId);
  if (!house) return;
  
  // Show house info
  showHouseInfo(house);
  
  // Update charts
  updateHistoryChart(house, period);
  updateApplianceChart(house);
  updateComparisonAvgChart(house);
}

function showCommunityOverview(period) {
  // Hide individual house info
  document.getElementById('house-info-card').style.display = 'none';
  
  // Show community overview chart
  updateCommunityHistoryChart(period);
  updateCommunityApplianceChart();
  updateAllHousesComparisonChart();
}

function showHouseInfo(house) {
  document.getElementById('house-info-card').style.display = 'block';
  document.getElementById('selected-house-name').textContent = house.name;
  document.getElementById('house-current-consumption').textContent = house.currentConsumption.toFixed(2) + ' kW';
  document.getElementById('house-daily-consumption').textContent = house.dailyConsumption.toFixed(1) + ' kWh';
  document.getElementById('house-monthly-consumption').textContent = house.monthlyConsumption.toFixed(0) + ' kWh';
  document.getElementById('house-residents').textContent = house.residents + ' people';
}

function updateHistoryChart(house, period) {
  let labels = [];
  let data = [];
  let unit = 'kWh';
  
  if (period === 'hourly') {
    labels = house.history.hourly.map(h => {
      const date = new Date(h.timestamp);
      return date.getHours().toString().padStart(2, '0') + ':00';
    });
    data = house.history.hourly.map(h => h.consumption);
    unit = 'kW';
  } else if (period === 'daily') {
    labels = house.history.daily.map(d => {
      const date = new Date(d.timestamp);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    data = house.history.daily.map(d => d.consumption);
  } else if (period === 'monthly') {
    labels = house.history.monthly.map(m => m.month);
    data = house.history.monthly.map(m => m.consumption);
  }
  
  const chartData = {
    labels: labels,
    datasets: [{
      label: 'Power Usage',
      data: data,
      borderColor: '#00d4ff',
      backgroundColor: 'rgba(0, 212, 255, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#00d4ff',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };
  
  if (historyChart) {
    window.chartManager.destroyChart('history-chart');
  }
  
  historyChart = window.chartManager.createLineChart('history-chart', chartData, {
    unit: unit,
    chartOptions: {
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function updateApplianceChart(house) {
  const appliances = house.appliances.filter(a => a.isOn);
  
  const data = {
    labels: appliances.map(a => a.name),
    datasets: [{
      data: appliances.map(a => a.power),
      backgroundColor: window.chartManager.getColorArray(appliances.length),
      borderWidth: 2,
      borderColor: '#1e233c'
    }]
  };
  
  if (applianceChart) {
    window.chartManager.destroyChart('appliance-chart');
  }
  
  applianceChart = window.chartManager.createPieChart('appliance-chart', data, {
    type: 'doughnut'
  });
}

function updateComparisonAvgChart(house) {
  // Calculate community average
  const avgConsumption = window.energyData.houses.reduce((sum, h) => 
    sum + h.dailyConsumption, 0) / window.energyData.houses.length;
  
  const data = {
    labels: ['This House', 'Community Average'],
    datasets: [{
      label: 'Daily Usage (kWh)',
      data: [house.dailyConsumption, avgConsumption],
      backgroundColor: [
        'rgba(0, 212, 255, 0.6)',
        'rgba(124, 58, 237, 0.6)'
      ],
      borderColor: ['#00d4ff', '#7c3aed'],
      borderWidth: 2
    }]
  };
  
  if (comparisonAvgChart) {
    window.chartManager.destroyChart('comparison-avg-chart');
  }
  
  comparisonAvgChart = window.chartManager.createBarChart('comparison-avg-chart', data, {
    chartOptions: {
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function updateCommunityHistoryChart(period) {
  let labels = [];
  let data = [];
  let unit = 'kWh';
  
  if (period === 'hourly') {
    // Aggregate hourly data from all houses
    const hours = 24;
    labels = Array.from({length: hours}, (_, i) => {
      const hour = new Date();
      hour.setHours(hour.getHours() - (hours - 1 - i));
      return hour.getHours().toString().padStart(2, '0') + ':00';
    });
    
    data = labels.map((_, index) => {
      return window.energyData.houses.reduce((sum, house) => {
        return sum + (house.history.hourly[index]?.consumption || 0);
      }, 0);
    });
    unit = 'kW';
  } else if (period === 'daily') {
    // Aggregate daily data
    const days = 30;
    labels = Array.from({length: days}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    
    data = labels.map((_, index) => {
      return window.energyData.houses.reduce((sum, house) => {
        return sum + (house.history.daily[index]?.consumption || 0);
      }, 0);
    });
  } else if (period === 'monthly') {
    labels = window.energyData.houses[0].history.monthly.map(m => m.month);
    data = labels.map((_, index) => {
      return window.energyData.houses.reduce((sum, house) => {
        return sum + (house.history.monthly[index]?.consumption || 0);
      }, 0);
    });
  }
  
  const chartData = {
    labels: labels,
    datasets: [{
      label: 'Community Total Usage',
      data: data,
      borderColor: '#7c3aed',
      backgroundColor: 'rgba(124, 58, 237, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#7c3aed',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };
  
  if (historyChart) {
    window.chartManager.destroyChart('history-chart');
  }
  
  historyChart = window.chartManager.createLineChart('history-chart', chartData, {
    unit: unit,
    chartOptions: {
      plugins: {
        legend: {
          display: true
        }
      }
    }
  });
}

function updateCommunityApplianceChart() {
  // Aggregate all appliances from all houses
  const applianceMap = {};
  
  window.energyData.houses.forEach(house => {
    house.appliances.filter(a => a.isOn).forEach(appliance => {
      if (!applianceMap[appliance.name]) {
        applianceMap[appliance.name] = 0;
      }
      applianceMap[appliance.name] += appliance.power;
    });
  });
  
  const labels = Object.keys(applianceMap);
  const data = Object.values(applianceMap);
  
  const chartData = {
    labels: labels,
    datasets: [{
      data: data,
      backgroundColor: window.chartManager.getColorArray(labels.length),
      borderWidth: 2,
      borderColor: '#1e233c'
    }]
  };
  
  if (applianceChart) {
    window.chartManager.destroyChart('appliance-chart');
  }
  
  applianceChart = window.chartManager.createPieChart('appliance-chart', chartData, {
    type: 'doughnut'
  });
}

function updateAllHousesComparisonChart() {
  // Show all houses consumption comparison
  const houses = window.energyData.houses;
  
  const chartData = {
    labels: houses.map(h => h.name),
    datasets: [{
      label: 'Daily Usage (kWh)',
      data: houses.map(h => h.dailyConsumption),
      backgroundColor: window.chartManager.getColorArray(houses.length),
      borderColor: houses.map(() => '#1e233c'),
      borderWidth: 2
    }]
  };
  
  if (comparisonAvgChart) {
    window.chartManager.destroyChart('comparison-avg-chart');
  }
  
  comparisonAvgChart = window.chartManager.createBarChart('comparison-avg-chart', chartData, {
    chartOptions: {
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function exportData() {
  const houseId = parseInt(document.getElementById('history-house-select').value);
  const period = document.getElementById('history-period-select').value;
  
  if (!houseId) {
    alert('Please select a house first');
    return;
  }
  
  const house = window.energyData.getHouse(houseId);
  if (!house) return;
  
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += `Power Usage Data - ${house.name}\n`;
  csvContent += `Time Period: ${period}\n\n`;
  
  if (period === 'hourly') {
    csvContent += "Date,Time,Power Usage (kW)\n";
    house.history.hourly.forEach(h => {
      const date = new Date(h.timestamp);
      csvContent += `${date.toLocaleDateString('th-TH')},${date.toLocaleTimeString('th-TH')},${h.consumption}\n`;
    });
  } else if (period === 'daily') {
    csvContent += "Date,Power Usage (kWh)\n";
    house.history.daily.forEach(d => {
      const date = new Date(d.timestamp);
      csvContent += `${date.toLocaleDateString('th-TH')},${d.consumption}\n`;
    });
  } else if (period === 'monthly') {
    csvContent += "Month,Power Usage (kWh)\n";
    house.history.monthly.forEach(m => {
      csvContent += `${m.month},${m.consumption}\n`;
    });
  }
  
  // Create download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `energy_data_${house.name}_${period}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
