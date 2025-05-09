/**
 * VOYAGEO-TOURS - Amazon-Inspired Form Functionality
 * For admin dashboard forms
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const form = document.querySelector('form');
    const tourForm = document.getElementById('newTourForm');
    const formOverlay = document.getElementById('formOverlay');
    const backToTopBtn = document.getElementById('backToTop');
    let formChanged = false;
    
    // Initialize Select2 dropdowns if available
    if ($.fn.select2) {
        $('.select2').select2({
            theme: 'classic',
            width: '100%',
            dropdownCssClass: 'amazon-select-dropdown'
        });
    }
    
    // Real-time validation for each input field
    if (form) {
        const validateInput = (input) => {
            // Skip validation if not required
            if (!input.hasAttribute('required')) return true;
            
            let isValid = true;
            const errorElement = input.nextElementSibling;
            
            // Get parent form group
            const formGroup = input.closest('.form-group');
            
            // Clear previous validation state
            if (formGroup) {
                formGroup.classList.remove('has-error', 'has-success');
            }
            
            // Basic validation based on input type
            if (input.value.trim() === '') {
                isValid = false;
                if (errorElement && errorElement.classList.contains('invalid-feedback')) {
                    errorElement.style.display = 'block';
                }
                if (formGroup) {
                    formGroup.classList.add('has-error');
                }
            } else {
                // Type-specific validation
                if (input.type === 'number' && isNaN(parseFloat(input.value))) {
                    isValid = false;
                    if (errorElement && errorElement.classList.contains('invalid-feedback')) {
                        errorElement.style.display = 'block';
                    }
                    if (formGroup) {
                        formGroup.classList.add('has-error');
                    }
                } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
                    isValid = false;
                    if (errorElement && errorElement.classList.contains('invalid-feedback')) {
                        errorElement.style.display = 'block';
                    }
                    if (formGroup) {
                        formGroup.classList.add('has-error');
                    }
                } else {
                    // Valid input
                    if (errorElement && errorElement.classList.contains('invalid-feedback')) {
                        errorElement.style.display = 'none';
                    }
                    if (formGroup) {
                        formGroup.classList.add('has-success');
                    }
                }
            }
            
            return isValid;
        };
        
        // Add real-time validation to all form fields
        form.querySelectorAll('input, textarea, select').forEach(input => {
            // Skip hidden inputs and buttons
            if (input.type === 'hidden' || input.type === 'button' || input.type === 'submit') {
                return;
            }
            
            // Validate on blur
            input.addEventListener('blur', () => {
                validateInput(input);
            });
            
            // Validate on input change (for immediate feedback)
            input.addEventListener('input', () => {
                if (input.classList.contains('was-validated') || input.dataset.validated === 'true') {
                    validateInput(input);
                }
            });
            
            // Mark fields as validated once user interacts with them
            input.addEventListener('focus', () => {
                input.dataset.validated = 'true';
            });
        });
    }
    
    // Collapsible form sections
    const sectionTitles = document.querySelectorAll('.section-title');
    sectionTitles.forEach(title => {
        title.addEventListener('click', function() {
            const sectionBody = this.nextElementSibling;
            
            // Toggle collapse state
            if (sectionBody.style.maxHeight) {
                sectionBody.style.maxHeight = null;
                this.classList.add('collapsed');
            } else {
                sectionBody.style.maxHeight = sectionBody.scrollHeight + 'px';
                this.classList.remove('collapsed');
            }
        });
    });
    
    // Initialize sections expanded by default
    document.querySelectorAll('.section-body').forEach(section => {
        section.style.maxHeight = section.scrollHeight + 'px';
    });
    
    // Enhanced image upload functionality
    document.querySelectorAll('.image-upload').forEach(input => {
        input.addEventListener('change', function(event) {
            const previewId = this.getAttribute('data-preview');
            const preview = document.getElementById(previewId);
            
            if (preview && this.files && this.files[0]) {
                // Validate image file
                const file = this.files[0];
                const fileType = file.type;
                const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                
                if (!validImageTypes.includes(fileType)) {
                    // Show error for invalid file type
                    const fileUploadDiv = this.closest('.file-upload');
                    const errorMsg = document.createElement('p');
                    errorMsg.className = 'text-danger mt-2';
                    errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Invalid file type. Please select an image.';
                    
                    // Remove any existing error message
                    const existingError = fileUploadDiv.querySelector('.text-danger');
                    if (existingError) {
                        existingError.remove();
                    }
                    
                    fileUploadDiv.appendChild(errorMsg);
                    this.value = ''; // Clear the input
                    return;
                }
                
                // Valid image - show preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    preview.style.opacity = '0';
                    
                    setTimeout(() => {
                        preview.style.opacity = '1';
                        
                        // Add "Image selected" label
                        const fileUploadDiv = preview.closest('.file-upload');
                        const existingLabel = fileUploadDiv.querySelector('.text-success');
                        if (!existingLabel) {
                            const label = document.createElement('p');
                            label.className = 'text-success mt-2';
                            label.innerHTML = '<i class="fas fa-check-circle"></i> Image selected';
                            fileUploadDiv.appendChild(label);
                        }
                        
                        // Remove any error message
                        const existingError = fileUploadDiv.querySelector('.text-danger');
                        if (existingError) {
                            existingError.remove();
                        }
                    }, 10);
                };
                reader.readAsDataURL(file);
            } else if (preview) {
                preview.style.display = 'none';
                
                // Remove any "Image selected" label
                const existingLabel = preview.parentNode.querySelector('.text-success');
                if (existingLabel) {
                    existingLabel.remove();
                }
            }
        });
    });
    
    // Make itinerary items sortable if Sortable.js is available
    if (typeof Sortable !== 'undefined') {
        const itineraryContainer = document.getElementById('itinerary-container');
        if (itineraryContainer) {
            new Sortable(itineraryContainer, {
                animation: 150,
                handle: '.itinerary-header',
                ghostClass: 'sortable-ghost',
                onEnd: function() {
                    reindexItineraryItems();
                }
            });
        }
    }
    
    // Add new itinerary day with enhanced animation
    const addItineraryButton = document.getElementById('add-itinerary');
    const itineraryContainer = document.getElementById('itinerary-container');

    if (addItineraryButton && itineraryContainer) {
        addItineraryButton.addEventListener('click', function() {
            // Get the current number of itinerary items
            const items = itineraryContainer.querySelectorAll('.itinerary-item');
            const newIndex = items.length;
            
            // Calculate the next day number
            const nextDay = items.length > 0 ? 
                parseInt(items[items.length - 1].querySelector('.day-input').value) + 1 : 1;
            
            // Create new itinerary item
            const newItem = document.createElement('div');
            newItem.className = 'itinerary-item';
            newItem.style.opacity = '0';
            newItem.style.transform = 'translateY(20px)';
            
            newItem.innerHTML = `
                <div class="itinerary-header">
                    <div class="itinerary-day">Day ${nextDay}</div>
                    <button type="button" class="btn btn-sm btn-danger remove-itinerary">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
                <div class="form-group">
                    <label class="form-label">Title <span class="text-danger">*</span></label>
                    <input type="hidden" name="itinerary[${newIndex}][day]" value="${nextDay}" class="day-input" />
                    <input type="text" class="form-control" name="itinerary[${newIndex}][title]" required placeholder="Enter day title" />
                </div>
                <div class="form-group">
                    <label class="form-label">Description <span class="text-danger">*</span></label>
                    <textarea class="form-control" name="itinerary[${newIndex}][description]" rows="3" required placeholder="Describe the activities for this day"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Distance (optional)</label>
                    <input type="text" class="form-control" name="itinerary[${newIndex}][distance]" placeholder="e.g. 5km" />
                </div>
                <div class="form-group">
                    <label class="form-label">Highlights (one per line)</label>
                    <textarea class="form-control format-lines" name="itinerary[${newIndex}][highlights]" rows="3" placeholder="List key attractions or activities, one per line"></textarea>
                </div>
                <div class="text-muted small mt-2">
                    <i class="fas fa-info-circle me-1"></i> Drag to reorder days
                </div>
            `;
            
            itineraryContainer.appendChild(newItem);
            
            // Add smooth appearance animation
            setTimeout(() => {
                newItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                newItem.style.opacity = '1';
                newItem.style.transform = 'translateY(0)';
            }, 10);
            
            // Scroll to the new item
            setTimeout(() => {
                newItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            
            // Attach event listener to the new remove button
            const removeButton = newItem.querySelector('.remove-itinerary');
            removeButton.addEventListener('click', removeItineraryItem);
            
            // Focus the first input in the new item
            setTimeout(() => {
                const firstInput = newItem.querySelector('input[type="text"]');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 300);
        });
    }

    // Remove itinerary item with animation
    function removeItineraryItem() {
        const itineraryItem = this.closest('.itinerary-item');
        
        // Check if it's the last item
        if (itineraryContainer && itineraryContainer.querySelectorAll('.itinerary-item').length > 1) {
            // Add removal animation
            itineraryItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            itineraryItem.style.opacity = '0';
            itineraryItem.style.transform = 'translateY(20px)';
            
            // Remove the item after animation completes
            setTimeout(() => {
                itineraryItem.remove();
                
                // Reindex the remaining items
                reindexItineraryItems();
            }, 300);
        } else {
            // Show a better-styled alert
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-warning alert-dismissible fade show';
            alertDiv.setAttribute('role', 'alert');
            alertDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>You must have at least one itinerary day.</strong>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            // Insert alert before the itinerary container
            if (itineraryContainer) {
                itineraryContainer.parentNode.insertBefore(alertDiv, itineraryContainer);
                
                // Remove alert after 3 seconds
                setTimeout(() => {
                    alertDiv.remove();
                }, 3000);
            }
        }
    }

    // Reindex itinerary items to maintain consecutive indices
    function reindexItineraryItems() {
        if (!itineraryContainer) return;
        
        const items = itineraryContainer.querySelectorAll('.itinerary-item');
        
        items.forEach((item, index) => {
            const dayInput = item.querySelector('.day-input');
            if (!dayInput) return;
            
            // Update day number in header
            const dayHeader = item.querySelector('.itinerary-day');
            if (dayHeader) {
                dayHeader.textContent = `Day ${index + 1}`;
            }
            
            // Update input name attributes for all fields in this item
            const inputs = item.querySelectorAll('input:not(.day-input), textarea');
            inputs.forEach(input => {
                const currentName = input.getAttribute('name');
                if (currentName) {
                    const newName = currentName.replace(/itinerary\[\d+\]/, `itinerary[${index}]`);
                    input.setAttribute('name', newName);
                }
            });
            
            // Update the day input value and name
            dayInput.value = index + 1;
            dayInput.setAttribute('name', `itinerary[${index}][day]`);
        });
    }

    // Attach remove event handlers to existing itinerary items
    document.querySelectorAll('.remove-itinerary').forEach(button => {
        button.addEventListener('click', removeItineraryItem);
    });
    
    // Add animated confirmation when form has been edited
    if (form) {
        form.querySelectorAll('input, textarea, select').forEach(element => {
            element.addEventListener('change', () => {
                if (!formChanged) {
                    formChanged = true;
                    
                    // Add a subtle indicator that the form has unsaved changes
                    const saveButton = document.getElementById('submitBtn');
                    if (saveButton) {
                        saveButton.classList.add('btn-pulse');
                        saveButton.setAttribute('data-unsaved', 'true');
                        
                        // Add small animation to the button
                        saveButton.animate([
                            { transform: 'scale(1)' },
                            { transform: 'scale(1.05)' },
                            { transform: 'scale(1)' }
                        ], {
                            duration: 300,
                            iterations: 1
                        });
                    }
                }
            });
        });
    }
    
    // Create Response Modal
    function createResponseModal() {
        // Check if modal already exists
        if (document.getElementById('responseModal')) return document.getElementById('responseModal');
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'responseModal';
        modal.tabIndex = '-1';
        modal.setAttribute('aria-labelledby', 'responseModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="responseModalLabel">Notification</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="response-icon text-center mb-3">
                            <i class="fas fa-check-circle text-success fa-4x success-icon" style="display: none;"></i>
                            <i class="fas fa-times-circle text-danger fa-4x error-icon" style="display: none;"></i>
                        </div>
                        <div id="responseMessage" class="text-center mb-3"></div>
                    </div>
                    <div class="modal-footer justify-content-center">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <a id="primaryActionBtn" href="#" class="btn btn-primary" style="display: none;">Continue</a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }
    
    // Show Response Modal
    function showResponseModal(success, message, primaryAction = null) {
        // Create modal if it doesn't exist
        const modal = document.getElementById('responseModal') || createResponseModal();
        
        // Update modal content
        const successIcon = modal.querySelector('.success-icon');
        const errorIcon = modal.querySelector('.error-icon');
        const responseMessage = modal.querySelector('#responseMessage');
        const primaryActionBtn = modal.querySelector('#primaryActionBtn');
        const modalHeader = modal.querySelector('.modal-header');
        
        // Set title based on success/error
        modal.querySelector('.modal-title').textContent = success ? 'Success' : 'Error';
        
        // Set header color
        modalHeader.style.backgroundColor = success ? '#f0f8ff' : '#fff8f8';
        modalHeader.style.borderBottom = success ? '1px solid #c3e6cb' : '1px solid #f5c6cb';
        
        // Show correct icon
        successIcon.style.display = success ? 'inline-block' : 'none';
        errorIcon.style.display = success ? 'none' : 'inline-block';
        
        // Set message
        responseMessage.innerHTML = message;
        
        // Handle primary action button
        if (primaryAction) {
            primaryActionBtn.style.display = 'inline-block';
            primaryActionBtn.textContent = primaryAction.text;
            primaryActionBtn.href = primaryAction.url || '#';
            
            if (primaryAction.callback) {
                primaryActionBtn.onclick = (e) => {
                    if (primaryAction.url === '#') {
                        e.preventDefault();
                    }
                    primaryAction.callback();
                };
            }
        } else {
            primaryActionBtn.style.display = 'none';
        }
        
        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
    
    // Handle new tour form submission specifically
    if (tourForm) {
        console.log("Found newTourForm, attaching event listener");
        
        tourForm.addEventListener('submit', function(event) {
            // Always prevent default form submission
            event.preventDefault();
            event.stopPropagation();
            
            console.log("Tour form submit intercepted");
            
            // Perform client-side validation on all fields
            let isValid = true;
            let firstInvalidField = null;
            
            // Validate all form inputs
            tourForm.querySelectorAll('input[required], textarea[required], select[required]').forEach(input => {
                const valid = validateInput(input);
                if (!valid && !firstInvalidField) {
                    firstInvalidField = input;
                }
                isValid = isValid && valid;
            });
            
            // If validation fails, focus on the first invalid field
            if (!isValid) {
                tourForm.classList.add('was-validated');
                
                if (firstInvalidField) {
                    firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalidField.focus();
                    
                    // Highlight the invalid field
                    firstInvalidField.classList.add('highlight-error');
                    setTimeout(() => {
                        firstInvalidField.classList.remove('highlight-error');
                    }, 1000);
                }
                return;
            }
            
            // Get form action and method
            const action = tourForm.getAttribute('action');
            const method = tourForm.getAttribute('method') || 'POST';
            
            // Show spinner overlay during submission
            if (formOverlay) {
                formOverlay.classList.add('active');
            }
            
            // Update submit button to show spinner
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                const originalBtnText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }
            
            // Create FormData for file uploads
            const formData = new FormData(tourForm);
            
            console.log("Sending AJAX request to:", action);
            
            // Send AJAX request
            fetch(action, {
                method: method,
                body: formData,
                credentials: 'same-origin'
            })
            .then(response => {
                console.log("Response received:", response.status);
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Success data:", data);
                
                // Hide overlay
                if (formOverlay) {
                    formOverlay.classList.remove('active');
                }
                
                // Reset form changed state
                formChanged = false;
                
                // Reset submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Create Tour';
                }
                
                // Show success modal
                let redirectUrl = '';
                let primaryAction = null;
                
                if (data.redirect) {
                    redirectUrl = data.redirect;
                    primaryAction = {
                        text: 'View Tour',
                        url: redirectUrl,
                        callback: () => {
                            window.location.href = redirectUrl;
                        }
                    };
                } else {
                    // Default action: view all tours
                    primaryAction = {
                        text: 'View All Tours',
                        url: '/admin/tours',
                        callback: () => {
                            window.location.href = '/admin/tours';
                        }
                    };
                }
                
                try {
                    showResponseModal(
                        true, 
                        data.message || 'Tour created successfully!',
                        primaryAction
                    );
                } catch (modalError) {
                    console.error('Modal error:', modalError);
                    // Fallback - direct redirect if modal fails
                    window.location.href = redirectUrl || '/admin/tours';
                }
                
                // Reset form
                tourForm.reset();
                
                // Reset any image previews
                document.querySelectorAll('.image-preview').forEach(preview => {
                    preview.style.display = 'none';
                    preview.src = '';
                });
                
                // Remove any success/error states
                document.querySelectorAll('.text-success, .text-danger').forEach(label => {
                    label.remove();
                });
                
                // Remove validation classes
                tourForm.classList.remove('was-validated');
                tourForm.querySelectorAll('.form-group').forEach(group => {
                    group.classList.remove('has-error', 'has-success');
                });
            })
            .catch(error => {
                console.error('Error:', error);
                
                // Hide overlay
                if (formOverlay) {
                    formOverlay.classList.remove('active');
                }
                
                // Reset submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Create Tour';
                }
                
                try {
                    // Show error modal
                    showResponseModal(
                        false, 
                        `<strong>Error:</strong> ${error.message || 'An error occurred while creating the tour.'}`,
                        {
                            text: 'Try Again',
                            url: '#',
                            callback: () => {
                                // Close the modal
                                const bsModal = bootstrap.Modal.getInstance(document.getElementById('responseModal'));
                                if (bsModal) {
                                    bsModal.hide();
                                }
                            }
                        }
                    );
                } catch (modalError) {
                    console.error('Modal error:', modalError);
                    // Show a simple alert as fallback
                    alert(error.message || 'An error occurred while creating the tour.');
                }
            });
        });
    }
    
    // Enhanced AJAX Form Submission with better validation for other forms
    if (form && form.id !== 'newTourForm') {
        form.addEventListener('submit', function(event) {
            // Prevent default form submission
            event.preventDefault();
            
            // Perform client-side validation on all fields
            let isValid = true;
            let firstInvalidField = null;
            
            // Validate all form inputs
            form.querySelectorAll('input[required], textarea[required], select[required]').forEach(input => {
                const valid = validateInput(input);
                if (!valid && !firstInvalidField) {
                    firstInvalidField = input;
                }
                isValid = isValid && valid;
            });
            
            // If validation fails, focus on the first invalid field
            if (!isValid) {
                form.classList.add('was-validated');
                
                if (firstInvalidField) {
                    firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalidField.focus();
                    
                    // Highlight the invalid field
                    firstInvalidField.classList.add('highlight-error');
                    setTimeout(() => {
                        firstInvalidField.classList.remove('highlight-error');
                    }, 1000);
                }
                return;
            }
            
            // Get form action and method
            const action = form.getAttribute('action');
            const method = form.getAttribute('method') || 'POST';
            
            // Show spinner overlay during submission
            if (formOverlay) {
                formOverlay.classList.add('active');
            }
            
            // Update submit button to show spinner
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                const originalBtnText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            }
            
            // Create FormData for file uploads
            const formData = new FormData(form);
            
            // Send AJAX request
            fetch(action, {
                method: method,
                body: formData,
                credentials: 'same-origin'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Hide overlay
                if (formOverlay) {
                    formOverlay.classList.remove('active');
                }
                
                // Reset form changed state
                formChanged = false;
                
                // Reset submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
                }
                
                // Show success modal
                let redirectUrl = '';
                let primaryAction = null;
                
                if (data.redirect) {
                    redirectUrl = data.redirect;
                    primaryAction = {
                        text: 'View Result',
                        url: redirectUrl,
                        callback: () => {
                            window.location.href = redirectUrl;
                        }
                    };
                } else if (form.id === 'editTourForm') {
                    // For edit form, provide a "Back to Tours" action
                    primaryAction = {
                        text: 'Back to Tours',
                        url: '/admin/tours',
                        callback: () => {
                            window.location.href = '/admin/tours';
                        }
                    };
                }
                
                try {
                    showResponseModal(
                        true, 
                        data.message || 'Operation completed successfully!',
                        primaryAction
                    );
                } catch (modalError) {
                    console.error('Modal error:', modalError);
                    // Fallback - direct redirect if modal fails
                    if (data.redirect) {
                        window.location.href = data.redirect;
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                
                // Hide overlay
                if (formOverlay) {
                    formOverlay.classList.remove('active');
                }
                
                // Reset submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
                }
                
                try {
                    // Show error modal
                    showResponseModal(
                        false, 
                        `<strong>Error:</strong> ${error.message || 'An error occurred while processing your request.'}`,
                        {
                            text: 'Try Again',
                            url: '#',
                            callback: () => {
                                // Close the modal
                                const bsModal = bootstrap.Modal.getInstance(document.getElementById('responseModal'));
                                if (bsModal) {
                                    bsModal.hide();
                                }
                            }
                        }
                    );
                } catch (modalError) {
                    console.error('Modal error:', modalError);
                    // Show a simple alert as fallback
                    alert(error.message || 'An error occurred while processing your request.');
                }
            });
        });
    }
    
    // Back to top functionality
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        
        backToTopBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Add warning when leaving with unsaved changes
    window.addEventListener('beforeunload', (event) => {
        if (formChanged && formOverlay && !formOverlay.classList.contains('active')) {
            const message = 'You have unsaved changes. Are you sure you want to leave?';
            event.returnValue = message;
            return message;
        }
    });
    
    // Format textareas that need line-by-line handling
    document.querySelectorAll('.format-lines').forEach(textarea => {
        textarea.addEventListener('blur', function() {
            // Clean up empty lines
            const lines = this.value.split('\n').filter(line => line.trim() !== '');
            this.value = lines.join('\n');
        });
    });
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
    }
    
    // Amazon-like hover effect for input fields
    document.querySelectorAll('.form-control, .form-select').forEach(input => {
        input.addEventListener('focus', function() {
            this.closest('.form-group').classList.add('is-focused');
        });
        
        input.addEventListener('blur', function() {
            this.closest('.form-group').classList.remove('is-focused');
        });
    });
}); 