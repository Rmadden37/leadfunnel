// animation.js - Simple animations for the solar lead funnel

// Countdown timer for the urgency banner
function startCountdown() {
    const daysElement = document.getElementById('days-remaining');
    if (!daysElement) return;
    
    // Calculate days until end of 2025 (when federal program ends)
    const endDate = new Date('2025-12-31');
    const now = new Date();
    const timeDiff = endDate - now;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    daysElement.textContent = Math.max(0, daysRemaining);
}

// FAQ accordion functionality
function initFAQ() {
    const askBtn = document.getElementById('ask-ai-btn');
    const questionInput = document.getElementById('ai-faq-question');
    const responseDiv = document.getElementById('ai-faq-response');
    
    if (askBtn && questionInput && responseDiv) {
        askBtn.addEventListener('click', function() {
            const question = questionInput.value.trim();
            if (!question) return;
            
            // Simple predefined responses
            const responses = {
                'cost': 'Solar costs vary by home size and energy needs. Most homeowners save $20,000-$40,000 over 25 years with current federal incentives.',
                'installation': 'Installation typically takes 1-3 days. We handle all permits and inspections for you.',
                'maintenance': 'Solar panels require minimal maintenance - just occasional cleaning and monitoring.',
                'warranty': 'We provide a 25-year warranty on equipment and workmanship.',
                'financing': 'We offer $0 down financing options with competitive rates.',
                'roof': 'Most roof types work for solar. We\'ll assess your roof during the free consultation.'
            };
            
            let response = 'Thanks for your question! One of our solar specialists will contact you with detailed information about your specific situation.';
            
            // Simple keyword matching
            for (const [key, value] of Object.entries(responses)) {
                if (question.toLowerCase().includes(key)) {
                    response = value;
                    break;
                }
            }
            
            responseDiv.innerHTML = `
                <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="font-semibold text-blue-900 mb-2">Answer:</p>
                    <p class="text-blue-800">${response}</p>
                </div>
            `;
            
            questionInput.value = '';
        });
        
        // Allow Enter key to submit
        questionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                askBtn.click();
            }
        });
    }
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Button hover effects and loading states
function initButtonEffects() {
    const ctaButtons = document.querySelectorAll('.cta-button, .main-cta-button');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Add loading state
            const originalText = this.textContent;
            this.textContent = 'Loading...';
            this.disabled = true;
            
            // Reset after 3 seconds (in case form doesn't submit)
            setTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
            }, 3000);
        });
    });
}

// Form validation and enhancement
function initFormEnhancements() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            // Basic validation
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('border-red-500');
                    isValid = false;
                } else {
                    field.classList.remove('border-red-500');
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                alert('Please fill in all required fields.');
            }
        });
    });
}

// Initialize all animations when page loads
document.addEventListener('DOMContentLoaded', function() {
    startCountdown();
    initFAQ();
    initSmoothScrolling();
    initButtonEffects();
    initFormEnhancements();
    
    console.log('✅ Animation.js loaded successfully');
});

// Update countdown every hour
setInterval(startCountdown, 3600000);