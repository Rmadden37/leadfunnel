// --- Global variables ---
let selectedAddress = null;

// --- Countdown Timer ---
const countDownDate = new Date("Dec 31, 2025 23:59:59").getTime();
const countdownInterval = setInterval(function() {
    const now = new Date().getTime();
    const distance = countDownDate - now;
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    
    const daysRemainingEl = document.getElementById("days-remaining");
    if (daysRemainingEl) {
        daysRemainingEl.innerHTML = days;
    }

    if (distance < 0) {
        clearInterval(countdownInterval);
        const bannerContent = document.querySelector(".floating-banner > div");
        if(bannerContent) {
            bannerContent.innerHTML = "<div class='text-lg font-bold'>PROGRAM EXPIRED</div>";
        }
    }
}, 1000);

// --- API Keys and Elements ---
const googleApiKey = 'AIzaSyBhqom743-Xt5xmCUIg8-HXAEUNjRAa3wo';
const geminiApiKey = "AIzaSyBgOF83xzGzYUT5LHWGeYceJ88cWxs8D_Q";

const analyzeRoofBtn = document.getElementById('analyze-roof-btn');
const bookConsultationBtn = document.getElementById('book-consultation-btn');
const askAiBtn = document.getElementById('ask-ai-btn');
const addressInput = document.getElementById('address');
const initialStep = document.getElementById('initial-step');
const resultsStep = document.getElementById('results-step');
const analysisResults = document.getElementById('analysis-results');
const consultationSection = document.getElementById('consultation-section');
const leadForm = document.getElementById('lead-form');

// --- Map functionality will be added here ---
// (Placeholder for new map implementation)

// --- API Call Functions ---
// (Solar API functions will be replaced with new implementation)

async function callGemini(prompt) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`Gemini API call failed with status: ${response.status}`);
        const result = await response.json();
        return result.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "An error occurred while trying to get a response.";
    }
}

// --- Feature 1: Solar Heat Map Generator ---
analyzeRoofBtn.addEventListener('click', async () => {
    const addressValue = addressInput.value.trim();
    if (!addressValue) {
        alert('Please enter a valid address.');
        return;
    }
    
    initialStep.classList.add('hidden');
    resultsStep.classList.remove('hidden');
    analysisResults.innerHTML = `
        <div id="map" class="w-full h-64 rounded-lg mb-4 bg-gray-200 flex items-center justify-center">
            <p class="text-gray-600">Map will be loaded here</p>
        </div>
        <div id="heat-map-content" class="flex justify-center items-center h-24">
            <div class="spinner w-10 h-10 rounded-full border-4 border-gray-200"></div>
            <p class="ml-4 text-gray-600">Generating your solar heat map...</p>
        </div>
    `;
    
    // Simulate heat map generation and show results
    setTimeout(() => {
        generateSolarHeatMapResults();
    }, 2000);
});

function generateSolarHeatMapResults() {
    const heatMapContainer = document.getElementById('heat-map-content');
    if (heatMapContainer) {
        heatMapContainer.innerHTML = `
            <div class="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-3 text-center">
                    🔥 Your Solar Heat Map Analysis
                </h3>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-red-600">92%</div>
                        <div class="text-sm text-gray-600">Roof Coverage</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">$285</div>
                        <div class="text-sm text-gray-600">Monthly Savings</div>
                    </div>
                </div>
                <div class="flex items-center justify-center space-x-2 mb-4">
                    <div class="w-4 h-4 bg-red-500 rounded"></div>
                    <span class="text-xs">High Solar Potential</span>
                    <div class="w-4 h-4 bg-orange-400 rounded"></div>
                    <span class="text-xs">Medium Solar Potential</span>
                    <div class="w-4 h-4 bg-yellow-300 rounded"></div>
                    <span class="text-xs">Low Solar Potential</span>
                </div>
                <p class="text-center text-gray-700 text-sm">
                    Your roof shows excellent solar energy potential with high sun exposure throughout the day.
                </p>
            </div>
        `;
        
        // Show consultation booking section
        consultationSection.classList.remove('hidden');
    }
}

// --- Feature 2: Book Consultation ---
bookConsultationBtn.addEventListener('click', async () => {
    const addressValue = addressInput.value.trim();
    if (!addressValue) {
        alert('Please enter a valid address.');
        return;
    }
    
    // Hide initial step and show the map
    initialStep.classList.add('hidden');
    resultsStep.classList.remove('hidden');
    
    analysisResults.innerHTML = `
        <div id="map" class="w-full h-64 rounded-lg mb-4 bg-gray-200 flex items-center justify-center">
            <p class="text-gray-600">Map will be loaded here</p>
        </div>
        <div id="savings-text-content" class="flex justify-center items-center h-24">
            <div class="spinner w-10 h-10 rounded-full border-4 border-gray-200"></div>
            <p class="ml-4 text-gray-600">Analyzing your rooftop...</p>
        </div>
    `;
    
    // Simulate analysis and show results
    setTimeout(() => {
        showConsultationResults(addressValue);
    }, 2000);
});

function showConsultationResults(address) {
    const savingsTextContainer = document.getElementById('savings-text-content');
    if (savingsTextContainer) {
        savingsTextContainer.innerHTML = `
            <div class="prose max-w-none p-4 bg-blue-100 rounded-lg">
                <h3 class="text-xl font-bold mb-2">Great News for Your Home at ${address}!</h3>
                <p class="mb-3">Based on your location, you have excellent solar potential with high sun exposure throughout the day.</p>
                <ul class="list-disc pl-5 space-y-1">
                    <li><strong>Estimated Yearly Energy Production:</strong> 12,500 kWh</li>
                    <li><strong>Estimated Yearly Savings:</strong> $1,875</li>
                    <li><strong>20-Year Carbon Offset:</strong> 8.2 metric tons</li>
                </ul>
            </div>
        `;
        leadForm.classList.remove('hidden');
    }
}

// --- Feature 3: AI-Powered FAQ ---
askAiBtn.addEventListener('click', async () => {
    const questionInput = document.getElementById('ai-faq-question');
    const question = questionInput.value.trim();
    if (!question) return;

    const responseContainer = document.getElementById('ai-faq-response');
    responseContainer.innerHTML = `<div class="flex items-center gap-2 text-gray-600"><div class="spinner w-5 h-5 rounded-full border-2 border-gray-200"></div><span>Thinking...</span></div>`;
    
    const pageContext = `Company Info: We are a Freedom Forever Authorized Dealer in Tampa, FL. We offer $0 down solar systems with a 25-year warranty, including installation and maintenance. Current Offer: A federal program that lowers solar costs is expiring at the end of 2025. We are urging homeowners to lock in their rates now before prices rise. Key Benefits: Fixed monthly rate, no more utility hikes, optional battery backup for blackouts.`;
    const prompt = `You are a helpful and friendly solar expert for a company in Tampa, Florida. A customer has asked the following question. Based on the provided context, answer their question clearly and concisely. Do not make up information you don't have. Encourage them to fill out the form for more detailed information. \n\nContext:\n${pageContext}\n\nCustomer Question: "${question}"\n\nAnswer:`;

    const answerText = await callGemini(prompt);

    const faqList = document.getElementById('faq-list');
    const newFaqItem = document.createElement('div');
    newFaqItem.className = 'faq-item py-4 bg-blue-100 -mx-6 px-6';
    newFaqItem.innerHTML = `<h4 class="text-lg font-semibold text-gray-800 mb-2">Q: ${question}</h4><p class="text-gray-700"><strong>A:</strong> ${answerText.replace(/\n/g, '<br>')}</p>`;
    faqList.appendChild(newFaqItem);
    questionInput.value = '';
    responseContainer.innerHTML = '';
});

// --- Form Submission ---
leadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thank you! Your information has been submitted. We will contact you shortly.');
    e.target.reset();
    resultsStep.classList.add('hidden');
    initialStep.classList.remove('hidden');
    analysisResults.innerHTML = '';
});

// Ready for new map implementation
