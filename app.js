// ===================================
// Main Application Controller
// Campus Community Energy Data
// ===================================

class App {
  constructor() {
    this.currentPage = 'dashboard';
    this.init();
  }

  init() {
    // Setup navigation
    this.setupNavigation();

    // Initialize all pages
    this.initializePages();

    // Listen for data updates (every 3 seconds from real-time updates)
    window.addEventListener('dataUpdated', () => {
      this.refreshCurrentPage();
    });

    // ⭐ Listen for solar allocation changes (immediate update)
    window.addEventListener('solarAllocationChanged', () => {
      // Refresh all pages to show updated solar power distribution
      this.refreshAllPages();
    });
    
    // ⭐ Listen for language changes (immediate update)
    window.addEventListener('languageChanged', () => {
      // Refresh all pages to show updated language
      this.refreshAllPages();
    });

    console.log('✅ Campus Community Energy Data - Application Initialized');
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.getAttribute('data-page');
        this.navigateTo(pageId);
      });
    });
  }

  navigateTo(pageId) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

    // Update active page
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    this.currentPage = pageId;
    this.refreshCurrentPage();
  }

  initializePages() {
    // Initialize Dashboard
    if (typeof initDashboard === 'function') {
      initDashboard();
    }

    // Initialize Digital Twin
    if (typeof initDigitalTwin === 'function') {
      initDigitalTwin();
    }

    // Initialize Solar Control
    if (typeof initSolarControl === 'function') {
      initSolarControl();
    }

    // Initialize EV Management
    if (typeof initEVManagement === 'function') {
      initEVManagement();
    }

    // Initialize Usage History
    if (typeof initUsageHistory === 'function') {
      initUsageHistory();
    }
  }

  refreshCurrentPage() {
    switch (this.currentPage) {
      case 'dashboard':
        if (typeof updateDashboard === 'function') {
          updateDashboard();
        }
        break;
      case 'digital-twin':
        if (typeof updateDigitalTwin === 'function') {
          updateDigitalTwin();
        }
        break;
      case 'solar-control':
        if (typeof updateSolarControl === 'function') {
          updateSolarControl();
        }
        break;
      case 'ev-management':
        if (typeof updateEVManagement === 'function') {
          updateEVManagement();
        }
        break;
      case 'usage-history':
        if (typeof updateHistory === 'function') {
          updateHistory();
        }
        break;
    }
  }

  // ⭐ NEW: Refresh all pages (used when solar allocation changes)
  refreshAllPages() {
    // Update Dashboard
    if (typeof updateDashboard === 'function') {
      updateDashboard();
    }

    // Update Digital Twin
    if (typeof updateDigitalTwin === 'function') {
      updateDigitalTwin();
    }

    // Update Solar Control
    if (typeof updateSolarControl === 'function') {
      updateSolarControl();
    }

    // Update EV Management
    if (typeof updateEVManagement === 'function') {
      updateEVManagement();
    }

    // Update Usage History
    if (typeof updateHistory === 'function') {
      updateHistory();
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
