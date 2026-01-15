// ===================================
// Chart Utilities
// Campus Community Energy Data
// ===================================

class ChartManager {
  constructor() {
    this.charts = {};
    this.defaultColors = {
      primary: '#00d4ff',
      secondary: '#7c3aed',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6'
    };
  }

  // Create line chart
  createLineChart(canvasId, data, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    // Destroy existing chart if exists
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#a0aec0',
            font: { family: 'DynaPuff', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(30, 35, 60, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#a0aec0',
          borderColor: '#00d4ff',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += context.parsed.y.toFixed(2);
              label += ' ' + (options.unit || 'kWh');
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#718096',
            font: { family: 'DynaPuff', size: 11 }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#718096',
            font: { family: 'DynaPuff', size: 11 },
            callback: function(value) {
              return value + ' ' + (options.unit || 'kWh');
            }
          },
          beginAtZero: true
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };

    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: data,
      options: { ...defaultOptions, ...options.chartOptions }
    });

    return this.charts[canvasId];
  }

  // Create bar chart
  createBarChart(canvasId, data, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#a0aec0',
            font: { family: 'DynaPuff', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(30, 35, 60, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#a0aec0',
          borderColor: '#00d4ff',
          borderWidth: 1,
          padding: 12
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: '#718096',
            font: { family: 'DynaPuff', size: 11 }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#718096',
            font: { family: 'DynaPuff', size: 11 }
          },
          beginAtZero: true
        }
      }
    };

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: { ...defaultOptions, ...options.chartOptions }
    });

    return this.charts[canvasId];
  }

  // Create pie/doughnut chart
  createPieChart(canvasId, data, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#a0aec0',
            font: { family: 'DynaPuff', size: 12 },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(30, 35, 60, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#a0aec0',
          borderColor: '#00d4ff',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toFixed(2)} kW (${percentage}%)`;
            }
          }
        }
      }
    };

    this.charts[canvasId] = new Chart(ctx, {
      type: options.type || 'doughnut',
      data: data,
      options: { ...defaultOptions, ...options.chartOptions }
    });

    return this.charts[canvasId];
  }

  // Update chart data
  updateChart(canvasId, newData) {
    if (this.charts[canvasId]) {
      this.charts[canvasId].data = newData;
      this.charts[canvasId].update('none'); // Update without animation for real-time
    }
  }

  // Destroy chart
  destroyChart(canvasId) {
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
      delete this.charts[canvasId];
    }
  }

  // Generate gradient
  createGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
  }

  // Get chart colors array
  getColorArray(count) {
    const colors = [
      '#00d4ff', '#7c3aed', '#10b981', '#f59e0b', 
      '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899',
      '#14b8a6', '#f97316', '#06b6d4', '#a855f7'
    ];
    return colors.slice(0, count);
  }

  // Create real-time line chart with animation
  createRealTimeChart(canvasId, maxDataPoints = 20) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const data = {
      labels: [],
      datasets: [{
        label: 'Real-time Consumption',
        data: [],
        borderColor: this.defaultColors.primary,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5
      }]
    };

    const chart = this.createLineChart(canvasId, data, {
      unit: 'kW',
      chartOptions: {
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        }
      }
    });

    // Add method to update real-time data
    chart.addDataPoint = function(label, value) {
      this.data.labels.push(label);
      this.data.datasets[0].data.push(value);

      if (this.data.labels.length > maxDataPoints) {
        this.data.labels.shift();
        this.data.datasets[0].data.shift();
      }

      this.update('none');
    };

    return chart;
  }
}

// Create global instance
window.chartManager = new ChartManager();
