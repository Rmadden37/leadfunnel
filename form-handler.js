// Solar Form Handler with Google Apps Script Integration
class SolarFormHandler {
    constructor() {
        // Your Google Apps Script Web App URL - GOOGLE DRIVE HTML EMAIL VERSION
        // Deployment ID: AKfycbyGOasfnJJecpWNrRNK7KcEYTW7FHxNMfr9tjExhEdQZF8xkNfBvuRB9H1oVgktogoi
        this.googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbyGOasfnJJecpWNrRNK7KcEYTW7FHxNMfr9tjExhEdQZF8xkNfBvuRB9H1oVgktogoi/exec';
        // Telegram notification endpoint (Vercel serverless function)
        this.telegramNotifyUrl = '/api/notify';
        this.init();
    }

    init() {
        // Initialize form handling when page loads
        document.addEventListener('DOMContentLoaded', () => {
            this.setupForm();
            this.setupCTAButtons();
        });
    }

    setupForm() {
        const form = document.getElementById('solar-analysis-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
            console.log('✅ Solar form handler initialized');
        } else {
            console.log('⚠️ Solar form not found on this page');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Show loading state
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        
        try {
            // Collect form data
            const data = {
                name: formData.get('name')?.trim() || '',
                address: formData.get('address')?.trim() || '',
                city: formData.get('city')?.trim() || '',
                zip: formData.get('zip')?.trim() || '',
                phone: formData.get('phone')?.trim() || '',
                email: formData.get('email')?.trim() || '',
                source: 'Website Form',
                timestamp: new Date().toISOString(),
                page_url: window.location.href,
                referrer: document.referrer || 'Direct',
                user_agent: navigator.userAgent.substring(0, 200) // Limit length
            };

            console.log('🚀 Submitting form data:', data);

            // Validate data
            if (!this.validateFormData(data)) {
                throw new Error('Please fill in all required fields correctly');
            }

            // Submit to Google Sheets and send Telegram notification in parallel
            await Promise.all([
                this.submitToGoogleSheets(data),
                this.sendTelegramNotification(data)
            ]);

            // Success - redirect to thank you page
            console.log('✅ Form submitted successfully');
            window.location.href = 'thank-you.html';
            
        } catch (error) {
            console.error('❌ Form submission error:', error);
            alert('There was an error submitting your form. Please try again or call (561) 301-7564.');
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    validateFormData(data) {
        const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)]{10,}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        return data.name && data.name.length >= 2 &&
               data.address && data.address.length >= 10 &&
               data.city && data.city.length >= 2 && 
               data.zip && data.zip.length === 5 && 
               /^\d{5}$/.test(data.zip) &&
               data.phone && phoneRegex.test(data.phone) &&
               data.email && emailRegex.test(data.email);
    }

    async submitToGoogleSheets(data) {
        console.log('📤 Sending to Google Apps Script...');
        
        // Multiple submission methods for bulletproof delivery
        const methods = [
            () => this.submitViaFetch(data),
            () => this.submitViaFetchNoCorsFallback(data),
            () => this.submitViaJsonp(data)
        ];

        let lastError;
        
        for (let i = 0; i < methods.length; i++) {
            try {
                console.log(`🔄 Trying submission method ${i + 1}...`);
                await methods[i]();
                console.log(`✅ Submission method ${i + 1} succeeded`);
                return; // Success!
            } catch (error) {
                console.log(`❌ Method ${i + 1} failed:`, error.message);
                lastError = error;
                
                // Wait a bit before trying next method
                if (i < methods.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        
        // If all methods failed
        throw new Error(`All submission methods failed. Last error: ${lastError?.message}`);
    }

    async submitViaFetch(data) {
        const response = await fetch(this.googleAppsScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.status !== 'success') {
            throw new Error(result.message || 'Unknown server error');
        }
        
        return result;
    }

    async submitViaFetchNoCorsFallback(data) {
        // No-cors mode as fallback
        await fetch(this.googleAppsScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            mode: 'no-cors'
        });
        
        // no-cors doesn't return readable response, assume success
        console.log('📤 No-CORS submission completed (response not readable)');
    }

    async submitViaJsonp(data) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

            window[callbackName] = function(response) {
                delete window[callbackName];
                document.body.removeChild(script);

                if (response.status === 'success') {
                    resolve(response);
                } else {
                    reject(new Error(response.message || 'JSONP submission failed'));
                }
            };

            // Build URL with parameters
            const params = new URLSearchParams({
                ...data,
                method: 'jsonp',
                callback: callbackName
            });

            const script = document.createElement('script');
            script.src = `${this.googleAppsScriptUrl}?${params.toString()}`;
            script.onerror = () => {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('JSONP script failed to load'));
            };

            document.body.appendChild(script);

            // Timeout after 30 seconds
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    document.body.removeChild(script);
                    reject(new Error('JSONP request timeout'));
                }
            }, 30000);
        });
    }

    async sendTelegramNotification(data) {
        try {
            console.log('📱 Sending Telegram notification...');
            const response = await fetch(this.telegramNotifyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                console.log('✅ Telegram notification sent');
            } else {
                console.warn('⚠️ Telegram notification failed:', response.status);
            }
        } catch (error) {
            // Don't throw - Telegram failure shouldn't block form submission
            console.warn('⚠️ Telegram notification error:', error.message);
        }
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
            name: 'Quick Lead',
            address: address,
            city: '',
            zip: '',
            phone: '',
            email: '',
            source: `CTA-Button: ${buttonText}`,
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
            user_agent: navigator.userAgent.substring(0, 100),
            referrer: document.referrer || 'Direct'
        };

        try {
            await Promise.all([
                this.submitToGoogleSheets(data),
                this.sendTelegramNotification(data)
            ]);
            console.log('✅ Quick lead submitted');
        } catch (error) {
            console.error('❌ Quick lead submission error:', error);
        }
    }
}

// Initialize the form handler
const solarFormHandler = new SolarFormHandler();

// Export for testing
window.SolarFormHandler = SolarFormHandler;
