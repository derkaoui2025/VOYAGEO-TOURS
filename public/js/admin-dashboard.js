// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Theme toggler
  const themeToggler = document.getElementById('theme-toggle');
  if (themeToggler) {
    themeToggler.addEventListener('change', function() {
      if (this.checked) {
        document.documentElement.setAttribute('data-theme', 'corporate');
        localStorage.setItem('theme', 'corporate');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    });
    
    // Set initial theme based on localStorage or system preference
    const savedTheme = localStorage.getItem('theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'corporate' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggler.checked = savedTheme === 'corporate';
  }
  
  // Mobile sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('-translate-x-full');
      sidebarOverlay.classList.toggle('hidden');
      document.body.classList.toggle('overflow-hidden');
    });
    
    sidebarOverlay.addEventListener('click', function() {
      sidebar.classList.add('-translate-x-full');
      sidebarOverlay.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    });
  }
  
  // Initialize charts if they exist
  initializeCharts();
});

function initializeCharts() {
  // Booking overview chart
  const bookingChartEl = document.getElementById('booking-overview-chart');
  if (bookingChartEl) {
    const ctx = bookingChartEl.getContext('2d');
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Bookings',
          data: [65, 59, 80, 81, 56, 55, 70, 75, 82, 80, 90, 100],
          borderColor: '#0066c0',
          backgroundColor: 'rgba(0, 102, 192, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
  
  // Revenue chart
  const revenueChartEl = document.getElementById('revenue-chart');
  if (revenueChartEl) {
    const ctx = revenueChartEl.getContext('2d');
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Revenue',
          data: [8500, 7600, 10200, 9800, 12400, 14500],
          backgroundColor: '#00ba9d',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
  
  // Popular tours chart
  const toursChartEl = document.getElementById('popular-tours-chart');
  if (toursChartEl) {
    const ctx = toursChartEl.getContext('2d');
    
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Moroccan Desert Safari', 'Atlas Mountains Trek', 'Marrakech City Tour', 'Essaouira Beach Trip', 'Other Tours'],
        datasets: [{
          data: [35, 25, 15, 10, 15],
          backgroundColor: ['#ff9900', '#0066c0', '#00ba9d', '#f59e0b', '#6e7687'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 12
            }
          }
        }
      }
    });
  }
  
  // Initialize counter animations
  animateCounters();
}

function animateCounters() {
  const counters = document.querySelectorAll('.stat-counter');
  
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    const duration = 1500;
    const step = (target / duration) * 10;
    
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        counter.textContent = target.toLocaleString();
        clearInterval(timer);
      } else {
        counter.textContent = Math.floor(current).toLocaleString();
      }
    }, 10);
  });
} 