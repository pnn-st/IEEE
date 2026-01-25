// ===================================
// Data Generation & Management
// Campus Community Energy Data
// ===================================

class EnergyDataManager {
  constructor() {
    this.houses = [];
    this.evData = [];
    this.solarData = null;
    this.initializeData();
  }

  // Initialize all data
  initializeData() {
    const savedData = localStorage.getItem('energyData');
    
    // Check if saved data contains Thai characters and clear it
    if (savedData && /[\u0E00-\u0E7F]/.test(savedData)) {
      console.log('Detected Thai data in localStorage, clearing...');
      localStorage.removeItem('energyData');
    }
    
    // Check if saved data has outdated consumption values or solar panel configuration
    let needsReset = false;
    if (savedData && !(/[\u0E00-\u0E7F]/.test(savedData))) {
      try {
        const data = JSON.parse(savedData);
        // Check if any house has consumption outside the new range (50-800 kWh/month)
        // OR if solar panels are not in range 5-7 (new config is 5-7)
        // OR if EV data is missing model or houseId fields
        if (data.houses && data.houses.length > 0) {
          const hasOutdatedData = data.houses.some(house => 
            house.monthlyConsumption > 800 || 
            house.monthlyConsumption < 50 ||
            (house.solarPanels > 7 || house.solarPanels < 5 && house.solarPanels > 0) || // Check: 5-7 panels or none
            (house.solarPanels > 0 && house.batteryLevel === undefined) // Check: missing batteryLevel for solar houses
          );
          
          // Check EV data structure
          const hasOutdatedEVData = data.evData && data.evData.length > 0 && 
            data.evData.some(ev => !ev.model || !ev.houseId);
          
          if (hasOutdatedData || hasOutdatedEVData) {
            console.log('Detected outdated consumption, solar panel, or EV data, resetting...');
            needsReset = true;
            localStorage.removeItem('energyData');
          }
        }
      } catch (e) {
        console.log('Error parsing saved data, clearing...');
        needsReset = true;
        localStorage.removeItem('energyData');
      }
    }
    
    if (savedData && !needsReset && !(/[\u0E00-\u0E7F]/.test(savedData))) {
      const data = JSON.parse(savedData);
      this.houses = data.houses;
      this.evData = data.evData;
      this.solarData = data.solarData;
      
      // FIX: Ensure daily consumption matches monthly consumption for existing data
      this.houses.forEach(house => {
        house.dailyConsumption = house.monthlyConsumption / 30;
      });
      this.saveData(); // Save the corrected values
    } else {
      this.generateHouses();
      this.generateEVData();
      this.generateSolarData();
      this.saveData();
    }
    
    // Start real-time updates
    // this.startRealTimeUpdates(); // ❌ DISABLED: Auto-refresh turned off
  }

  // Generate house data
  generateHouses() {
    const houseNames = [
      'House No. 101', 'House No. 102', 'House No. 103',
      'House No. 104', 'House No. 105', 'House No. 106',
      'House No. 107', 'House No. 108', 'House No. 109',
      'House No. 110', 'House No. 111', 'House No. 112'
    ];

    this.houses = houseNames.map((name, index) => {
      const hasSolar = Math.random() > 0.5;
      // Increased solar panels to 5-7 panels to guarantee minimum 40% savings
      // 5-7 panels × 0.4 kW = 2.0-2.8 kW capacity
      // Monthly production: ~108-151 kWh
      // Even with 750 kWh consumption, 7 panels will save ~20% (151/750)
      // With efficiency and battery storage, actual savings will be 40-80%
      const solarPanels = hasSolar ? this.randomInt(5, 7) : 0; // 5-7 panels
      
      // Battery capacity should be proportional to solar capacity
      // Rule: Battery stores 2-3 hours of solar production
      // Solar capacity = panels × 0.4 kW
      // Battery = solar capacity × 2.5 hours (average)
      let batteryCapacity = 0;
      if (hasSolar && solarPanels > 0) {
        const solarCapacityKW = solarPanels * 0.4;
        batteryCapacity = this.randomInRange(solarCapacityKW * 2, solarCapacityKW * 3);
      }
      
      // All houses have the same consumption range (300-750 kWh/month = 1,200-3,000 baht)
      // This represents the actual electricity usage before solar offset
      const currentConsumption = this.randomInRange(0.5, 2.5); // 0.5-2.5 kW
      const monthlyConsumption = this.randomInRange(300, 750); // 300-750 kWh/month (1,200-3,000 baht)
      const dailyConsumption = monthlyConsumption / 30; // Exact consistency
      
      return {
        id: index + 1,
        name: name,
        currentConsumption: currentConsumption,
        dailyConsumption: dailyConsumption,
        monthlyConsumption: monthlyConsumption,
        residents: this.randomInt(2, 6),
        solarPanels: solarPanels,
        batteryCapacity: batteryCapacity, // Correlated with solar capacity
        batteryLevel: batteryCapacity > 0 ? this.randomInRange(60, 95) : 0, // Battery level % (60-95%)
        solarProblem: false, // Will be set later for 2 houses
        blackoutStatus: false, // Will be set later for 3 houses
        appliances: this.generateAppliances(),
        history: this.generateHistory(),
        solarAllocation: 0 // Percentage from central solar
      };
    });
    
    // Set 2 random houses with solar panels to have solar problems
    const housesWithSolar = this.houses.filter(h => h.solarPanels > 0);
    if (housesWithSolar.length >= 2) {
      const solarProblemIndices = [];
      while (solarProblemIndices.length < 2) {
        const randomHouse = housesWithSolar[this.randomInt(0, housesWithSolar.length - 1)];
        if (!solarProblemIndices.includes(randomHouse.id)) {
          solarProblemIndices.push(randomHouse.id);
          randomHouse.solarProblem = true;
        }
      }
    }
    
    // Set 3 random houses to have blackout status
    const blackoutIndices = [];
    while (blackoutIndices.length < 3) {
      const randomIndex = this.randomInt(0, this.houses.length - 1);
      if (!blackoutIndices.includes(randomIndex)) {
        blackoutIndices.push(randomIndex);
        this.houses[randomIndex].blackoutStatus = true;
        // Ensure blackout houses have some battery capacity
        if (this.houses[randomIndex].batteryCapacity === 0) {
          this.houses[randomIndex].batteryCapacity = this.randomInRange(5, 10);
          this.houses[randomIndex].batteryLevel = this.randomInRange(20, 60); // Lower battery for blackout
        } else {
          this.houses[randomIndex].batteryLevel = this.randomInRange(20, 60); // Lower battery for blackout
        }
      }
    }
  }

  // Generate appliance data for each house
  generateAppliances() {
    const applianceTypes = [
      { name: 'Air Conditioner', power: this.randomInRange(0.8, 1.5), priority: 2 }, // 800-1500W
      { name: 'Refrigerator', power: this.randomInRange(0.08, 0.15), priority: 1 }, // 80-150W
      { name: 'Washing Machine', power: this.randomInRange(0.3, 0.5), priority: 3 }, // 300-500W
      { name: 'TV', power: this.randomInRange(0.05, 0.15), priority: 3 }, // 50-150W
      { name: 'Electric Stove', power: this.randomInRange(1.0, 2.0), priority: 2 }, // 1000-2000W
      { name: 'Water Heater', power: this.randomInRange(2.5, 3.5), priority: 2 }, // 2500-3500W
      { name: 'Lights/Others', power: this.randomInRange(0.1, 0.3), priority: 1 } // 100-300W
    ];

    return applianceTypes.map((appliance, index) => ({
      id: index + 1,
      name: appliance.name,
      power: appliance.power,
      isOn: Math.random() > 0.3,
      priority: appliance.priority // 1=critical, 2=important, 3=optional
    }));
  }

  // Generate historical data
  generateHistory() {
    const history = {
      hourly: [],
      daily: [],
      monthly: []
    };

    // Hourly data for last 24 hours (more realistic pattern)
    for (let i = 23; i >= 0; i--) {
      const hour = new Date();
      hour.setHours(hour.getHours() - i);
      const hourOfDay = hour.getHours();
      
      // Realistic consumption pattern: higher in morning (6-9) and evening (18-22)
      let multiplier = 0.3; // Base consumption
      if (hourOfDay >= 6 && hourOfDay <= 9) multiplier = 0.8; // Morning peak
      else if (hourOfDay >= 18 && hourOfDay <= 22) multiplier = 1.0; // Evening peak
      else if (hourOfDay >= 10 && hourOfDay <= 17) multiplier = 0.5; // Daytime
      else multiplier = 0.2; // Night
      
      history.hourly.push({
        timestamp: hour.toISOString(),
        consumption: this.randomInRange(0.2, 2.5) * multiplier // Realistic hourly variation
      });
    }

    // Daily data for last 30 days
    for (let i = 29; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      history.daily.push({
        timestamp: day.toISOString(),
        consumption: this.randomInRange(2.5, 7) // 2.5-7 kWh per day
      });
    }

    // Monthly data for last 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 11; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      history.monthly.push({
        month: months[month.getMonth()],
        consumption: this.randomInRange(80, 200) // 80-200 kWh per month (320-800 baht)
      });
    }

    return history;
  }

  // Generate EV data
  generateEVData() {
    const evCount = this.randomInt(3, 6); // 3-6 EVs in community
    const evData = [];
    
    // EV models available in Thailand
    const evModels = [
      'Nissan Leaf', 'BYD Atto 3', 'MG ZS EV', 'MG EP',
      'Tesla Model 3', 'Hyundai Kona Electric', 'Neta V'
    ];
    
    for (let i = 0; i < evCount; i++) {
      const isCharging = Math.random() > 0.5;
      const currentCharge = this.randomInRange(20, 95); // 20-95% charge
      const batteryCapacity = this.randomInRange(40, 75); // 40-75 kWh (realistic EV battery)
      const chargingPower = isCharging ? this.randomInRange(3, 7) : 0; // 3-7 kW charging
      const houseId = this.randomInt(1, 12); // Random house ID (1-12)
      
      evData.push({
        id: i + 1,
        name: `EV-${String(i + 1).padStart(3, '0')}`,
        model: evModels[this.randomInt(0, evModels.length - 1)], // Random EV model
        houseId: houseId, // House ID for lookup
        owner: `House No. ${100 + houseId}`, // House name for display
        batteryCapacity: batteryCapacity,
        currentCharge: currentCharge,
        isCharging: isCharging,
        chargingPower: chargingPower,
        estimatedTimeToFull: isCharging ? 
          ((batteryCapacity * (100 - currentCharge) / 100) / chargingPower).toFixed(1) : 0
      });
    }
    
    this.evData = evData;
  }

  // Generate central solar data
  generateSolarData() {
    this.solarData = {
      totalCapacity: 100, // kW
      currentProduction: this.randomInRange(40, 95), // kW (varies by time of day)
      batteryCapacity: 200, // kWh
      batteryLevel: this.randomInRange(60, 95), // %
      dailyProduction: this.randomInRange(400, 600), // kWh
      monthlyProduction: this.randomInRange(12000, 18000) // kWh
    };
  }

  // Real-time data updates
  startRealTimeUpdates() {
    setInterval(() => {
      // Update house consumption
      this.houses.forEach(house => {
        house.currentConsumption = this.randomInRange(
          house.currentConsumption * 0.9,
          house.currentConsumption * 1.1
        );
        
        // Update appliance states randomly
        house.appliances.forEach(appliance => {
          if (Math.random() > 0.95) {
            appliance.isOn = !appliance.isOn;
          }
        });
        
        // Decrease battery level for blackout houses
        if (house.blackoutStatus && house.batteryLevel > 0) {
          // Decrease by approximately 0.5-1% every 3 seconds (realistic discharge)
          const dischargeRate = this.randomInRange(0.5, 1.0);
          house.batteryLevel = Math.max(0, house.batteryLevel - dischargeRate);
        }
      });

      // Update solar production (always show realistic daytime production for demo)
      // Simulates peak production hours between 9 AM and 3 PM
      const simulatedHour = 12; // Simulate 12:00 noon for consistent demo
      let productionFactor = Math.sin((simulatedHour - 6) * Math.PI / 12); // Peak at noon
      this.solarData.currentProduction = 
        this.solarData.totalCapacity * productionFactor * this.randomInRange(0.85, 0.98);

      // Update EV charging
      this.evData.forEach(ev => {
        if (ev.isCharging && ev.currentCharge < 100) {
          ev.currentCharge = Math.min(100, ev.currentCharge + 0.5);
          ev.estimatedTimeToFull = 
            ((ev.batteryCapacity * (100 - ev.currentCharge) / 100) / ev.chargingPower).toFixed(1);
        }
      });

      this.saveData();
      
      // Dispatch custom event for UI updates
      window.dispatchEvent(new CustomEvent('dataUpdated'));
    }, 3000); // Update every 3 seconds
  }

  // Save data to localStorage
  saveData() {
    const data = {
      houses: this.houses,
      evData: this.evData,
      solarData: this.solarData,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('energyData', JSON.stringify(data));
  }

  // Utility functions
  randomInRange(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Get total community consumption
  getTotalConsumption() {
    return this.houses.reduce((sum, house) => sum + house.currentConsumption, 0);
  }

  // Get house by ID
  getHouse(id) {
    return this.houses.find(house => house.id === id);
  }

  // Get consumption status (low/medium/high)
  getConsumptionStatus(consumption) {
    if (consumption < 4) return 'low';
    if (consumption < 7) return 'medium';
    return 'high';
  }

  // Calculate solar panel requirements
  calculateSolarRequirement(dailyConsumption) {
    // Average 4-5 hours of peak sun in Thailand
    const peakSunHours = 4.5;
    const systemEfficiency = 0.8;
    const requiredCapacity = dailyConsumption / (peakSunHours * systemEfficiency);
    const panelWattage = 400; // Watts per panel
    const numberOfPanels = Math.ceil((requiredCapacity * 1000) / panelWattage);
    
    return {
      capacity: requiredCapacity.toFixed(2), // kW
      numberOfPanels: numberOfPanels,
      estimatedCost: (requiredCapacity * 50000).toFixed(0) // 50,000 THB per kW
    };
  }

  // Calculate backup duration during power outage
  calculateBackupDuration(solarCapacity, batteryCapacity, consumption) {
    const solarContribution = solarCapacity; // kW
    const netConsumption = consumption - solarContribution; // kW
    
    // If solar covers all consumption or more
    if (netConsumption <= 0) {
      return {
        backupHours: '∞ (Solar covers all usage)',
        solarContribution: solarContribution.toFixed(2) + ' kW',
        netConsumption: '0.00 kW (Surplus: ' + Math.abs(netConsumption).toFixed(2) + ' kW)'
      };
    }
    
    // If no battery
    if (batteryCapacity <= 0) {
      return {
        backupHours: '0 (No battery installed)',
        solarContribution: solarContribution.toFixed(2) + ' kW',
        netConsumption: netConsumption.toFixed(2) + ' kW'
      };
    }
    
    const backupHours = batteryCapacity / netConsumption; // hours
    
    return {
      backupHours: backupHours.toFixed(2) + ' hrs',
      solarContribution: solarContribution.toFixed(2) + ' kW',
      netConsumption: netConsumption.toFixed(2) + ' kW'
    };
  }

  // Calculate blackout duration (how long battery will last)
  calculateBlackoutDuration(houseId) {
    const house = this.getHouse(houseId);
    if (!house) return null;
    
    // If no battery, return 0
    if (house.batteryCapacity <= 0 || house.batteryLevel <= 0) {
      return {
        hours: 0,
        minutes: 0,
        formatted: 'No battery available'
      };
    }
    
    // Calculate available battery energy (kWh)
    const availableEnergy = (house.batteryLevel / 100) * house.batteryCapacity;
    
    // Calculate duration in hours
    const hours = availableEnergy / house.currentConsumption;
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    return {
      hours: wholeHours,
      minutes: minutes,
      totalHours: hours,
      formatted: `${wholeHours}h ${minutes}m`
    };
  }

  // Get load shedding recommendations
  getLoadSheddingRecommendations(houseId) {
    const house = this.getHouse(houseId);
    if (!house) return [];

    // Sort appliances by priority (higher priority = keep longer)
    const sortedAppliances = [...house.appliances]
      .filter(a => a.isOn)
      .sort((a, b) => b.priority - a.priority);

    const recommendations = [];
    let savedPower = 0;

    sortedAppliances.forEach((appliance, index) => {
      savedPower += appliance.power;
      recommendations.push({
        step: index + 1,
        appliance: appliance.name,
        power: appliance.power,
        totalSaved: savedPower,
        extendedTime: (house.batteryCapacity / (house.currentConsumption - savedPower)).toFixed(1)
      });
    });

    return recommendations;
  }

  // Update solar allocation
  updateSolarAllocation(houseId, percentage) {
    const house = this.getHouse(houseId);
    if (house) {
      house.solarAllocation = percentage;
      this.saveData();
    }
  }

  // Get total solar allocation
  getTotalSolarAllocation() {
    return this.houses.reduce((sum, house) => sum + (house.solarAllocation || 0), 0);
  }

  // Calculate distributed solar power
  getDistributedSolarPower(houseId) {
    const house = this.getHouse(houseId);
    if (!house) return 0;
    
    return (this.solarData.currentProduction * house.solarAllocation / 100).toFixed(2);
  }

  // Calculate current monthly electricity cost (without solar)
  calculateCurrentMonthlyCost(houseId) {
    const house = this.getHouse(houseId);
    if (!house) return 0;
    
    const electricityRate = 4; // THB per kWh
    return house.monthlyConsumption * electricityRate;
  }

  // Calculate projected monthly cost with solar panels
  calculateSolarMonthlyCost(houseId) {
    const house = this.getHouse(houseId);
    if (!house) return { cost: 0, savings: 0, solarProduction: 0 };
    
    const electricityRate = 4; // THB per kWh
    
    // Calculate solar production per month
    // Each panel = 400W, average 4.5 peak sun hours per day in Thailand
    const panelWattage = 0.4; // kW per panel
    const peakSunHours = 4.5;
    const daysPerMonth = 30;
    const systemEfficiency = 0.8;
    
    const monthlySolarProduction = house.solarPanels * panelWattage * peakSunHours * daysPerMonth * systemEfficiency;
    
    // Calculate remaining consumption after solar
    const remainingConsumption = Math.max(0, house.monthlyConsumption - monthlySolarProduction);
    const costWithSolar = remainingConsumption * electricityRate;
    const currentCost = house.monthlyConsumption * electricityRate;
    const savings = currentCost - costWithSolar;
    
    return {
      cost: costWithSolar,
      savings: savings,
      solarProduction: monthlySolarProduction
    };
  }

  // Calculate potential savings if solar panels are installed
  calculatePotentialSavings(houseId) {
    const house = this.getHouse(houseId);
    if (!house) return { cost: 0, savings: 0, recommendedPanels: 0 };
    
    // If house already has solar, return actual savings
    if (house.solarPanels > 0) {
      const result = this.calculateSolarMonthlyCost(houseId);
      return {
        cost: result.cost,
        savings: result.savings,
        hasSolar: true,
        solarProduction: result.solarProduction
      };
    }
    
    // Calculate recommended solar system
    const solarReq = this.calculateSolarRequirement(house.dailyConsumption);
    const recommendedPanels = solarReq.numberOfPanels;
    
    // Calculate potential production with recommended panels
    const electricityRate = 4; // THB per kWh
    const panelWattage = 0.4; // kW per panel
    const peakSunHours = 4.5;
    const daysPerMonth = 30;
    const systemEfficiency = 0.8;
    
    const monthlySolarProduction = recommendedPanels * panelWattage * peakSunHours * daysPerMonth * systemEfficiency;
    const remainingConsumption = Math.max(0, house.monthlyConsumption - monthlySolarProduction);
    const costWithSolar = remainingConsumption * electricityRate;
    const currentCost = house.monthlyConsumption * electricityRate;
    const potentialSavings = currentCost - costWithSolar;
    
    return {
      cost: costWithSolar,
      savings: potentialSavings,
      recommendedPanels: recommendedPanels,
      hasSolar: false,
      solarProduction: monthlySolarProduction
    };
  }

  // Get savings percentage with surplus information
  getSolarSavingsPercentage(houseId) {
    const house = this.getHouse(houseId);
    if (!house) return 0;
    
    const currentCost = this.calculateCurrentMonthlyCost(houseId);
    if (currentCost === 0) return 0;
    
    if (house.solarPanels > 0) {
      const solarResult = this.calculateSolarMonthlyCost(houseId);
      const savingsPercent = (solarResult.savings / currentCost) * 100;
      
      // Check if solar production exceeds consumption (100% savings)
      if (savingsPercent >= 100) {
        const surplus = solarResult.solarProduction - house.monthlyConsumption;
        return `100 (Surplus: ${surplus.toFixed(0)} kWh)`;
      }
      
      return savingsPercent.toFixed(1);
    } else {
      const potentialResult = this.calculatePotentialSavings(houseId);
      const savingsPercent = (potentialResult.savings / currentCost) * 100;
      
      // Check if projected solar production exceeds consumption
      if (savingsPercent >= 100) {
        const surplus = potentialResult.solarProduction - house.monthlyConsumption;
        return `100 (Surplus: ${surplus.toFixed(0)} kWh)`;
      }
      
      return savingsPercent.toFixed(1);
    }
  }
}

// Create global instance
window.energyData = new EnergyDataManager();
