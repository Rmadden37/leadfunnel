// Solar Form Handler with Google Apps Script Integration
class SolarFormHandler {
    constructor() {
        // ✅ CONFIGURED: Google Apps Script Web App URL (Updated Deployment)
        this.googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbw0QXX7EMEvP_RNa-o6DmV9mQkW1z2qO50YKVXvz4MnHLTQ0qNY1A-lUH9-8FMirFJN/exec';
        
        // Duplicate prevention
        this.submittedData = new Set();
        
        this.init();
    }

    init() {
        // Main hero form
        const mainForm = document.getElementById('solar-analysis-form');
        if (mainForm) {
            mainForm.addEventListener('submit', (e) => this.handleFormSubmit(e, 'hero-form'));
        }

        // Update all CTA buttons to trigger form or call
        this.setupCTAButtons();
    }

    async handleFormSubmit(event, source = 'unknown') {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        this.setLoadingState(submitBtn, true);
        
        try {
            // Collect form data
            const formData = this.collectFormData(form, source);
            
            // Validate required fields
            if (!this.validateFormData(formData)) {
                throw new Error('Please complete all fields with valid information');
            }

            // Submit to Google Apps Script (saves to sheets + sends all emails automatically)
            await this.submitToGoogleAppsScript(formData);
            
            // Show success and redirect to thank you page
            this.showSuccessMessage();
            
            // Redirect to thank you page after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'thank-you.html';
            }, 1500);
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showErrorMessage(error.message);
            
            // Fallback to thank you page after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'thank-you.html';
            }, 1500);
        } finally {
            // Reset button after 4 seconds
            setTimeout(() => {
                this.setLoadingState(submitBtn, false, originalText);
            }, 4000);
        }
    }

    collectFormData(form, source) {
        const formData = new FormData(form);
        const data = {
            name: formData.get('name') || '',
            address: formData.get('address') || '',
            city: formData.get('city') || '',
            zip: formData.get('zip') || '',
            phone: formData.get('phone') || '',
            email: formData.get('email') || '',
            source: source,
            timestamp: new Date().toLocaleString(),
            page_url: window.location.href,
            user_agent: navigator.userAgent.substring(0, 100), // Truncate for sheets
            referrer: document.referrer || 'Direct'
        };

        return data;
    }

    validateFormData(data) {
        const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)]{10,}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        return data.name && data.name.trim().length >= 2 &&
               data.address && data.address.trim().length >= 10 &&
               data.city && data.city.trim().length >= 2 && 
               data.zip && data.zip.trim().length === 5 && 
               /^\d{5}$/.test(data.zip) &&
               data.phone && phoneRegex.test(data.phone) &&
               data.email && emailRegex.test(data.email);
    }

    async submitToGoogleAppsScript(data) {
        try {
            // Create a unique hash for this submission to prevent duplicates
            const submissionHash = this.createSubmissionHash(data);
            
            if (this.submittedData.has(submissionHash)) {
                console.log('Duplicate submission prevented');
                return true;
            }
            
            console.log('Submitting to Google Apps Script:', data);
            
            // Method 1: Standard POST with no-cors (primary method)
            const response = await fetch(this.googleAppsScriptUrl, {
                method: 'POST',
                mode: 'no-cors', // Required for Google Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            console.log('Form submitted to Google Apps Script (no-cors mode) - Lead should be saved and emails sent');
            
            // Mark this submission as completed
            this.submittedData.add(submissionHash);
            
            // With no-cors mode, we can't verify the response, but the request was sent
            // Only use fallback method if this actually throws an error
            return true;
            
        } catch (error) {
            console.error('Google Apps Script submission failed:', error);
            
            // Only now try alternative submission method as true fallback
            try {
                console.log('Primary method failed, trying alternative submission method...');
                await this.submitViaScriptTag(data);
                return true;
            } catch (altError) {
                console.error('Alternative submission method also failed:', altError);
                throw error;
            }
        }
    }

    // Create a unique hash for submission data to prevent duplicates
    createSubmissionHash(data) {
        const keyData = `${data.email}-${data.phone}-${data.address}-${Math.floor(Date.now() / 30000)}`; // 30 second window
        return btoa(keyData).substring(0, 16); // Simple hash
    }

    // Alternative submission method using script tag injection
    submitViaScriptTag(data) {
        return new Promise((resolve, reject) => {
            try {
                // Create a unique callback name
                const callbackName = 'gasCallback_' + Date.now();
                
                // Create the callback function
                window[callbackName] = function(response) {
                    console.log('Script tag submission response:', response);
                    // Clean up
                    document.head.removeChild(script);
                    delete window[callbackName];
                    resolve(response);
                };
                
                // Create script element
                const script = document.createElement('script');
                script.onerror = function() {
                    console.log('Script tag submission completed (no response expected)');
                    // Clean up
                    document.head.removeChild(script);
                    delete window[callbackName];
                    resolve(true);
                };
                
                // Build the URL with data as query parameters
                const params = new URLSearchParams();
                Object.keys(data).forEach(key => {
                    params.append(key, data[key]);
                });
                params.append('callback', callbackName);
                params.append('method', 'jsonp');
                
                script.src = `${this.googleAppsScriptUrl}?${params.toString()}`;
                document.head.appendChild(script);
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    if (document.head.contains(script)) {
                        document.head.removeChild(script);
                        delete window[callbackName];
                        resolve(true); // Assume success since we can't verify
                    }
                }, 10000);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    setupCTAButtons() {
        // Setup all CTA buttons throughout the page
        const ctaButtons = document.querySelectorAll('a[href="tel:+1-561-301-7564"]');
        
        ctaButtons.forEach(button => {
            // Check if address is filled in main form
            button.addEventListener('click', (e) => {
                const addressInput = document.getElementById('address-input');
                const address = addressInput ? addressInput.value.trim() : '';
                
                if (address && address.length >= 10) {
                    // If address is provided, submit form data first
                    e.preventDefault();
                    this.submitQuickLead(address, button.textContent.trim()).then(() => {
                        // Small delay then call
                        setTimeout(() => {
                            window.location.href = 'tel:+1-561-301-7564';
                        }, 500);
                    });
                }
                // Otherwise, allow normal phone call to proceed
            });
        });
    }

    async submitQuickLead(address, buttonText) {
        const data = {
            address: address,
            phone: '',
            source: `CTA-Button: ${buttonText}`,
            timestamp: new Date().toLocaleString(),
            page_url: window.location.href,
            user_agent: navigator.userAgent.substring(0, 100),
            referrer: document.referrer || 'Direct'
        };

        try {
            await this.submitToGoogleSheets(data);
            console.log('Quick lead submitted');
        } catch (error) {
            console.error('Quick lead submission error:', error);
        }
    }

    setLoadingState(button, isLoading, originalText = '') {
        if (isLoading) {
            button.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center;">
                    <div style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>
                    <span>Analyzing Your Home...</span>
                </div>
            `;
            button.disabled = true;
        } else {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    showSuccessMessage() {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        notification.innerHTML = `
            <div class="flex items-center">
                <svg class="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <div>
                    <div class="font-bold">Analysis Complete!</div>
                    <div class="text-sm">Calling you now...</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    showErrorMessage(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        notification.innerHTML = `
            <div class="flex items-center">
                <svg class="w-6 h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <div>
                    <div class="font-bold">Submission Issue</div>
                    <div class="text-sm">Calling you directly instead...</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize form handler when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const formHandler = new SolarFormHandler();
    console.log('Solar Form Handler initialized');
});
