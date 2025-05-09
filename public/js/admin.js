/**
 * VOYAGEO-TOURS - Admin Dashboard JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
  // Login Form Handler
  initLoginForm();
  
  // Mobile responsive handlers
  initResponsiveLayout();
  
  // Dashboard interactions
  initDashboardInteractions();
  
  // Form handling
  initFormHandlers();
  
  // File uploads
  initFileUploads();
  
  // Dynamic form elements (itinerary)
  initDynamicForms();
});

/**
 * Login Form Handler
 */
function initLoginForm() {
  const loginForm = document.getElementById('login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const errorContainer = document.getElementById('error-message');
      const submitButton = document.querySelector('button[type="submit"]');
      
      // Disable button and show loading state
      submitButton.disabled = true;
      submitButton.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Signing in...';
      
      // Send AJAX request
      fetch('/admin/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'same-origin'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          window.location.href = data.redirect;
        } else {
          // Show error message
          if (errorContainer) {
            errorContainer.textContent = data.message;
            errorContainer.classList.remove('hidden');
          }
          
          // Reset button
          submitButton.disabled = false;
          submitButton.textContent = 'Sign in';
        }
      })
      .catch(error => {
        console.error('Error:', error);
        
        // Show generic error message
        if (errorContainer) {
          errorContainer.textContent = 'An error occurred. Please try again.';
          errorContainer.classList.remove('hidden');
        }
        
        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = 'Sign in';
      });
    });
  }
}

/**
 * Responsive Layout Initialization
 */
function initResponsiveLayout() {
  // Mobile sidebar toggle handlers
  const mobileToggle = document.getElementById('mobile-sidebar-toggle');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.admin-sidebar');
  
  if (mobileToggle) {
    mobileToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.toggle('sidebar-mobile-open');
      console.log('Mobile toggle clicked, sidebar open:', document.body.classList.contains('sidebar-mobile-open'));
    });
  }
  
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.remove('sidebar-mobile-open');
      console.log('Sidebar close button clicked');
    });
  }
  
  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', function(event) {
    const mobileToggleBtn = document.getElementById('mobile-sidebar-toggle');
    
    if (window.innerWidth < 992 && 
        document.body.classList.contains('sidebar-mobile-open') && 
        sidebar && !sidebar.contains(event.target) && 
        mobileToggleBtn && event.target !== mobileToggleBtn) {
      document.body.classList.remove('sidebar-mobile-open');
      console.log('Clicked outside, closing sidebar');
    }
  });
  
  // Handle responsive tables
  makeTablesResponsive();
  
  // Adjust layout on resize
  window.addEventListener('resize', function() {
    if (window.innerWidth > 991 && document.body.classList.contains('sidebar-mobile-open')) {
      document.body.classList.remove('sidebar-mobile-open');
    }
  });
}

/**
 * Make tables responsive
 */
function makeTablesResponsive() {
  const tables = document.querySelectorAll('table.table');
  
  tables.forEach(table => {
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    
    // Add data-label attributes to each cell based on its column header
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (headers[index]) {
          cell.setAttribute('data-label', headers[index]);
        }
      });
    });
    
    // Add responsive class to table
    table.classList.add('table-responsive');
  });
}

/**
 * Dashboard Interactions
 */
function initDashboardInteractions() {
  // User dropdown toggle
  const userDropdown = document.querySelector('.user-dropdown');
  const userToggle = document.querySelector('.user-toggle');
  
  if (userToggle && userDropdown) {
    userToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      userDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!userDropdown.contains(e.target)) {
        userDropdown.classList.remove('active');
      }
    });
  }
  
  // Add block IP functionality on the dashboard (if admin)
  const blockIpForm = document.getElementById('block-ip-form');
  
  if (blockIpForm) {
    blockIpForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      const ip = document.getElementById('ip-address').value;
      const reason = document.getElementById('block-reason').value;
      const resultMessage = document.getElementById('block-result');
      
      fetch('/admin/api/block-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip, reason }),
        credentials: 'same-origin'
      })
      .then(response => response.json())
      .then(data => {
        if (resultMessage) {
          resultMessage.textContent = data.message;
          resultMessage.classList.remove('hidden');
          
          if (data.success) {
            resultMessage.classList.add('text-green-500');
            resultMessage.classList.remove('text-red-500');
            document.getElementById('ip-address').value = '';
            document.getElementById('block-reason').value = '';
          } else {
            resultMessage.classList.add('text-red-500');
            resultMessage.classList.remove('text-green-500');
          }
        }
      })
      .catch(error => {
        console.error('Error:', error);
        if (resultMessage) {
          resultMessage.textContent = 'An error occurred. Please try again.';
          resultMessage.classList.add('text-red-500');
          resultMessage.classList.remove('hidden', 'text-green-500');
        }
      });
    });
  }
}

/**
 * Form Handlers
 */
function initFormHandlers() {
  // Form validation
  const forms = document.querySelectorAll('.needs-validation');
  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  });

  // Confirm delete
  const deleteButtons = document.querySelectorAll('.delete-confirm');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        event.preventDefault();
      }
    });
  });

  // Includes and excludes line handling
  const formatTextareas = document.querySelectorAll('.format-lines');
  formatTextareas.forEach(textarea => {
    textarea.addEventListener('input', function() {
      // Remove empty lines
      const lines = this.value.split('\n').filter(line => line.trim() !== '');
      this.value = lines.join('\n');
    });
  });
}

/**
 * File Upload Handlers
 */
function initFileUploads() {
  // File upload preview
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
    input.addEventListener('change', function(event) {
      const preview = document.querySelector(`#${this.id}-preview`);
      if (preview && this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  });

  // Image upload validation
  const imageInputs = document.querySelectorAll('input[type="file"][accept*="image"]');
  imageInputs.forEach(input => {
    input.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        // Check file type
        const fileType = file.type;
        if (!fileType.startsWith('image/')) {
          alert('Please select an image file.');
          this.value = '';
          return;
        }
        
        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          alert('File size exceeds 5MB. Please select a smaller image.');
          this.value = '';
        }
      }
    });
  });
}

/**
 * Dynamic Form Elements
 */
function initDynamicForms() {
  // Itinerary form handling
  const addItineraryBtn = document.getElementById('add-itinerary');
  if (addItineraryBtn) {
    addItineraryBtn.addEventListener('click', function() {
      const itineraryContainer = document.getElementById('itinerary-container');
      const nextDay = itineraryContainer.querySelectorAll('.itinerary-item').length + 1;
      
      const newItem = document.createElement('div');
      newItem.className = 'itinerary-item';
      newItem.innerHTML = `
        <div class="itinerary-header">
          <div class="itinerary-day">Day ${nextDay}</div>
          <button type="button" class="btn btn-sm btn-danger remove-itinerary">
            <i class="fas fa-times"></i> Remove
          </button>
        </div>
        <div class="form-group">
          <label class="form-label">Title</label>
          <input type="hidden" name="itinerary[${nextDay-1}][day]" value="${nextDay}" />
          <input type="text" class="form-control" name="itinerary[${nextDay-1}][title]" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-control" name="itinerary[${nextDay-1}][description]" required></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Distance (optional)</label>
          <input type="text" class="form-control" name="itinerary[${nextDay-1}][distance]" />
        </div>
        <div class="form-group">
          <label class="form-label">Highlights (one per line)</label>
          <textarea class="form-control" name="itinerary[${nextDay-1}][highlights]"></textarea>
        </div>
      `;
      
      itineraryContainer.appendChild(newItem);
      
      // Add event listener to new remove button
      const removeBtn = newItem.querySelector('.remove-itinerary');
      removeBtn.addEventListener('click', function() {
        itineraryContainer.removeChild(newItem);
        // Renumber days
        renumberItineraryDays();
      });
    });
  }

  // Add event listeners to existing remove buttons
  document.querySelectorAll('.remove-itinerary').forEach(btn => {
    btn.addEventListener('click', function() {
      const itineraryItem = this.closest('.itinerary-item');
      itineraryItem.parentNode.removeChild(itineraryItem);
      // Renumber days
      renumberItineraryDays();
    });
  });
}

/**
 * Renumber itinerary days
 */
function renumberItineraryDays() {
  const items = document.querySelectorAll('.itinerary-item');
  items.forEach((item, index) => {
    const dayNum = index + 1;
    item.querySelector('.itinerary-day').textContent = `Day ${dayNum}`;
    item.querySelector('input[name*="[day]"]').value = dayNum;
    
    // Update all input names in this item
    const inputs = item.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      const name = input.getAttribute('name');
      if (name) {
        const newName = name.replace(/itinerary\[\d+\]/, `itinerary[${index}]`);
        input.setAttribute('name', newName);
      }
    });
  });
} 