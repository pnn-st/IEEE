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
    
    if (savedData && !(/[\u0E00-\u0E7F]/.test(savedData))) {
      const data = JSON.parse(savedData);
      this.houses = data.houses;
      this.evData = data.evData;
      this.solarData = data.solarData;
    } else {
      this.generateHouses();
      this.generateEVData();
      this.generateSolarData();
      this.saveData();
    }
    
    // Start real-time updates
    this.startRealTimeUpdates();
  }

  // Generate house data
  generateHouses() {
    const houseNames = [
      'House No. 101', 'House No. 102', 'House No. 103',
      'House No. 104', 'House No. 105', 'House No. 106',
      'House No. 107', 'House No. 108', 'House No. 109',
      'House No. 110', 'House No. 111', 'House No. 112'
    ];

    this.houses = houseNames.map((name, index) => ({
      id: index + 1,
      name: name,
      currentConsumption: this.randomInRange(2, 8), // kW
      dailyConsumption: this.randomInRange(30, 80), // kWh
      monthlyConsumption: this.randomInRange(800, 2400), // kWh
      residents: this.randomInt(2, 6),
      solarPanels: Math.random() > 0.6 ? this.randomInt(4, 12) : 0,
      batteryCapacity: Math.random() > 0.6 ? this.randomInRange(5, 15) : 0, // kWh
      appliances: this.generateAppliances(),
      history: this.generateHistory(),
      solarAllocation: 0 // Percentage from central solar
    }));
  }

  // Generate appliance data for each house
  generateAppliances() {
    const applianceTypes = [
      { name: 'Air Conditioner', power: this.randomInRange(1.5, 3.5), priority: 2 },
      { name: 'Refrigerator', power: this.randomInRange(0.3, 0.8), priority: 1 },
      { name: 'Washing Machine', power: this.randomInRange(0.5, 1.2), priority: 3 },
      { name: 'TV', power: this.randomInRange(0.1, 0.3), priority: 3 },
      { name: 'Electric Stove', power: this.randomInRange(1.0, 2.5), priority: 2 },
      { name: 'Water Heater', power: this.randomInRange(2.0, 4.5), priority: 2 },
      { name: 'Lights/Others', power: this.randomInRange(0.2, 0.5), priority: 1 }
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

    // Hourly data for last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = new Date();
      hour.setHours(hour.getHours() - i);
      history.hourly.push({
        timestamp: hour.toISOString(),
        consumption: this.randomInRange(1, 10)
      });
    }

    // Daily data for last 30 days
    for (let i = 29; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      history.daily.push({
        timestamp: day.toISOString(),
        consumption: this.randomInRange(30, 80)
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
        consumption: this.randomInRange(800, 2400)
      });
    }

    return history;
  }

  // Generate EV data
  generateEVData() {
    const evModels = [
      'Tesla Model 3', 'Nissan Leaf', 'BYD Atto 3',
      'MG ZS EV', 'Hyundai Kona Electric', 'BMW i3'
    ];

    const numEVs = this.randomInt(4, 8);
    this.evData = [];

    for (let i = 0; i < numEVs; i++) {
      const batteryCapacity = this.randomInRange(40, 75);
      const currentCharge = this.randomInRange(20, 95);
      const chargingPower = Math.random() > 0.5 ? this.randomInRange(3, 11) : 0;
      
      this.evData.push({
        id: i + 1,
        houseId: this.randomInt(1, 12),
        model: evModels[i % evModels.length],
        batteryCapacity: batteryCapacity, // kWh
        currentCharge: currentCharge, // %
        chargingPower: chargingPower, // kW
        isCharging: chargingPower > 0,
        estimatedTimeToFull: chargingPower > 0 ? 
          ((batteryCapacity * (100 - currentCharge) / 100) / chargingPower).toFixed(1) : 0
      });
    }
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
      });

      // Update solar production (simulate day/night cycle)
      const hour = new Date().getHours();
      let productionFactor = 0;
      if (hour >= 6 && hour <= 18) {
        productionFactor = Math.sin((hour - 6) * Math.PI / 12);
      }
      this.solarData.currentProduction = 
        this.solarData.totalCapacity * productionFactor * this.randomInRange(0.8, 1.0);

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

  // Calculate backup duration
  calculateBackupDuration(solarCapacity, batteryCapacity, consumption) {
    // During blackout, solar panels may still work (if daytime)
    const hour = new Date().getHours();
    let solarContribution = 0;
    if (hour >= 6 && hour <= 18) {
      solarContribution = solarCapacity * 0.7; // 70% efficiency during blackout
    }
    
    const netConsumption = Math.max(0, consumption - solarContribution);
    const backupHours = netConsumption > 0 ? batteryCapacity / netConsumption : Infinity;
    
    return {
      backupHours: backupHours === Infinity ? '∞' : backupHours.toFixed(1),
      solarContribution: solarContribution.toFixed(2),
      netConsumption: netConsumption.toFixed(2)
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
}

// Create global instance
window.energyData = new EnergyDataManager();
