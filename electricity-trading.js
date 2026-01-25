// ===================================
// Electricity Trading System
// Gearlaxy Power Pool Model
// ===================================

let currentPricingMode = 'tou'; // 'tou' or 'fixed'

// Trading offers storage
let sellOffers = []; // Offers from sellers (we buy from them)
let buyRequests = []; // Requests from buyers (they want to buy from us)
let offerIdCounter = 1;

function initElectricityTrading() {
  // Initialize trading offers if not exists
  initializeTradingOffers();

  // Populate house selectors for both pages
  populateHouseSelectors();

  // Initial update for both pages
  updateBuyElectricity();
  updateSellElectricity();

  // Start auto-refresh and market simulation
  startMarketSimulation();

  console.log('✅ Electricity Trading System Initialized');
}

// Initialize trading offers from houses and external companies
function initializeTradingOffers() {
  // Load from localStorage if exists
  const savedOffers = localStorage.getItem('tradingOffers');
  if (savedOffers) {
    const data = JSON.parse(savedOffers);
    sellOffers = data.sellOffers || [];
    buyRequests = data.buyRequests || [];
    offerIdCounter = data.offerIdCounter || 1;
    return;
  }

  // Generate initial sell offers (from houses with solar surplus)
  sellOffers = [];
  const houses = window.energyData.houses;

  // Add offers from houses with surplus
  houses.forEach(house => {
    if (house.solarPanels > 0) {
      // Calculate monthly surplus in kWh
      const panelWattage = 0.4; // kW per panel
      const peakSunHours = 4.5;
      const daysPerMonth = 30;
      const systemEfficiency = 0.8;
      const monthlyProduction = house.solarPanels * panelWattage * peakSunHours * daysPerMonth * systemEfficiency;
      const monthlySurplus = Math.max(0, monthlyProduction - house.monthlyConsumption);

      if (monthlySurplus > 10) { // Only if significant surplus
        sellOffers.push({
          id: offerIdCounter++,
          type: 'house',
          sellerId: house.id,
          sellerName: house.name,
          amount: Math.round(monthlySurplus),
          unit: 'kWh/month',
          solarPanels: house.solarPanels,
          isExternal: false
        });
      }
    }
  });

  // Add external company offers
  const externalCompanies = [
    { name: 'SolarTech Co., Ltd.', amount: 500, description: 'Solar farm provider' },
    { name: 'GreenPower Corp.', amount: 750, description: 'Renewable energy' },
    { name: 'EcoEnergy Thailand', amount: 300, description: 'Clean energy solutions' },
    { name: 'Bangkok Solar Ltd.', amount: 1000, description: 'Large scale solar' }
  ];

  externalCompanies.forEach(company => {
    sellOffers.push({
      id: offerIdCounter++,
      type: 'company',
      sellerId: `ext-${company.name}`,
      sellerName: company.name,
      amount: company.amount,
      unit: 'kWh/month',
      description: company.description,
      isExternal: true
    });
  });

  // Generate buy requests (from houses that want to buy)
  buyRequests = [];
  houses.forEach(house => {
    // Houses without solar or with high consumption want to buy
    const wantsToBuy = house.solarPanels === 0 || house.monthlyConsumption > 400;
    if (wantsToBuy) {
      // Randomly choose TOU or Fixed
      const preferredMode = Math.random() > 0.5 ? 'tou' : 'fixed';
      const wantedAmount = Math.round(house.monthlyConsumption * (0.3 + Math.random() * 0.4)); // 30-70% of consumption

      buyRequests.push({
        id: offerIdCounter++,
        buyerId: house.id,
        buyerName: house.name,
        amount: wantedAmount,
        unit: 'kWh/month',
        priceMode: preferredMode, // Buyer already chose!
        monthlyConsumption: house.monthlyConsumption
      });
    }
  });

  saveTradingOffers();
}

function saveTradingOffers() {
  localStorage.setItem('tradingOffers', JSON.stringify({
    sellOffers,
    buyRequests,
    offerIdCounter
  }));
}

function updateElectricityTrading() {
  // Update both buy and sell pages
  updateBuyElectricity();
  updateSellElectricity();
  updateProfitAnalysis();
  updateReserveEnergyDisplay();
}

// Update Buy Electricity page
function updateBuyElectricity() {
  updateBuyMarketOverview();
  updateBuyOptions();
  updateBuyTransactionHistory();
}

// Update Sell Electricity page
function updateSellElectricity() {
  updateSellMarketOverview();
  updateSellOptions();
  updateSellTransactionHistory();
}

// ===================================
// Pricing Mode Management
// ===================================

function switchPricingMode(mode) {
  currentPricingMode = mode;

  // Update button states on both pages
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.mode === mode) {
      btn.classList.add('active');
    }
  });

  // Update descriptions on both pages
  const buyDescription = document.getElementById('buy-mode-description');
  const sellDescription = document.getElementById('sell-mode-description');

  const descriptionText = mode === 'tou'
    ? '<i class="fas fa-info-circle"></i><span>TOU pricing varies by time: Peak (9:00-22:00) and Off-Peak (22:00-9:00)</span>'
    : '<i class="fas fa-info-circle"></i><span>Fixed rate pricing: Constant price throughout the day</span>';

  if (buyDescription) buyDescription.innerHTML = descriptionText;
  if (sellDescription) sellDescription.innerHTML = descriptionText;

  // Refresh both pages
  updateElectricityTrading();
}

// ===================================
// Buy Page - Show All Sellers
// ===================================

function updateBuyMarketOverview() {
  // Count unique sellers (houses/companies)
  const uniqueSellers = new Set(sellOffers.map(o => o.sellerId));
  const offerCount = uniqueSellers.size;
  const totalAmount = sellOffers.reduce((sum, offer) => sum + offer.amount, 0);

  const buyCountEl = document.getElementById('buy-surplus-count');
  const buyTotalEl = document.getElementById('buy-total-surplus');
  if (buyCountEl) buyCountEl.textContent = offerCount;
  if (buyTotalEl) buyTotalEl.textContent = totalAmount.toLocaleString() + ' kWh';

  // Update both TOU and Fixed prices
  const touPrice = window.energyData.getBuyPriceFromSeller('tou');
  const fixedPrice = window.energyData.getBuyPriceFromSeller('fixed');

  const touPriceEl = document.getElementById('buy-tou-price');
  const fixedPriceEl = document.getElementById('buy-fixed-price');
  if (touPriceEl) touPriceEl.textContent = touPrice.toFixed(2) + ' ฿/kWh';
  if (fixedPriceEl) fixedPriceEl.textContent = fixedPrice.toFixed(2) + ' ฿/kWh';

  const period = window.energyData.getCurrentPricePeriod();
  const buyPeriodEl = document.getElementById('buy-price-period');
  if (buyPeriodEl) buyPeriodEl.textContent = period;
}

function updateBuyOptions() {
  populateAllSellers();
}

function populateAllSellers() {
  const container = document.getElementById('all-sellers-list');

  if (!container) return;

  if (sellOffers.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          <div class="empty-state" style="padding: 2rem;">
            <i class="fas fa-store-slash"></i>
            <p>ไม่มีผู้ขายไฟในขณะนี้</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Fixed rate for buying
  const fixedPrice = window.energyData.getBuyPriceFromSeller('fixed');

  let html = '';
  sellOffers.forEach(offer => {
    const icon = offer.isExternal ? 'building' : 'home';
    const badgeClass = offer.isExternal ? 'badge-info' : 'badge-success';
    const typeLabel = offer.isExternal ? 'บ.เอกชน' : `${offer.solarPanels} panels`;

    html += `
      <tr data-offer-id="${offer.id}">
        <td>
          <i class="fas fa-${icon}"></i>
          <strong>${offer.sellerName}</strong>
          <br><small class="text-muted">${typeLabel}</small>
        </td>
        <td><span class="badge ${badgeClass}">${offer.amount.toLocaleString()} kWh</span></td>
        <td>
          <div class="amount-slider-container">
            <input type="number" 
                   id="buy-amount-${offer.id}" 
                   class="form-input amount-input-lg" 
                   min="10" 
                   max="${offer.amount}" 
                   step="10" 
                   value="${offer.amount}"
                   onchange="syncBuySliderOnChange(${offer.id}, ${offer.amount})"
                   oninput="updateBuySliderOnly(${offer.id})">
            <input type="range" 
                   id="buy-slider-${offer.id}" 
                   class="amount-slider" 
                   min="10" 
                   max="${offer.amount}" 
                   step="10" 
                   value="${offer.amount}"
                   oninput="syncBuyInput(${offer.id}, ${offer.amount})">
            <small class="text-muted">kWh</small>
          </div>
        </td>
        <td>
          <div class="fixed-price-badge">
            <i class="fas fa-tag"></i>
            <span>${fixedPrice.toFixed(2)} ฿/kWh</span>
          </div>
        </td>
        <td>
          <strong class="text-primary" id="buy-total-${offer.id}">${(offer.amount * fixedPrice).toLocaleString()} ฿</strong>
        </td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="buyFromOffer(${offer.id})">
            <i class="fas fa-shopping-cart"></i>
            รับซื้อ
          </button>
        </td>
      </tr>
    `;
  });

  container.innerHTML = html;
}

// Sync slider only (while typing, don't format the input)
function updateBuySliderOnly(sellerId) {
  const input = document.getElementById(`buy-amount-${sellerId}`);
  const slider = document.getElementById(`buy-slider-${sellerId}`);

  const value = parseFloat(input.value) || 0;
  slider.value = value;

  updateBuyTotalFixed(sellerId);
}

// Sync slider on change (format the value)
function syncBuySliderOnChange(sellerId, maxAmount) {
  const input = document.getElementById(`buy-amount-${sellerId}`);
  const slider = document.getElementById(`buy-slider-${sellerId}`);

  let value = parseFloat(input.value) || 0;
  if (value > maxAmount) value = maxAmount;
  if (value < 0.1) value = 0.1;

  input.value = value.toFixed(2);
  slider.value = value;

  updateBuyTotalFixed(sellerId);
}

// Legacy function for compatibility
function syncBuySlider(sellerId, maxAmount) {
  syncBuySliderOnChange(sellerId, maxAmount);
}

// Sync input when slider changes
function syncBuyInput(sellerId, maxAmount) {
  const input = document.getElementById(`buy-amount-${sellerId}`);
  const slider = document.getElementById(`buy-slider-${sellerId}`);

  const value = parseFloat(slider.value);
  input.value = value.toFixed(2);

  updateBuyTotalFixed(sellerId);
}

// Update buy total with fixed rate
function updateBuyTotalFixed(sellerId) {
  const amountInput = document.getElementById(`buy-amount-${sellerId}`);
  const totalEl = document.getElementById(`buy-total-${sellerId}`);

  const amount = parseFloat(amountInput.value) || 0;
  const fixedPrice = window.energyData.getBuyPriceFromSeller('fixed');
  const total = amount * fixedPrice;

  totalEl.textContent = total.toFixed(2) + ' ฿';
}

function updateBuyTotal(sellerId, maxAmount) {
  const amountInput = document.getElementById(`buy-amount-${sellerId}`);
  const modeSelect = document.getElementById(`buy-mode-${sellerId}`);
  const totalEl = document.getElementById(`buy-total-${sellerId}`);

  let amount = parseFloat(amountInput.value) || 0;
  if (amount > maxAmount) {
    amount = maxAmount;
    amountInput.value = maxAmount.toFixed(2);
  }
  if (amount < 0) {
    amount = 0;
    amountInput.value = '0';
  }

  const mode = modeSelect.value;
  const price = window.energyData.getBuyPriceFromSeller(mode);
  const total = amount * price;

  totalEl.textContent = total.toFixed(2) + ' ฿';
}

// ===================================
// Sell Page - Show All Buyers
// ===================================

function updateSellMarketOverview() {
  // Count unique buyers
  const uniqueBuyers = new Set(buyRequests.map(r => r.buyerId));
  const requestCount = uniqueBuyers.size;
  const totalAmount = buyRequests.reduce((sum, req) => sum + req.amount, 0);

  const sellCountEl = document.getElementById('sell-deficit-count');
  const sellTotalEl = document.getElementById('sell-total-deficit');
  if (sellCountEl) sellCountEl.textContent = requestCount;
  if (sellTotalEl) sellTotalEl.textContent = totalAmount.toLocaleString() + ' kWh';

  // Update both TOU and Fixed prices
  const touPrice = window.energyData.getSellPriceToBuyer('tou');
  const fixedPrice = window.energyData.getSellPriceToBuyer('fixed');

  const touPriceEl = document.getElementById('sell-tou-price');
  const fixedPriceEl = document.getElementById('sell-fixed-price');
  if (touPriceEl) touPriceEl.textContent = touPrice.toFixed(2) + ' ฿/kWh';
  if (fixedPriceEl) fixedPriceEl.textContent = fixedPrice.toFixed(2) + ' ฿/kWh';

  const period = window.energyData.getCurrentPricePeriod();
  const sellPeriodEl = document.getElementById('sell-price-period');
  if (sellPeriodEl) sellPeriodEl.textContent = period;
}

function updateSellOptions() {
  populateAllBuyers();
}

function populateAllBuyers() {
  const container = document.getElementById('all-buyers-list');

  if (!container) return;

  if (buyRequests.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          <div class="empty-state" style="padding: 2rem;">
            <i class="fas fa-users-slash"></i>
            <p>ไม่มีคำขอซื้อไฟในขณะนี้</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const touPrice = window.energyData.getSellPriceToBuyer('tou');
  const fixedPrice = window.energyData.getSellPriceToBuyer('fixed');

  let html = '';
  buyRequests.forEach(request => {
    const price = request.priceMode === 'tou' ? touPrice : fixedPrice;
    const modeLabel = request.priceMode === 'tou' ? 'TOU' : 'Fixed';
    const modeBadgeClass = request.priceMode === 'tou' ? 'badge-tou' : 'badge-fixed';
    const modeIcon = request.priceMode === 'tou' ? 'clock' : 'lock';

    html += `
      <tr data-request-id="${request.id}">
        <td>
          <i class="fas fa-home"></i>
          <strong>${request.buyerName}</strong>
          <br><small class="text-muted">ใช้: ${request.monthlyConsumption} kWh</small>
        </td>
        <td><span class="badge badge-warning">${request.amount.toLocaleString()} kWh</span></td>
        <td>
          <div class="amount-slider-container">
            <input type="number" 
                   id="sell-amount-${request.id}" 
                   class="form-input amount-input-lg" 
                   min="10" 
                   max="${request.amount}" 
                   step="10" 
                   value="${request.amount}"
                   onchange="syncSellSliderOnChange(${request.id}, ${request.amount})"
                   oninput="updateSellSliderOnly(${request.id})">
            <input type="range" 
                   id="sell-slider-${request.id}" 
                   class="amount-slider" 
                   min="10" 
                   max="${request.amount}" 
                   step="10" 
                   value="${request.amount}"
                   oninput="syncSellInput(${request.id}, ${request.amount})">
            <small class="text-muted">kWh</small>
          </div>
        </td>
        <td class="text-center">
          <div class="buyer-mode-badge ${modeBadgeClass}" style="margin: 0 auto;">
            <i class="fas fa-${modeIcon}"></i>
            <span>${modeLabel}: ${price.toFixed(2)} ฿/kWh</span>
          </div>
        </td>
        <td>
          <strong class="text-success" id="sell-total-${request.id}">${(request.amount * price).toLocaleString()} ฿</strong>
        </td>
        <td>
          <button class="btn btn-sm btn-success" onclick="sellToRequest(${request.id})">
            <i class="fas fa-hand-holding-usd"></i>
            ขาย
          </button>
        </td>
      </tr>
    `;
  });

  container.innerHTML = html;
}


// Sync sell slider only (while typing, don't format)
function updateSellSliderOnly(buyerId) {
  const input = document.getElementById(`sell-amount-${buyerId}`);
  const slider = document.getElementById(`sell-slider-${buyerId}`);

  const value = parseFloat(input.value) || 0;
  slider.value = value;

  updateSellTotalFromMode(buyerId);
}

// Sync sell slider on change (format the value)
function syncSellSliderOnChange(buyerId, maxAmount) {
  const input = document.getElementById(`sell-amount-${buyerId}`);
  const slider = document.getElementById(`sell-slider-${buyerId}`);

  let value = parseFloat(input.value) || 0;
  if (value > maxAmount) value = maxAmount;
  if (value < 0.1) value = 0.1;

  input.value = value.toFixed(2);
  slider.value = value;

  updateSellTotalFromMode(buyerId);
}

// Sync sell input when slider changes
function syncSellInput(buyerId, maxAmount) {
  const input = document.getElementById(`sell-amount-${buyerId}`);
  const slider = document.getElementById(`sell-slider-${buyerId}`);

  const value = parseFloat(slider.value);
  input.value = value.toFixed(2);

  updateSellTotalFromMode(buyerId);
}

// Get selected sell mode from radio buttons
function getSelectedSellMode(buyerId) {
  const radioButtons = document.querySelectorAll(`input[name="sell-mode-${buyerId}"]`);
  for (const radio of radioButtons) {
    if (radio.checked) {
      return radio.value;
    }
  }
  return 'tou'; // default
}

// Update sell total based on mode selection (radio buttons)
function updateSellTotalFromMode(buyerId) {
  const amountInput = document.getElementById(`sell-amount-${buyerId}`);
  const totalEl = document.getElementById(`sell-total-${buyerId}`);

  const amount = parseFloat(amountInput.value) || 0;
  const mode = getSelectedSellMode(buyerId);
  const price = window.energyData.getSellPriceToBuyer(mode);

  const total = amount * price;
  totalEl.textContent = total.toFixed(2) + ' ฿';
}

// Legacy functions for compatibility
function syncSellSlider(buyerId, maxAmount) {
  syncSellSliderOnChange(buyerId, maxAmount);
}

function updateSellTotalRequest(buyerId) {
  updateSellTotalFromMode(buyerId);
}

function updateSellTotalCustom(buyerId) {
  updateSellTotalFromMode(buyerId);
}

function updateSellTotal(buyerId, maxAmount) {
  const amountInput = document.getElementById(`sell-amount-${buyerId}`);
  const modeSelect = document.getElementById(`sell-mode-${buyerId}`);
  const totalEl = document.getElementById(`sell-total-${buyerId}`);

  let amount = parseFloat(amountInput.value) || 0;
  if (amount > maxAmount) {
    amount = maxAmount;
    amountInput.value = maxAmount.toFixed(2);
  }
  if (amount < 0) {
    amount = 0;
    amountInput.value = '0';
  }

  const mode = modeSelect.value;
  const price = window.energyData.getSellPriceToBuyer(mode);
  const total = amount * price;

  totalEl.textContent = total.toFixed(2) + ' ฿';
}

// ===================================
// Middleman Trading Actions (with Input)
// ===================================

// ===================================
// Trading Actions
// ===================================

function buyFromOffer(offerId) {
  const offerIndex = sellOffers.findIndex(o => o.id === offerId);
  if (offerIndex === -1) return;

  const offer = sellOffers[offerIndex];
  const amountInput = document.getElementById(`buy-amount-${offerId}`);
  const kWh = parseFloat(amountInput.value) || 0;

  if (kWh <= 0) {
    alert('กรุณาระบุจำนวนที่ต้องการรับซื้อ');
    return;
  }

  if (kWh > offer.amount) {
    alert('จำนวนรับซื้อเกินกว่าที่มีขาย');
    return;
  }

  // Fixed rate for buying
  const mode = 'fixed';
  const price = window.energyData.getBuyPriceFromSeller(mode);
  const totalCost = kWh * price;

  // Record transaction
  window.energyData.recordTransaction({
    type: 'buy',
    sellerId: offer.sellerId,
    sellerName: offer.sellerName,
    buyerId: 'middleman',
    buyerName: 'Gearlaxy Pool',
    kWh: kWh,
    price: price,
    totalCost: totalCost,
    pricingMode: mode,
    timestamp: new Date().toISOString()
  });

  // Special Logic: Deduct from Central Solar Battery if buying from them
  if (offer.sellerId === 'central-solar-system') {
     const csData = window.energyData.tradingData.centralSolar;
     if (csData) {
       const systemCapacity = 200; // kWh
       const percentUsed = (kWh / systemCapacity) * 100;
       
       // Reduce battery level immediately
       csData.batteryLevel = Math.max(0, csData.batteryLevel - percentUsed);
       csData.totalSold += kWh;
       window.energyData.saveData();
     }
  }

  // Update offer amount or remove if fully bought
  if (kWh >= offer.amount) {
    sellOffers.splice(offerIndex, 1); // Remove offer

    // Simulate new offer appearing after a delay
    setTimeout(() => {
      addNewRandomSellOffer();
      updateBuyOptions(); // Refresh UI
    }, 1500);

  } else {
    offer.amount -= kWh;
  }

  saveTradingOffers();

  // Show success message
  showTransactionSuccess('buy', 'Gearlaxy Pool', offer.sellerName, kWh, totalCost, mode);

  // Refresh view
  updateElectricityTrading();
}

function sellToRequest(requestId) {
  const requestIndex = buyRequests.findIndex(r => r.id === requestId);
  if (requestIndex === -1) return;

  const request = buyRequests[requestIndex];
  const amountInput = document.getElementById(`sell-amount-${requestId}`);
  const kWh = parseFloat(amountInput.value) || 0;

  if (kWh <= 0) {
    alert('กรุณาระบุจำนวนที่ต้องการขาย');
    return;
  }

  if (kWh > request.amount) {
    alert('จำนวนขายเกินกว่าที่ต้องการซื้อ');
    return;
  }

  // Check sufficient reserve energy
  const transactions = window.energyData.transactions || [];
  const totalBought = transactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.kWh, 0);
  const totalSold = transactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.kWh, 0);
  const currentReserve = totalBought - totalSold;

  if (kWh > currentReserve) {
    showTransactionError('พลังงานสำรองไม่เพียงพอ!', `มีอยู่: ${currentReserve.toLocaleString()} kWh <br>ต้องการขาย: ${kWh.toLocaleString()} kWh <br><span style="font-size:0.8em; opacity:0.8">คำแนะนำ: กรุณารับซื้อไฟเพิ่มก่อน</span>`);
    return;
  }

  // Use price mode selected by buyer
  const mode = request.priceMode;
  const price = window.energyData.getSellPriceToBuyer(mode);
  const totalRevenue = kWh * price;

  // Record transaction
  window.energyData.recordTransaction({
    type: 'sell',
    sellerId: 'middleman',
    sellerName: 'Gearlaxy Pool',
    buyerId: request.buyerId,
    buyerName: request.buyerName,
    kWh: kWh,
    price: price,
    totalRevenue: totalRevenue,
    pricingMode: mode,
    timestamp: new Date().toISOString()
  });

  // Update request amount or remove if fully sold
  if (kWh >= request.amount) {
    buyRequests.splice(requestIndex, 1); // Remove request

    // Simulate new request appearing after a delay
    setTimeout(() => {
      addNewRandomBuyRequest();
      updateSellOptions(); // Refresh UI
    }, 1500);

  } else {
    request.amount -= kWh;
  }

  saveTradingOffers();

  // Show success message
  showTransactionSuccess('sell', 'Gearlaxy Pool', request.buyerName, kWh, totalRevenue, mode);

  // Refresh view
  updateElectricityTrading();
}

// Show error notification
function showTransactionError(title, message) {
  // Create stylized alert
  const alertHtml = `
    <div style="position: fixed; top: 20px; right: 20px; z-index: 9999; background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-left: 5px solid #ef4444; display: flex; align-items: center; gap: 1rem; min-width: 320px; animation: slideIn 0.3s ease;">
      <div style="background: #fef2f2; color: #ef4444; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div>
        <h4 style="margin: 0; font-size: 1rem; color: #1f2937;">${title}</h4>
        <p style="margin: 4px 0 0; font-size: 0.85rem; color: #6b7280; line-height: 1.4;">${message}</p>
      </div>
    </div>
  `;
  
  const div = document.createElement('div');
  div.innerHTML = alertHtml;
  document.body.appendChild(div);
  
  // Remove after 4 seconds
  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transition = 'opacity 0.5s ease';
    setTimeout(() => div.remove(), 500);
  }, 4000);
}

// Simulate adding new random sell offer
function addNewRandomSellOffer() {
  const houses = window.energyData.houses;
  const externalCompanies = [
    { name: 'SolarTech Co., Ltd.', amount: 500 },
    { name: 'GreenPower Corp.', amount: 750 },
    { name: 'EcoEnergy Thailand', amount: 300 },
    { name: 'Siam Solar', amount: 450 },
    { name: 'Clean Watts', amount: 600 }
  ];

  const isCompany = Math.random() > 0.4; // 60% chance of company

  let newOffer;
  if (isCompany) {
    const company = externalCompanies[Math.floor(Math.random() * externalCompanies.length)];
    newOffer = {
      id: offerIdCounter++,
      type: 'company',
      sellerId: `ext-${company.name}-${Date.now()}`,
      sellerName: company.name,
      amount: Math.round(company.amount * (0.8 + Math.random() * 0.4)),
      unit: 'kWh/month',
      description: 'New offer',
      isExternal: true
    };
  } else {
    // Pick random house
    const house = houses[Math.floor(Math.random() * houses.length)];
    newOffer = {
      id: offerIdCounter++,
      type: 'house',
      sellerId: house.id,
      sellerName: house.name,
      amount: Math.round(50 + Math.random() * 150),
      unit: 'kWh/month',
      solarPanels: house.solarPanels || 5,
      isExternal: false
    };
  }

  sellOffers.push(newOffer);
  saveTradingOffers();
}

// Simulate adding new random buy request
function addNewRandomBuyRequest() {
  const houses = window.energyData.houses;

  // Pick random house
  const house = houses[Math.floor(Math.random() * houses.length)];
  const preferredMode = Math.random() > 0.5 ? 'tou' : 'fixed';

  const newRequest = {
    id: offerIdCounter++,
    buyerId: house.id,
    buyerName: house.name,
    amount: Math.round(100 + Math.random() * 200),
    unit: 'kWh/month',
    priceMode: preferredMode, // Buyer chooses!
    monthlyConsumption: house.monthlyConsumption
  };

  buyRequests.push(newRequest);
  saveTradingOffers();
}

function buyFromSeller(sellerHouseId, kWh, price, mode = 'tou') {
  // Legacy function - kept for compatibility
  const sellerHouse = window.energyData.getHouse(sellerHouseId);
  const totalCost = kWh * price;
  
  window.energyData.recordTransaction({
    type: 'buy',
    sellerId: sellerHouseId,
    sellerName: sellerHouse.name,
    buyerId: 'middleman',
    buyerName: 'Gearlaxy Pool',
    kWh: kWh,
    price: price,
    totalCost: totalCost,
    pricingMode: mode,
    timestamp: new Date().toISOString()
  });
  
  showTransactionSuccess('buy', 'Gearlaxy Pool', sellerHouse.name, kWh, totalCost, mode);
  updateElectricityTrading();
}

function sellToBuyer(buyerHouseId, kWh, price, mode = 'tou') {
  // Legacy function - kept for compatibility
  const buyerHouse = window.energyData.getHouse(buyerHouseId);
  const totalRevenue = kWh * price;
  
  window.energyData.recordTransaction({
    type: 'sell',
    sellerId: 'middleman',
    sellerName: 'Gearlaxy Pool',
    buyerId: buyerHouseId,
    buyerName: buyerHouse.name,
    kWh: kWh,
    price: price,
    totalRevenue: totalRevenue,
    pricingMode: mode,
    timestamp: new Date().toISOString()
  });
  
  showTransactionSuccess('sell', 'Gearlaxy Pool', buyerHouse.name, kWh, totalRevenue, mode);
  updateElectricityTrading();
}

function showTransactionSuccess(type, userSide, partnerName, amount, total, mode) {
  const action = type === 'buy' ? 'รับซื้อสำเร็จ' : 'ขายสำเร็จ';
  const icon = type === 'buy' ? 'shopping-cart' : 'hand-holding-usd';
  const color = type === 'buy' ? '#3b82f6' : '#10b981';
  const bg = type === 'buy' ? '#eff6ff' : '#ecfdf5';
  
  // Create stylized alert
  const alertHtml = `
    <div style="position: fixed; top: 20px; right: 20px; z-index: 9999; background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-left: 5px solid ${color}; display: flex; align-items: center; gap: 1rem; min-width: 300px; animation: slideIn 0.3s ease;">
      <div style="background: ${bg}; color: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <i class="fas fa-${icon}"></i>
      </div>
      <div>
        <h4 style="margin: 0; font-size: 1rem; color: #1f2937;">${action}</h4>
        <p style="margin: 2px 0 0; font-size: 0.85rem; color: #6b7280;">${amount.toLocaleString()} kWh (${mode.toUpperCase()}) - ${total.toLocaleString()} ฿</p>
      </div>
    </div>
  `;
  
  const div = document.createElement('div');
  div.innerHTML = alertHtml;
  document.body.appendChild(div);
  
  // Remove after 3 seconds
  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transition = 'opacity 0.5s ease';
    setTimeout(() => div.remove(), 500);
  }, 3000);
}

// ===================================
// Transaction History
// ===================================

function updateTransactionHistory() {
  const transactions = window.energyData.getTransactions();
  const container = document.getElementById('transaction-history');

  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-receipt"></i>
        <p>No transactions yet</p>
      </div>
    `;
    return;
  }

  // Show last 5 transactions
  const recentTransactions = transactions.slice(-5).reverse();

  let html = '<div class="transaction-list">';
  recentTransactions.forEach(tx => {
    const icon = tx.type === 'buy' ? 'shopping-cart' : 'hand-holding-usd';
    const color = tx.type === 'buy' ? 'primary' : 'success';
    const date = new Date(tx.timestamp);
    const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    html += `
      <div class="transaction-item">
        <div class="transaction-icon ${color}">
          <i class="fas fa-${icon}"></i>
        </div>
        <div class="transaction-details">
          <div class="transaction-title">
            ${tx.type === 'buy' ? 'Bought from' : 'Sold to'} ${tx.type === 'buy' ? tx.sellerName : tx.buyerName}
          </div>
          <div class="transaction-meta">
            ${tx.kWh.toFixed(2)} kWh @ ${tx.price.toFixed(2)} ฿/kWh • ${timeStr}
          </div>
        </div>
        <div class="transaction-amount ${color}">
          ${tx.type === 'buy' ? '-' : '+'}${(tx.totalCost || tx.totalRevenue).toFixed(2)} ฿
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

// ===================================
// Buy Transaction History
// ===================================

function updateBuyTransactionHistory() {
  const transactions = window.energyData.getTransactions().filter(tx => tx.type === 'buy');
  const container = document.getElementById('buy-transaction-history');

  if (!container) return;

  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-receipt"></i>
        <p>No purchases yet</p>
      </div>
    `;
    return;
  }

  // Show last 5 transactions
  const recentTransactions = transactions.slice(-5).reverse();

  let html = '<div class="transaction-list">';
  recentTransactions.forEach(tx => {
    const date = new Date(tx.timestamp);
    const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    html += `
      <div class="transaction-item">
        <div class="transaction-icon primary">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <div class="transaction-details">
          <div class="transaction-title">
            Bought from ${tx.sellerName}
          </div>
          <div class="transaction-meta">
            ${tx.kWh.toFixed(2)} kWh @ ${tx.price.toFixed(2)} ฿/kWh • ${timeStr}
          </div>
        </div>
        <div class="transaction-amount primary">
          -${tx.totalCost.toFixed(2)} ฿
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

// ===================================
// Sell Transaction History
// ===================================

function updateSellTransactionHistory() {
  const transactions = window.energyData.getTransactions().filter(tx => tx.type === 'sell');
  const container = document.getElementById('sell-transaction-history');

  if (!container) return;

  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-receipt"></i>
        <p>No sales yet</p>
      </div>
    `;
    return;
  }

  // Show last 5 transactions
  const recentTransactions = transactions.slice(-5).reverse();

  let html = '<div class="transaction-list">';
  recentTransactions.forEach(tx => {
    const date = new Date(tx.timestamp);
    const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    html += `
      <div class="transaction-item">
        <div class="transaction-icon success">
          <i class="fas fa-hand-holding-usd"></i>
        </div>
        <div class="transaction-details">
          <div class="transaction-title">
            Sold to ${tx.buyerName}
          </div>
          <div class="transaction-meta">
            ${tx.kWh.toFixed(2)} kWh @ ${tx.price.toFixed(2)} ฿/kWh • ${timeStr}
          </div>
        </div>
        <div class="transaction-amount success">
          +${tx.totalRevenue.toFixed(2)} ฿
        </div>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

// ===================================
// Trading Analytics
// ===================================

function updateTradingAnalytics() {
  const transactions = window.energyData.getTransactions();

  let totalSavings = 0;
  let totalProfit = 0;
  let totalVolume = 0;

  transactions.forEach(tx => {
    if (tx.type === 'buy') {
      totalSavings += tx.savings || 0;
    } else {
      totalProfit += tx.profit || 0;
    }
    totalVolume += tx.kWh;
  });

  document.getElementById('total-savings').textContent = totalSavings.toFixed(2) + ' ฿';
  document.getElementById('total-profit').textContent = totalProfit.toFixed(2) + ' ฿';
  document.getElementById('trading-volume').textContent = totalVolume.toFixed(2) + ' kWh';
  document.getElementById('transaction-count').textContent = transactions.length;

  // Update transaction history
  updateTransactionHistory();
}

// ===================================
// Utility Functions
// ===================================

function populateHouseSelectors() {
  const buyerSelect = document.getElementById('buyer-house-select');
  const sellerSelect = document.getElementById('seller-house-select');

  buyerSelect.innerHTML = '<option value="">-- Select Your House --</option>';
  sellerSelect.innerHTML = '<option value="">-- Select Your House --</option>';

  window.energyData.houses.forEach(house => {
    const buyerOption = document.createElement('option');
    buyerOption.value = house.id;
    buyerOption.textContent = house.name;
    if (buyerSelect) buyerSelect.appendChild(buyerOption);

    const sellerOption = document.createElement('option');
    sellerOption.value = house.id;
    sellerOption.textContent = house.name;
    if (sellerSelect) sellerSelect.appendChild(sellerOption);
  });
}

// ===================================
// Profit Analysis & Energy Reserve
// ===================================

let plRevenueChart = null;
let plVolumeChart = null;

function updateReserveEnergyDisplay() {
  const transactions = window.energyData.transactions || [];
  
  let totalBought = 0;
  let totalSold = 0;
  
  transactions.forEach(tx => {
    if (tx.type === 'buy') {
      totalBought += tx.kWh;
    } else if (tx.type === 'sell') {
      totalSold += tx.kWh;
    }
  });
  
  // Calculate energy reserve (what we bought minus what we sold)
  // Assuming we start with some base reserve or just track trading flow
  const energyReserve = totalBought - totalSold;
  
  // Format with commas and 2 decimals
  const displayValue = energyReserve.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) + ' kWh';
  
  const buyReserveEl = document.getElementById('buy-reserve-energy');
  const sellReserveEl = document.getElementById('sell-reserve-energy');
  
  if (buyReserveEl) buyReserveEl.textContent = displayValue;
  if (sellReserveEl) sellReserveEl.textContent = displayValue;
  
  // Update color based on reserve status
  const color = energyReserve >= 0 ? '#10b981' : '#ef4444'; // Green if positive, Red if negative
  if (buyReserveEl) buyReserveEl.style.color = color;
  if (sellReserveEl) sellReserveEl.style.color = color;
}

function updateProfitAnalysis() {
  const transactions = window.energyData.transactions || [];
  
  let totalBuyVolume = 0;
  let totalBuyCost = 0;
  let totalSellVolume = 0;
  let totalSellRevenue = 0;
  
  transactions.forEach(tx => {
    if (tx.type === 'buy') {
      totalBuyVolume += tx.kWh;
      totalBuyCost += (tx.totalCost || (tx.kWh * tx.price));
    } else if (tx.type === 'sell') {
      totalSellVolume += tx.kWh;
      totalSellRevenue += (tx.totalRevenue || (tx.kWh * tx.price));
    }
  });
  
  const netProfit = totalSellRevenue - totalBuyCost;
  const energyHolding = totalBuyVolume - totalSellVolume;
  
  // Calculate margin
  const marginPercent = totalSellRevenue > 0 ? (netProfit / totalSellRevenue) * 100 : 0;
  
  // Update DOM elements
  const elBuyVol = document.getElementById('pl-total-buy-volume');
  const elBuyCost = document.getElementById('pl-total-buy-cost');
  const elSellVol = document.getElementById('pl-total-sell-volume');
  const elSellRev = document.getElementById('pl-total-sell-revenue');
  const elHolding = document.getElementById('pl-energy-holding');
  const elProfit = document.getElementById('pl-net-profit');
  const elProfitPct = document.getElementById('pl-profit-percent');
  
  if (elBuyVol) elBuyVol.textContent = totalBuyVolume.toLocaleString() + ' kWh';
  if (elBuyCost) elBuyCost.textContent = '-' + totalBuyCost.toLocaleString(undefined, {minimumFractionDigits: 2}) + ' ฿';
  
  if (elSellVol) elSellVol.textContent = totalSellVolume.toLocaleString() + ' kWh';
  if (elSellRev) elSellRev.textContent = '+' + totalSellRevenue.toLocaleString(undefined, {minimumFractionDigits: 2}) + ' ฿';
  
  if (elHolding) elHolding.textContent = energyHolding.toLocaleString() + ' kWh';
  
  if (elProfit) {
    const sign = netProfit >= 0 ? '+' : '';
    elProfit.textContent = sign + netProfit.toLocaleString(undefined, {minimumFractionDigits: 2}) + ' ฿';
    // elProfit.style.color = netProfit >= 0 ? '#fbbf24' : '#ef4444'; // Gold or Red
    // Inherit from parent which is controlled by CSS class
  }
  
  if (elProfitPct) {
    const sign = marginPercent >= 0 ? '+' : '';
    // Fix for Infinity or NaN
    const displayPercent = isFinite(marginPercent) ? sign + marginPercent.toFixed(1) : '0.0';
    elProfitPct.innerHTML = `<i class="fas fa-chart-line"></i> <span>Margin: ${displayPercent}%</span>`;
    elProfitPct.className = marginPercent >= 0 ? 'stat-change positive' : 'stat-change negative';
  }
  
  updateProfitCharts(transactions);
  updateTransactionTable(transactions);
}

function updateProfitCharts(transactions) {
  const ctxRevenue = document.getElementById('pl-revenue-chart');
  const ctxVolume = document.getElementById('pl-volume-chart');
  
  if (!ctxRevenue || !ctxVolume) return;
  
  // Create labels from transactions (simplified to sequential 1, 2, 3...)
  const labels = transactions.map((_, i) => `Tx ${i + 1}`);
  
  // Cumulative calculations
  let cumRevenue = 0;
  let cumCost = 0;
  const dataRevenue = [];
  const dataCost = [];
  
  let cumBuyVol = 0;
  let cumSellVol = 0;
  const dataBuyVol = [];
  const dataSellVol = [];
  
  transactions.forEach(tx => {
    if (tx.type === 'buy') {
      cumCost += (tx.totalCost || (tx.kWh * tx.price));
      cumBuyVol += tx.kWh;
      // Revenue stays same, Sell vol stays same
    } else {
      cumRevenue += (tx.totalRevenue || (tx.kWh * tx.price));
      cumSellVol += tx.kWh;
      // Cost stays same, Buy vol stays same
    }
    dataRevenue.push(cumRevenue);
    dataCost.push(cumCost);
    dataBuyVol.push(cumBuyVol);
    dataSellVol.push(cumSellVol);
  });
  
  // Destroy existing charts if they exist
  if (plRevenueChart) plRevenueChart.destroy();
  if (plVolumeChart) plVolumeChart.destroy();
  
  // Revenue Chart
  plRevenueChart = new Chart(ctxRevenue, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Cumulative Revenue (Income)',
          data: dataRevenue,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Cumulative Cost (Expense)',
          data: dataCost,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        },
        x: { display: false }
      }
    }
  });
  
  // Volume Chart
  plVolumeChart = new Chart(ctxVolume, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total Buy Volume',
          data: dataBuyVol,
          backgroundColor: '#3b82f6',
        },
        {
          label: 'Total Sell Volume',
          data: dataSellVol,
          backgroundColor: '#f59e0b',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        },
        x: { display: false }
      }
    }
  });
}

function updateTransactionTable(transactions) {
  const container = document.getElementById('pl-transaction-list');
  if (!container) return;
  
  if (transactions.length === 0) {
    container.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No transactions recorded yet</td></tr>`;
    return;
  }
  
  // Show last 20 transactions, reversed
  const recentTx = [...transactions].reverse().slice(0, 20);
  
  let html = '';
  
  recentTx.forEach(tx => {
    const isBuy = tx.type === 'buy';
    const amount = tx.totalCost || tx.totalRevenue || (tx.kWh * tx.price);
    const sign = isBuy ? '-' : '+';
    const colorClass = isBuy ? 'text-danger' : 'text-success';
    const typeLabel = isBuy ? '<span class="badge badge-primary">Buy</span>' : '<span class="badge badge-success">Sell</span>';
    const partner = isBuy ? tx.sellerName : tx.buyerName;
    
    // Simple formatted date
    const date = new Date(tx.timestamp);
    const dateStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    
    html += `
      <tr>
        <td>${dateStr}</td>
        <td>${typeLabel}</td>
        <td>${partner}</td>
        <td>${tx.kWh.toLocaleString()}</td>
        <td>${tx.price.toFixed(2)}</td>
        <td class="${colorClass}">${sign}${amount.toLocaleString()}</td>
        <td><span class="text-muted">-</span></td> 
      </tr>
    `;
  });
  
  container.innerHTML = html;
}

// Function called by Central Solar System to update its sell offer
function updateCentralSolarOffer(availableAmount) {
  // Find existing offer from Central Solar
  const existingIndex = sellOffers.findIndex(o => o.sellerId === 'central-solar-system');
  
  // Ensure we don't spam updates if amount hasn't changed significantly (threshold 1 kWh)
  if (existingIndex >= 0 && Math.abs(sellOffers[existingIndex].amount - availableAmount) < 1) {
    return;
  }
  
  if (availableAmount > 5) { // Only offer if significant amount > 5 kWh
    if (existingIndex >= 0) {
      // Update existing offer
      sellOffers[existingIndex].amount = Math.round(availableAmount);
    } else {
      // Create new offer
      const centralOffer = {
        id: 9999, // Special ID
        sellerId: 'central-solar-system',
        sellerName: 'Central Solar System',
        amount: Math.round(availableAmount),
        unit: 'kWh',
        isExternal: true,
        type: 'central'
      };
      
      // Add to top of array
      sellOffers.unshift(centralOffer);
    }
  } else {
    // If low amount, remove offer
    if (existingIndex >= 0) {
      sellOffers.splice(existingIndex, 1);
    }
  }
}

// ===================================
// Market Simulation & Auto-Refresh
// ===================================

let marketSimulationInterval = null;

function startMarketSimulation() {
  // Clear existing interval if any
  if (marketSimulationInterval) {
    clearInterval(marketSimulationInterval);
  }

  // Auto-refresh every 5 seconds
  marketSimulationInterval = setInterval(() => {
    // Randomly add new offers or remove old ones to simulate market dynamics
    simulateMarketChanges();
    
    // Update UI
    updateElectricityTrading();
  }, 5000); // 5 seconds

  console.log('✅ Market Simulation Started - Auto-refresh every 5 seconds');
}

function simulateMarketChanges() {
  // Random chance to add new sell offer
  if (Math.random() > 0.7 && sellOffers.length < 15) {
    addNewRandomSellOffer();
  }

  // Random chance to add new buy request
  if (Math.random() > 0.7 && buyRequests.length < 15) {
    addNewRandomBuyRequest();
  }

  // Random chance to remove an offer (someone withdrew or sold out)
  if (Math.random() > 0.85 && sellOffers.length > 3) {
    const randomIndex = Math.floor(Math.random() * sellOffers.length);
    sellOffers.splice(randomIndex, 1);
  }

  // Random chance to remove a request (someone bought elsewhere)
  if (Math.random() > 0.85 && buyRequests.length > 3) {
    const randomIndex = Math.floor(Math.random() * buyRequests.length);
    buyRequests.splice(randomIndex, 1);
  }

  // Save changes
  saveTradingOffers();
}
