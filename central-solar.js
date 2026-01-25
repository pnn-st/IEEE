
// ===================================
// Central Solar System Controller
// Gearlaxy Power Pool Model
// ===================================

let csProductionChart = null;

function initCentralSolar() {
  console.log('✅ Central Solar System Initialized');
  updateCentralSolar();
}

function updateCentralSolar() {
  updateSolarStats();
  updateSolarChart();
}

function updateSolarStats() {
  // Simulate Real-time Data based on time of day
  let hour = new Date().getHours();
  
  // Real-time hour
  // let hour is already set above

  const isDaytime = hour >= 6 && hour <= 18;
  
  // Base Production driven by time (Peak at 12:00)
  let production = 0;
  if (isDaytime) {
    // Parabolic curve for solar production
    const peakHour = 12;
    const deviation = Math.abs(hour - peakHour);
    const maxProduction = 45; // kW (Total Capacity ~50kW)
    
    // Simple factor: 1.0 at noon, decreasing to 0 at 6am/6pm
    const timeFactor = Math.max(0, 1 - (deviation / 6)); 
    
    // Add randomness
    const randomFactor = 0.9 + Math.random() * 0.2; // +/- 10%
    
    production = maxProduction * timeFactor * randomFactor;
  }
  
  // Get Persistent Data
  if (!window.energyData) return; // Safety check
  if (typeof window.energyData.initializeTradingData === 'function') {
    window.energyData.initializeTradingData();
  }
  
  if (!window.energyData.tradingData || !window.energyData.tradingData.centralSolar) return; // Safety check
  
  const csData = window.energyData.tradingData.centralSolar;
  
  // Battery Data Simulation
  // Discharges at night, charges during day (Logic to update persisted data)
  let change = 0;
  if (hour < 6) change = -0.5; // Slow discharge night
  else if (hour < 12) change = 1.0; // Charging morning
  else if (hour < 18) change = 1.5; // Peak charge
  else change = -1.0; // Discharging evening
  
  // Apply change (Simulated environment)
  // In real app, this comes from sensors. Here we simulate the fluctuation
  csData.batteryLevel = Math.max(5, Math.min(100, csData.batteryLevel + (change * 0.005))); // Realistic slow change
  
  window.energyData.saveData(); // Save changes
  
  let batteryLevel = csData.batteryLevel;
  
  // Update DOM
  const elProduction = document.getElementById('cs-current-production');
  const elBattery = document.getElementById('cs-battery-level');
  const elDailyOutput = document.getElementById('cs-daily-output');
  const elCO2 = document.getElementById('cs-co2-saved');
  
  if (elProduction) elProduction.textContent = production.toFixed(2) + ' kW';
  
  if (elBattery) {
    elBattery.textContent = Math.round(batteryLevel) + '%';
    // Update color based on level
    const color = batteryLevel > 50 ? '#10b981' : batteryLevel > 20 ? '#f59e0b' : '#ef4444';
    elBattery.style.color = color;
  }
  
  // Simulated cumulative values
  const dailyOutput = 320 + (hour * 5); // Just a dummy increment
  if (elDailyOutput) elDailyOutput.textContent = dailyOutput.toLocaleString() + ' kWh';
  
  const co2Saved = (dailyOutput * 0.45).toFixed(1); // Approx 0.45 kg/kWh
  if (elCO2) elCO2.textContent = co2Saved + ' kg';

  // INTEGRATION: Update Trading System with Surplus Energy
  // Logic: Can sell energy if battery > 60%
  let surplusForTrading = 0;
  if (batteryLevel > 60) {
    const systemCapacity = 200; // kWh total battery capacity for central system
    // Available to sell = Everything above 60% reserve
    surplusForTrading = ((batteryLevel - 60) / 100) * systemCapacity;
  }
  
  if (typeof updateCentralSolarOffer === 'function') {
    updateCentralSolarOffer(surplusForTrading);
  }
}

function updateSolarChart() {
  const ctx = document.getElementById('cs-production-chart');
  if (!ctx) return;
  
  // If chart already exists, don't recreate or regenerate random data (keeps it stable)
  if (csProductionChart) {
    return;
  }

  // Generate data points for the day (00:00 - 23:00)
  const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
  const productionData = [];
  const irradianceData = [];
  
  for (let i = 0; i < 24; i++) {
    if (i >= 6 && i <= 18) {
      const peak = 12;
      const factor = Math.max(0, 1 - (Math.abs(i - peak) / 6));
      productionData.push(45 * factor * (0.9 + Math.random() * 0.1));
      irradianceData.push(1000 * factor);
    } else {
      productionData.push(0);
      irradianceData.push(0);
    }
  }

  // Create Chart
  csProductionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [
        {
          label: 'Solar Production (kW)',
          data: productionData,
          borderColor: '#f59e0b', // Ambient/Warning color usually used for Solar
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Irradiance (W/m²)',
          data: irradianceData,
          borderColor: '#3b82f6', // Blue for sky/irradiance reference
          borderDash: [5, 5],
          borderWidth: 1,
          pointRadius: 0,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          title: { display: true, text: 'Power (kW)' },
          beginAtZero: true
        },
        y1: {
          position: 'right',
          title: { display: true, text: 'Irradiance (W/m²)' },
          beginAtZero: true,
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}
