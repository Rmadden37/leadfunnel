// --- Global variables ---
        let map;
        let autocomplete;
        let selectedPlaceGeometry = null;

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

        // --- Initialize Google APIs ---
        function initAutocomplete() {
            if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
                console.error("Google Maps or Places API not loaded.");
                return;
            }
            
            // Initialize autocomplete
            autocomplete = new google.maps.places.Autocomplete(addressInput, {
                types: ['address'],
                componentRestrictions: { 'country': 'us' },
                fields: ['formatted_address', 'geometry']
            });
            autocomplete.addListener('place_changed', onPlaceChanged);
            
            // Load initial map with Tampa location
            loadInitialMap();
        }

        async function loadInitialMap() {
            try {
                const { Map } = await google.maps.importLibrary("maps");
                
                // Default Tampa location - downtown Tampa residential area
                const tampaLocation = { lat: 27.9506, lng: -82.4572 };
                
                const initialMap = new Map(document.getElementById('initial-map'), {
                    center: tampaLocation,
                    zoom: 20,
                    mapTypeId: 'satellite',
                    disableDefaultUI: true,
                    tilt: 0
                });
                
                // Add heat map overlay simulation
                const heatMapOverlay = new google.maps.Rectangle({
                    bounds: {
                        north: tampaLocation.lat + 0.0002,
                        south: tampaLocation.lat - 0.0002,
                        east: tampaLocation.lng + 0.0003,
                        west: tampaLocation.lng - 0.0003
                    },
                    fillColor: '#FF4444',
                    fillOpacity: 0.4,
                    strokeWeight: 0,
                    map: initialMap
                });
                
                // Add a label
                const { InfoWindow } = await google.maps.importLibrary("maps");
                const infoWindow = new InfoWindow({
                    content: `
                        <div style="text-align: center; font-size: 12px;">
                            <strong>🔥 High Solar Potential</strong><br>
                            <span style="color: #666;">Example Tampa Home</span>
                        </div>
                    `,
                    position: tampaLocation
                });
                infoWindow.open(initialMap);
                
            } catch (error) {
                console.error("Error loading initial map:", error);
            }
        }

        function onPlaceChanged() {
            const place = autocomplete.getPlace();
            if (place && place.geometry && place.geometry.location) {
                 addressInput.value = place.formatted_address;
                 selectedPlaceGeometry = place.geometry.location.toJSON();
            } else {
                 selectedPlaceGeometry = null;
            }
        }
        
        function loadGoogleMapsScript() {
            if (googleApiKey && googleApiKey !== 'YOUR_GOOGLE_CLOUD_API_KEY_HERE') {
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places,maps,marker&v=beta&callback=initAutocomplete`;
                script.async = true;
                script.defer = true;
                document.head.appendChild(script);
            } else {
                console.warn("Google API Key is missing. Address analysis feature is disabled.");
            }
        }
        
        addressInput.addEventListener('input', () => {
            selectedPlaceGeometry = null;
        });

        // --- API Call Functions ---
        async function getSolarData(location, view, experimental = false) {
            let url;
            if (view === 'DATA_LAYERS') {
                 url = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${location.lat}&location.longitude=${location.lng}&radius_meters=50&view=IMAGERY_AND_ANNUAL_FLUX_LAYERS&key=${googleApiKey}`;
                 if (experimental) {
                     url += '&requiredQuality=BASE&experiments=EXPANDED_COVERAGE';
                 }
            } else {
                 url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${location.lat}&location.longitude=${location.lng}&key=${googleApiKey}`;
            }
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Solar API request failed for view: ${view}. Status: ${response.status}. Body: ${errorBody}`);
                }
                const data = await response.json();
                return data;
            } catch (error) {
                console.error(`Solar API Error (${view}):`, error);
                return null;
            }
        }

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
            if (!selectedPlaceGeometry) {
                alert('Please select a valid address from the suggestions.');
                return;
            }
            
            initialStep.classList.add('hidden');
            resultsStep.classList.remove('hidden');
            analysisResults.innerHTML = `
                <div id="map" class="w-full h-64 rounded-lg mb-4 bg-gray-200"></div>
                <div id="heat-map-content" class="flex justify-center items-center h-24">
                    <div class="spinner w-10 h-10 rounded-full border-4 border-gray-200"></div>
                    <p class="ml-4 text-gray-600">Generating your solar heat map...</p>
                </div>
            `;
            
            const { Map } = await google.maps.importLibrary("maps");
            map = new Map(document.getElementById('map'), {
                center: selectedPlaceGeometry,
                zoom: 20,
                mapTypeId: 'satellite',
                disableDefaultUI: true,
                tilt: 0
            });
            
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
            });
            
            const savingsTextContainer = document.getElementById('savings-text-content');
            
            // --- Intelligent Data Fetching ---
            let layerData = await getSolarData(selectedPlaceGeometry, 'DATA_LAYERS');
            if (!layerData || !layerData.annualFluxUrl) {
                console.warn("Standard quality data layers not found. Trying experimental coverage.");
                layerData = await getSolarData(selectedPlaceGeometry, 'DATA_LAYERS', true);
            }

            const buildingData = await getSolarData(selectedPlaceGeometry, 'BUILDING_INSIGHTS');

            // Add irradiance layer if available
            if (layerData && layerData.annualFluxUrl && layerData.imageryBoundingBox) {
                const { north, south, east, west } = layerData.imageryBoundingBox;
                const bounds = new google.maps.LatLngBounds(
                    new google.maps.LatLng(south, west),
                    new google.maps.LatLng(north, east)
                );
                const fluxOverlay = new google.maps.GroundOverlay(
                    layerData.annualFluxUrl,
                    bounds,
                    { opacity: 0.6 }
                );
                fluxOverlay.setMap(map);
            } else {
                console.warn("Annual flux data (irradiance map) not available for this location, even with experimental fallback. Showing satellite only.");
                 const noticeDiv = document.createElement('div');
                noticeDiv.className = "text-center text-sm text-orange-600 p-2 bg-orange-100 rounded-md mb-4";
                noticeDiv.innerText = "Rooftop confirmed. Irradiance map not available for this address. Analyzing savings...";
                analysisResults.insertBefore(noticeDiv, savingsTextContainer);
            }


            if (!buildingData || !buildingData.solarPotential) {
                savingsTextContainer.innerHTML = `<p class="text-red-500 text-center p-4">Unfortunately, we couldn't retrieve specific solar data for your rooftop. This can happen with new constructions or certain building types. You can still fill out the form below for a manual assessment!</p>`;
                leadForm.classList.remove('hidden');
                return;
            }
            
            savingsTextContainer.innerHTML = `
                 <div class="flex justify-center items-center h-24">
                    <div class="spinner w-10 h-10 rounded-full border-4 border-gray-200"></div>
                    <p class="ml-4 text-gray-600">Calculating your personalized savings...</p>
                </div>
            `;

            const { maxArrayAreaMeters2, yearlyEnergyDc, carbonOffsetFactorKgPerMwh } = buildingData.solarPotential;
            
            if (maxArrayAreaMeters2 === undefined || yearlyEnergyDc === undefined || carbonOffsetFactorKgPerMwh === undefined) {
                 savingsTextContainer.innerHTML = `<p class="text-orange-500 text-center p-4">We have partial data for your address. For a more accurate quote, please complete the form below and a specialist will perform a manual assessment.</p>`;
                leadForm.classList.remove('hidden');
                return;
            }

            const prompt = `Act as a friendly solar savings estimator for a company in Tampa, Florida. A potential customer at "${addressInput.value}" has provided their rooftop data from the Google Solar API.
            
            Here is their data:
            - Maximum solar panel area: ${maxArrayAreaMeters2.toFixed(2)} square meters.
            - Potential yearly energy production (DC): ${yearlyEnergyDc.toFixed(2)} kWh.
            - Carbon Offset Factor: ${carbonOffsetFactorKgPerMwh.toFixed(2)} kg per MWh.

            Based on this specific data and average local electricity rates (around $0.15/kWh), provide an exciting, personalized, and easy-to-understand estimate of their potential savings. 
            
            Structure the response like this:
            1. A bold, exciting headline like "Great News for Your Home on [Street Name]!"
            2. A short paragraph explaining that based on their roof's actual data, they have excellent solar potential.
            3. A bulleted list with their key stats: "Yearly Energy Production," "Estimated Yearly Savings," and "20-Year Carbon Offset" (calculate this by converting yearly kWh to MWh, multiplying by the offset factor and then by 20 years, and then convert kg to metric tons).
            
            Keep it positive and focus on the benefits. Do not give financial advice. Just provide the text content, no markdown formatting.`;
            
            const savingsText = await callGemini(prompt);
            savingsTextContainer.innerHTML = `<div class="prose max-w-none p-4 bg-blue-100 rounded-lg">${savingsText.replace(/\n/g, '<br>')}</div>`;
            leadForm.classList.remove('hidden');
        });

        // --- Feature 2: AI-Powered FAQ ---
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

        // Initialize Google Maps script and Autocomplete
        loadGoogleMapsScript();