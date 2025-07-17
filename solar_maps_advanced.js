// Advanced Solar Maps Example with Enhanced Features
// This file demonstrates advanced usage patterns and error handling

// Enhanced global variables with state management
let mapState = {
    map: null,
    buildingPolygon: null,
    fluxOverlay: null,
    currentAddress: null,
    lastAnalysis: null,
    isLoading: false
};

// Configuration object for easy customization
const solarConfig = {
    defaultCenter: { lat: 27.9306, lng: -82.4497 }, // Davis Islands, Tampa, FL
    defaultZoom: 17,
    analysisZoom: 20,
    radiusMeters: 15,
    mapOptions: {
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: true,
        zoomControl: true
    },
    polygonStyle: {
        strokeColor: "#00BFFF",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#00BFFF",
        fillOpacity: 0.25
    },
    heatmapColors: [
        [0.00, [0,   0,   0,   0]],     // Transparent
        [0.10, [100, 150, 200, 80]],    // Light blue
        [0.25, [150, 200, 100, 120]],   // Light green
        [0.50, [255, 255, 0,   180]],   // Yellow
        [0.75, [255, 165, 0,   220]],   // Orange
        [1.00, [255, 0,   0,   255]]    // Red
    ]
};

// Enhanced initialization function
function initMapAdvanced() {
    try {
        // Initialize map with configuration
        mapState.map = new google.maps.Map(document.getElementById("map"), {
            center: solarConfig.defaultCenter,
            zoom: solarConfig.defaultZoom,
            ...solarConfig.mapOptions
        });

        // Set up event listeners
        setupEventListeners();
        
        // Initialize Places Autocomplete if available
        setupAutocomplete();
        
        // Display welcome message
        updateInsightsDisplay("welcome");
        
        console.log("Solar Maps initialized successfully");
        
    } catch (error) {
        console.error("Failed to initialize map:", error);
        updateInsightsDisplay("error", "Failed to initialize map. Please check your API key and permissions.");
    }
}

// Setup event listeners with enhanced functionality
function setupEventListeners() {
    const searchButton = document.getElementById("searchButton");
    const addressInput = document.getElementById("addressInput");
    
    if (searchButton) {
        searchButton.addEventListener("click", () => performSolarAnalysis());
    }
    
    if (addressInput) {
        // Handle Enter key
        addressInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                performSolarAnalysis();
            }
        });
        
        // Clear previous results when user starts typing
        addressInput.addEventListener("input", () => {
            if (mapState.currentAddress && addressInput.value !== mapState.currentAddress) {
                clearPreviousResults();
            }
        });
    }
    
    // Add map click handler for additional info
    if (mapState.map) {
        mapState.map.addListener("click", (event) => {
            console.log("Map clicked at:", event.latLng.lat(), event.latLng.lng());
        });
    }
}

// Setup Google Places Autocomplete
function setupAutocomplete() {
    const addressInput = document.getElementById("addressInput");
    if (addressInput && google.maps.places) {
        try {
            const autocomplete = new google.maps.places.Autocomplete(addressInput, {
                types: ['address'],
                componentRestrictions: { country: 'us' }
            });
            
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.geometry) {
                    performSolarAnalysis();
                }
            });
            
            console.log("Autocomplete initialized");
        } catch (error) {
            console.warn("Autocomplete initialization failed:", error);
        }
    }
}

// Enhanced solar analysis with better error handling
async function performSolarAnalysis() {
    const addressInput = document.getElementById("addressInput");
    
    if (!addressInput || !addressInput.value.trim()) {
        showNotification("Please enter an address", "warning");
        return;
    }

    if (mapState.isLoading) {
        console.log("Analysis already in progress");
        return;
    }

    const address = addressInput.value.trim();
    mapState.currentAddress = address;
    mapState.isLoading = true;
    
    // Update UI state
    setLoadingState(true);
    updateInsightsDisplay("loading");
    clearPreviousResults();

    try {
        // Step 1: Geocode address
        const location = await geocodeAddress(address);
        console.log("Geocoded location:", location);
        
        // Step 2: Update map view
        updateMapView(location);
        
        // Step 3: Fetch solar data
        const [insights, dataLayers] = await Promise.all([
            fetchBuildingInsights(location),
            fetchDataLayers(location)
        ]);
        
        // Step 4: Process and display results
        await displayResults(insights, dataLayers, location);
        
        // Store results for potential re-use
        mapState.lastAnalysis = {
            address,
            location,
            insights,
            dataLayers,
            timestamp: Date.now()
        };
        
        showNotification("Solar analysis completed successfully!", "success");
        
    } catch (error) {
        console.error("Solar analysis failed:", error);
        handleAnalysisError(error);
    } finally {
        mapState.isLoading = false;
        setLoadingState(false);
    }
}

// Geocoding with retry logic
async function geocodeAddress(address, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.status === "OK" && data.results.length > 0) {
                return data.results[0].geometry.location;
            } else if (data.status === "ZERO_RESULTS") {
                throw new Error("Address not found. Please try a more specific address.");
            } else if (data.status === "OVER_QUERY_LIMIT") {
                throw new Error("API quota exceeded. Please try again later.");
            } else {
                throw new Error(`Geocoding failed: ${data.status}`);
            }
            
        } catch (error) {
            if (attempt === retries) {
                throw error;
            }
            console.warn(`Geocoding attempt ${attempt + 1} failed, retrying...`);
            await delay(1000 * (attempt + 1)); // Exponential backoff
        }
    }
}

// Fetch building insights with error handling
async function fetchBuildingInsights(location) {
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${location.lat}&location.longitude=${location.lng}&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("No solar data available for this location");
        }
        throw new Error(`Solar API error: ${response.status}`);
    }
    
    return await response.json();
}

// Fetch data layers with error handling
async function fetchDataLayers(location) {
    const url = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${location.lat}&location.longitude=${location.lng}&radiusMeters=${solarConfig.radiusMeters}&view=FULL_LAYERS&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk`;
    
    try {
        const response = await fetch(url);
        
        if (response.ok) {
            return await response.json();
        } else {
            console.warn("Data layers not available:", response.status);
            return null;
        }
    } catch (error) {
        console.warn("Failed to fetch data layers:", error);
        return null;
    }
}

// Enhanced results display
async function displayResults(insights, dataLayers, location) {
    // Display solar insights
    displaySolarInsightsAdvanced(insights);
    
    // Draw building outline
    drawBuildingOutline(insights, location);
    
    // Render heatmap overlay
    if (dataLayers) {
        await renderHeatmapOverlay(dataLayers);
    } else {
        showHeatmapUnavailableMessage();
    }
}

// Advanced insights display with financial calculations
function displaySolarInsightsAdvanced(insights) {
    const insightsDetail = document.getElementById("insightsDetail");
    if (!insightsDetail) return;

    if (!insights.solarPotential) {
        updateInsightsDisplay("no-data");
        return;
    }

    const potential = insights.solarPotential;
    
    // Calculate financial estimates
    const estimatedCostPerWatt = 3.50; // Average cost per watt installed
    const electricityRate = 0.12; // Average electricity rate per kWh
    const federalTaxCredit = 0.30; // 30% federal tax credit
    
    let html = `
        <div class="solar-insights">
            <h3 class="text-lg font-semibold mb-4">Solar Analysis Results</h3>
            
            <!-- Key Metrics Grid -->
            <div class="grid grid-cols-2 gap-4 mb-6">
    `;

    // Add metrics with enhanced formatting
    if (potential.maxSunshineHoursPerYear) {
        html += createMetricCard("blue", 
            Math.round(potential.maxSunshineHoursPerYear).toLocaleString(),
            "Peak Sun Hours/Year",
            "Optimal solar exposure time"
        );
    }

    if (potential.maxPofWattsPeak) {
        const powerKw = (potential.maxPofWattsPeak / 1000).toFixed(1);
        const estimatedCost = Math.round(potential.maxPofWattsPeak * estimatedCostPerWatt);
        const costAfterCredit = Math.round(estimatedCost * (1 - federalTaxCredit));
        
        html += createMetricCard("green", 
            `${powerKw} kW`,
            "System Capacity",
            `Est. Cost: $${costAfterCredit.toLocaleString()} (after tax credit)`
        );
    }

    if (potential.maxAnnualKwh) {
        const annualKwh = Math.round(potential.maxAnnualKwh);
        const annualSavings = Math.round(annualKwh * electricityRate);
        
        html += createMetricCard("yellow", 
            annualKwh.toLocaleString(),
            "Annual Production (kWh)",
            `Est. Savings: $${annualSavings.toLocaleString()}/year`
        );
    }

    if (potential.panelCount) {
        html += createMetricCard("purple", 
            potential.panelCount.toString(),
            "Recommended Panels",
            "Optimized configuration"
        );
    }

    html += '</div>';

    // Add detailed configurations if available
    if (potential.panelConfigGroups && potential.panelConfigGroups.length > 0) {
        html += generateConfigurationsSection(potential.panelConfigGroups, electricityRate, estimatedCostPerWatt, federalTaxCredit);
    }

    // Add environmental impact
    if (potential.maxAnnualKwh) {
        const co2Offset = Math.round(potential.maxAnnualKwh * 0.4); // ~0.4 kg CO2 per kWh
        html += `
            <div class="environmental-impact mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 class="font-semibold text-green-800 mb-2">🌱 Environmental Impact</h4>
                <p class="text-sm text-green-700">
                    This solar system could offset approximately <strong>${co2Offset.toLocaleString()} kg</strong> of CO₂ emissions annually.
                    That's equivalent to planting <strong>${Math.round(co2Offset / 20)}</strong> trees each year!
                </p>
            </div>
        `;
    }

    html += '</div>';
    insightsDetail.innerHTML = html;
}

// Helper function to create metric cards
function createMetricCard(color, value, label, subtitle = "") {
    return `
        <div class="metric-card ${color}">
            <div class="metric-value">${value}</div>
            <div class="metric-label">${label}</div>
            ${subtitle ? `<div class="text-xs mt-1 opacity-75">${subtitle}</div>` : ''}
        </div>
    `;
}

// Generate configurations section with financial details
function generateConfigurationsSection(configs, electricityRate, costPerWatt, taxCredit) {
    let html = `
        <div class="configurations-section">
            <h4 class="font-semibold mb-3">💡 Configuration Options</h4>
            <div class="space-y-3">
    `;
    
    configs.forEach((config, index) => {
        const production = Math.round(config.yearlyKwhProduction || 0);
        const panelCount = config.panelCount || 0;
        const savings = Math.round(production * electricityRate);
        const systemSize = panelCount * 400; // Assume 400W panels
        const cost = Math.round(systemSize * costPerWatt);
        const costAfterCredit = Math.round(cost * (1 - taxCredit));
        const paybackYears = costAfterCredit / savings;
        
        html += `
            <div class="panel-config">
                <div class="panel-config-header">
                    <span>Option ${index + 1}</span>
                    <span class="text-sm font-normal">${panelCount} panels (${(systemSize/1000).toFixed(1)} kW)</span>
                </div>
                <div class="panel-config-details">
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>Annual Production: ${production.toLocaleString()} kWh</div>
                        <div>Annual Savings: $${savings.toLocaleString()}</div>
                        <div>System Cost: $${costAfterCredit.toLocaleString()} (after credit)</div>
                        <div>Payback Period: ${paybackYears.toFixed(1)} years</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div></div>';
    return html;
}

// Utility functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setLoadingState(loading) {
    const solarInfo = document.getElementById("solarInfo");
    const searchButton = document.getElementById("searchButton");
    
    if (solarInfo) {
        solarInfo.classList.toggle("loading", loading);
    }
    
    if (searchButton) {
        searchButton.disabled = loading;
        searchButton.textContent = loading ? "Analyzing..." : "Analyze Solar Potential";
    }
}

function clearPreviousResults() {
    if (mapState.buildingPolygon) {
        mapState.buildingPolygon.setMap(null);
        mapState.buildingPolygon = null;
    }
    
    if (mapState.fluxOverlay) {
        mapState.fluxOverlay.setMap(null);
        mapState.fluxOverlay = null;
    }
}

function updateMapView(location) {
    if (mapState.map) {
        mapState.map.setCenter(location);
        mapState.map.setZoom(solarConfig.analysisZoom);
    }
}

function drawBuildingOutline(insights, location) {
    if (insights.solarPotential?.buildingLocation?.polygon) {
        const polygon = insights.solarPotential.buildingLocation.polygon;
        const paths = polygon.map(coord => ({ 
            lat: coord.latitude, 
            lng: coord.longitude 
        }));
        
        mapState.buildingPolygon = new google.maps.Polygon({
            paths: paths,
            ...solarConfig.polygonStyle
        });
        
        mapState.buildingPolygon.setMap(mapState.map);
    } else {
        // Fallback to marker
        new google.maps.Marker({
            position: location,
            map: mapState.map,
            title: "Solar Analysis Location",
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="orange">
                        <path d="M12 2L13.6 8.5H20L15.2 12L16.8 18.5L12 15L7.2 18.5L8.8 12L4 8.5H10.4L12 2Z"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(30, 30)
            }
        });
    }
}

async function renderHeatmapOverlay(dataLayers) {
    if (dataLayers.fluxUrl && dataLayers.dsmBounds) {
        const bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(dataLayers.dsmBounds.sw.latitude, dataLayers.dsmBounds.sw.longitude),
            new google.maps.LatLng(dataLayers.dsmBounds.ne.latitude, dataLayers.dsmBounds.ne.longitude)
        );
        
        mapState.fluxOverlay = new GeoTIFFOverlay(mapState.map, dataLayers.fluxUrl, bounds);
    }
}

function showHeatmapUnavailableMessage() {
    const insightsDetail = document.getElementById("insightsDetail");
    if (insightsDetail) {
        const currentContent = insightsDetail.innerHTML;
        insightsDetail.innerHTML = currentContent + `
            <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p class="text-sm text-amber-800">
                    📍 <strong>Note:</strong> Detailed solar heatmap overlay is not available for this specific location.
                    Solar potential analysis is still accurate based on available data.
                </p>
            </div>
        `;
    }
}

function updateInsightsDisplay(type, message = "") {
    const insightsDetail = document.getElementById("insightsDetail");
    if (!insightsDetail) return;
    
    const messages = {
        welcome: `
            <div class="text-center p-6">
                <div class="text-4xl mb-4">🌞</div>
                <h3 class="text-lg font-semibold mb-2">Solar Potential Analyzer</h3>
                <p class="text-gray-600">Enter an address above to analyze rooftop solar potential and view detailed insights with interactive heatmaps.</p>
            </div>
        `,
        loading: `
            <div class="text-center p-6">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p class="text-gray-600">Analyzing solar potential...</p>
            </div>
        `,
        "no-data": `
            <div class="text-center p-6">
                <div class="text-4xl mb-4">📍</div>
                <h3 class="text-lg font-semibold mb-2">No Solar Data Available</h3>
                <p class="text-gray-600">Solar potential data is not available for this location. Try a different address or check back later.</p>
            </div>
        `,
        error: `
            <div class="text-center p-6">
                <div class="text-4xl mb-4">⚠️</div>
                <h3 class="text-lg font-semibold text-red-600 mb-2">Error</h3>
                <p class="text-gray-600">${message}</p>
            </div>
        `
    };
    
    insightsDetail.innerHTML = messages[type] || messages.error;
}

function handleAnalysisError(error) {
    console.error("Analysis error:", error);
    
    let userMessage = "An unexpected error occurred. Please try again.";
    
    if (error.message.includes("not found")) {
        userMessage = "Address not found. Please try a more specific address.";
    } else if (error.message.includes("quota") || error.message.includes("limit")) {
        userMessage = "API quota exceeded. Please try again later.";
    } else if (error.message.includes("solar data")) {
        userMessage = "No solar data available for this location.";
    }
    
    updateInsightsDisplay("error", userMessage);
    showNotification(userMessage, "error");
}

function showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        max-width: 300px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    // Set background color based on type
    const colors = {
        success: "#10b981",
        warning: "#f59e0b", 
        error: "#ef4444",
        info: "#3b82f6"
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = "1";
        notification.style.transform = "translateX(0)";
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(100%)";
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Export for global access
window.initMapAdvanced = initMapAdvanced;
window.mapState = mapState;
window.solarConfig = solarConfig;

console.log("Advanced Solar Maps loaded successfully");
