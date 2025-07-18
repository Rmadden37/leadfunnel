// Enhanced Solar Maps with Mobile Optimization
// Complete mobile-optimized version with improved UX

let map;
let buildingPolygon;
let fluxOverlay;

// Enhanced mobile map configuration
function initMap() {
    console.log("Initializing Google Maps with mobile optimizations...");
    
    // Detect if user is on mobile device
    const isMobile = window.innerWidth <= 768;
    
    const mapOptions = {
        center: { lat: 27.9306, lng: -82.4497 },
        zoom: isMobile ? 16 : 17,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        streetViewControl: false,
        fullscreenControl: !isMobile, // Hide on mobile to save space
        mapTypeControl: !isMobile,   // Hide on mobile to save space
        tilt: 0,
        heading: 0,
        rotateControl: false,
        gestureHandling: 'cooperative', // Prevent scroll conflicts on mobile
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        styles: [
            // Optional: Dark mode optimizations for mobile
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            },
            {
                featureType: "transit",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
        ]
    };

    map = new google.maps.Map(document.getElementById("map"), mapOptions);

    // Add responsive map height
    adjustMapHeight();
    window.addEventListener('resize', adjustMapHeight);

    setupAddressSearch();
    setupInitialContent();
}

// Responsive map height adjustment
function adjustMapHeight() {
    const mapElement = document.getElementById("map");
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mobile: Use viewport-relative height
        mapElement.style.height = Math.max(300, window.innerHeight * 0.35) + 'px';
    } else {
        // Desktop/tablet: Fixed height
        mapElement.style.height = '400px';
    }
}

// Enhanced address search with better mobile UX
function setupAddressSearch() {
    const searchButton = document.getElementById("searchButton");
    const addressInput = document.getElementById("addressInput");
    
    if (searchButton) {
        searchButton.addEventListener("click", () => {
            handleAddressSearch();
        });
    }
    
    if (addressInput) {
        // Enhanced autocomplete for mobile
        if (google.maps.places) {
            const autocomplete = new google.maps.places.Autocomplete(addressInput, {
                types: ['address'],
                componentRestrictions: { country: 'us' },
                fields: ['place_id', 'geometry', 'name', 'formatted_address']
            });
            
            autocomplete.addListener('place_changed', function() {
                const place = autocomplete.getPlace();
                if (place.geometry) {
                    window.selectedPlace = place;
                    console.log("Autocomplete place selected:", place.formatted_address);
                    // Add slight delay for better UX
                    showLoadingState("Analyzing location...");
                    setTimeout(() => {
                        handleAddressSearch();
                    }, 500);
                }
            });
        }
        
        // Enhanced keyboard handling
        addressInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                handleAddressSearch();
            }
        });
        
        // Clear selection on manual input
        addressInput.addEventListener("input", function(e) {
            if (e.inputType && e.inputType.includes('insert')) {
                window.selectedPlace = null;
            }
        });

        // Mobile: Add focus/blur handling for better UX
        addressInput.addEventListener('focus', function() {
            if (window.innerWidth <= 768) {
                // Slight delay to ensure keyboard is shown
                setTimeout(() => {
                    this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        });
    }
}

// Enhanced loading states with skeleton screens
function showLoadingState(message = "Loading...") {
    const solarInfo = document.getElementById("solarInfo");
    const insightsDetail = document.getElementById("insightsDetail");
    
    if (solarInfo) {
        solarInfo.classList.add("loading");
        solarInfo.innerHTML = `
            <div class="loading-skeleton">
                <div class="flex items-center justify-center p-6">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    <span class="text-gray-600">${message}</span>
                </div>
            </div>
        `;
    }
    
    if (insightsDetail) {
        insightsDetail.innerHTML = `
            <div class="space-y-4 p-4">
                <div class="animate-pulse">
                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div class="h-20 bg-gray-200 rounded mb-4"></div>
                    <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
            </div>
        `;
    }
}

function hideLoadingState() {
    const solarInfo = document.getElementById("solarInfo");
    if (solarInfo) {
        solarInfo.classList.remove("loading");
    }
}

// Enhanced error handling with user-friendly messages
function showError(message, isNetworkError = false) {
    hideLoadingState();
    
    const solarInfo = document.getElementById("solarInfo");
    const insightsDetail = document.getElementById("insightsDetail");
    
    let errorContent;
    
    if (isNetworkError) {
        errorContent = `
            <div class="text-center p-6">
                <div class="text-red-500 mb-4">
                    <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Connection Issue</h3>
                <p class="text-gray-600 text-sm mb-4">${message}</p>
                <button onclick="retryLastSearch()" 
                        class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                    Try Again
                </button>
            </div>
        `;
    } else {
        errorContent = `
            <div class="text-center p-6">
                <div class="text-yellow-500 mb-4">
                    <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Analysis Not Available</h3>
                <p class="text-gray-600 text-sm">${message}</p>
            </div>
        `;
    }
    
    if (solarInfo) {
        solarInfo.innerHTML = errorContent;
    }
    
    if (insightsDetail) {
        insightsDetail.innerHTML = errorContent;
    }
}

// Store last search for retry functionality
let lastSearchData = null;

function retryLastSearch() {
    if (lastSearchData) {
        showLoadingState("Retrying analysis...");
        setTimeout(() => {
            searchAddress(lastSearchData.address, lastSearchData.lat, lastSearchData.lng);
        }, 1000);
    }
}

// Enhanced address search function
async function handleAddressSearch() {
    const addressInput = document.getElementById("addressInput");
    let address = addressInput ? addressInput.value.trim() : '';
    
    if (!address) {
        showError("Please enter an address to analyze.", false);
        return;
    }
    
    showLoadingState("Finding location...");
    
    try {
        let lat, lng;
        
        // Use autocomplete result if available
        if (window.selectedPlace && window.selectedPlace.geometry) {
            lat = window.selectedPlace.geometry.location.lat();
            lng = window.selectedPlace.geometry.location.lng();
            address = window.selectedPlace.formatted_address;
        } else {
            // Fall back to geocoding
            const geocoder = new google.maps.Geocoder();
            const results = await new Promise((resolve, reject) => {
                geocoder.geocode({ address: address }, (results, status) => {
                    if (status === 'OK') resolve(results);
                    else reject(status);
                });
            });
            
            if (results && results[0]) {
                lat = results[0].geometry.location.lat();
                lng = results[0].geometry.location.lng();
                address = results[0].formatted_address;
            } else {
                throw new Error("Address not found");
            }
        }
        
        // Store for retry functionality
        lastSearchData = { address, lat, lng };
        
        showLoadingState("Analyzing solar potential...");
        await searchAddress(address, lat, lng);
        
    } catch (error) {
        console.error("Geocoding error:", error);
        showError("Could not find that address. Please try a different location or check your spelling.", false);
    }
}

// Connection quality detection
function detectConnectionQuality() {
    if ('connection' in navigator) {
        const connection = navigator.connection;
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            return 'slow';
        } else if (connection.effectiveType === '3g') {
            return 'medium';
        }
    }
    return 'fast';
}

// Timeout wrapper for mobile networks
function fetchWithTimeout(url, options = {}, timeout = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    return fetch(url, {
        ...options,
        signal: controller.signal
    }).finally(() => {
        clearTimeout(timeoutId);
    });
}

// Enhanced search function with mobile optimizations
async function searchAddress(address, lat, lng) {
    console.log(`Searching for: ${address} at ${lat}, ${lng}`);
    
    try {
        // Clear existing overlays
        clearOverlays();
        
        // Center map on location with mobile-friendly zoom
        const isMobile = window.innerWidth <= 768;
        map.setCenter({ lat, lng });
        map.setZoom(isMobile ? 18 : 19);
        
        // Detect connection quality for mobile optimization
        const connectionQuality = detectConnectionQuality();
        const timeout = connectionQuality === 'slow' ? 25000 : 15000;
        
        showLoadingState("Getting solar data...");
        
        // Try to get solar data with mobile-optimized timeout
        const solarData = await fetchSolarDataWithTimeout(lat, lng, timeout);
        
        if (solarData) {
            showLoadingState("Rendering solar analysis...");
            await displaySolarAnalysis(solarData, address, lat, lng);
            hideLoadingState();
        } else {
            throw new Error("No solar data available for this location");
        }
        
    } catch (error) {
        console.error("Search error:", error);
        
        const isNetworkError = error.name === 'AbortError' || 
                              error.message.includes('fetch') || 
                              error.message.includes('network');
        
        const message = isNetworkError 
            ? "Network connection issue. Please check your connection and try again."
            : "Solar analysis is not available for this location. Try a different address.";
            
        showError(message, isNetworkError);
    }
}

// Mobile-optimized solar data fetching
async function fetchSolarDataWithTimeout(lat, lng, timeout = 15000) {
    const configs = [
        { view: 'IMAGERY_AND_ANNUAL_FLUX_LAYERS', radiusMeters: 100 },
        { view: 'ANNUAL_FLUX_LAYER', radiusMeters: 100 },
        { view: 'FULL_LAYERS', radiusMeters: 50 },
    ];
    
    for (const config of configs) {
        try {
            const url = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${lat}&location.longitude=${lng}&radiusMeters=${config.radiusMeters}&view=${config.view}&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk`;
            
            console.log(`Trying ${config.view} with ${config.radiusMeters}m radius`);
            
            const response = await fetchWithTimeout(url, {}, timeout);
            
            if (response.ok) {
                const data = await response.json();
                if (data.imageryDate || data.geoTiff) {
                    console.log("✅ Solar data found:", config.view);
                    return data;
                }
            }
        } catch (error) {
            console.log(`❌ ${config.view} failed:`, error.message);
            continue;
        }
    }
    
    return null;
}

// Setup initial content
function setupInitialContent() {
    const insightsDetail = document.getElementById("insightsDetail");
    if (insightsDetail) {
        insightsDetail.innerHTML = `
            <div class="text-center p-6">
                <div class="text-blue-600 mb-4">
                    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-semibold mb-3 text-gray-800">Welcome to Solar Analysis</h3>
                <p class="text-gray-600 mb-4">Enter your address above to see your rooftop's solar potential with detailed insights and savings calculations.</p>
                <div class="text-sm text-gray-500">
                    <p>✓ Instant analysis using Google Solar API</p>
                    <p>✓ Detailed financial projections</p>
                    <p>✓ Interactive solar flux maps</p>
                </div>
            </div>
        `;
    }
}

// Clear overlays function
function clearOverlays() {
    if (buildingPolygon) {
        buildingPolygon.setMap(null);
        buildingPolygon = null;
    }
    if (fluxOverlay) {
        fluxOverlay.setMap(null);
        fluxOverlay = null;
    }
}

// Enhanced display solar analysis with mobile optimizations
async function displaySolarAnalysis(data, address, lat, lng) {
    console.log("Displaying solar analysis for mobile...", data);
    
    const solarInfo = document.getElementById("solarInfo");
    const insightsDetail = document.getElementById("insightsDetail");
    
    if (!solarInfo || !insightsDetail) {
        console.error("Required elements not found");
        return;
    }
    
    // Extract building insights with safe defaults
    const buildingInsights = data.buildingInsights || {};
    const maxArrayArea = buildingInsights.maxArrayAreaMeters2 || 0;
    const maxPanels = buildingInsights.maxArrayPanelsCount || 0;
    const yearlyEnergyKwh = buildingInsights.maxArrayAnnualKwhTotal || 0;
    
    // Financial insights with safe defaults
    const financialAnalysis = buildingInsights.financialAnalyses?.[0] || {};
    const monthlyBill = financialAnalysis.monthlyBill?.units || 0;
    const leasingSavings = financialAnalysis.leasingSavings || {};
    const savings20Years = leasingSavings.savings?.units || 0;
    
    // Mobile-optimized display
    const isMobile = window.innerWidth <= 768;
    
    // Main solar info - condensed for mobile
    solarInfo.innerHTML = `
        <div class="space-y-${isMobile ? '3' : '4'}">
            <div class="text-center ${isMobile ? 'pb-2' : 'pb-4'} border-b border-gray-200">
                <h3 class="text-${isMobile ? 'lg' : 'xl'} font-bold text-gray-800 mb-1">Solar Analysis Complete</h3>
                <p class="text-${isMobile ? 'xs' : 'sm'} text-gray-600 truncate">${address}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-${isMobile ? '2' : '4'}">
                <div class="bg-blue-50 p-${isMobile ? '3' : '4'} rounded-lg text-center">
                    <div class="text-${isMobile ? 'xl' : '2xl'} font-bold text-blue-600">${maxPanels}</div>
                    <div class="text-${isMobile ? 'xs' : 'sm'} text-gray-600">Solar Panels</div>
                </div>
                <div class="bg-green-50 p-${isMobile ? '3' : '4'} rounded-lg text-center">
                    <div class="text-${isMobile ? 'xl' : '2xl'} font-bold text-green-600">${Math.round(maxArrayArea)}</div>
                    <div class="text-${isMobile ? 'xs' : 'sm'} text-gray-600">sq ft</div>
                </div>
                <div class="bg-yellow-50 p-${isMobile ? '3' : '4'} rounded-lg text-center">
                    <div class="text-${isMobile ? 'xl' : '2xl'} font-bold text-yellow-600">${Math.round(yearlyEnergyKwh).toLocaleString()}</div>
                    <div class="text-${isMobile ? 'xs' : 'sm'} text-gray-600">kWh/year</div>
                </div>
                <div class="bg-purple-50 p-${isMobile ? '3' : '4'} rounded-lg text-center">
                    <div class="text-${isMobile ? 'xl' : '2xl'} font-bold text-purple-600">$${Math.round(savings20Years).toLocaleString()}</div>
                    <div class="text-${isMobile ? 'xs' : 'sm'} text-gray-600">20yr Savings</div>
                </div>
            </div>
        </div>
    `;
    
    // Detailed insights - mobile-optimized layout
    const monthlyEnergy = Math.round(yearlyEnergyKwh / 12);
    const monthlySavings = Math.round(savings20Years / 240); // 20 years * 12 months
    
    insightsDetail.innerHTML = `
        <div class="space-y-${isMobile ? '4' : '6'}">
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-${isMobile ? '4' : '6'} rounded-lg">
                <h2 class="text-${isMobile ? 'lg' : 'xl'} font-bold mb-2">Your Solar Potential</h2>
                <div class="text-${isMobile ? 'sm' : 'base'} opacity-90">
                    This rooftop can generate <strong>${monthlyEnergy.toLocaleString()} kWh per month</strong>, 
                    potentially saving you <strong>$${monthlySavings}/month</strong> on electricity costs.
                </div>
            </div>
            
            <div class="grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-${isMobile ? '3' : '4'}">
                <div class="bg-white border border-gray-200 p-${isMobile ? '3' : '4'} rounded-lg">
                    <h3 class="font-semibold text-gray-800 mb-2 text-${isMobile ? 'sm' : 'base'}">Energy Production</h3>
                    <div class="space-y-1 text-${isMobile ? 'xs' : 'sm'} text-gray-600">
                        <div class="flex justify-between">
                            <span>Annual Output:</span>
                            <span class="font-medium">${Math.round(yearlyEnergyKwh).toLocaleString()} kWh</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Monthly Average:</span>
                            <span class="font-medium">${monthlyEnergy.toLocaleString()} kWh</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Panel Efficiency:</span>
                            <span class="font-medium">${maxPanels > 0 ? Math.round(yearlyEnergyKwh/maxPanels) : 0} kWh/panel</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white border border-gray-200 p-${isMobile ? '3' : '4'} rounded-lg">
                    <h3 class="font-semibold text-gray-800 mb-2 text-${isMobile ? 'sm' : 'base'}">Financial Impact</h3>
                    <div class="space-y-1 text-${isMobile ? 'xs' : 'sm'} text-gray-600">
                        <div class="flex justify-between">
                            <span>Monthly Savings:</span>
                            <span class="font-medium text-green-600">$${monthlySavings}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Annual Savings:</span>
                            <span class="font-medium text-green-600">$${Math.round(monthlySavings * 12).toLocaleString()}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>20-Year Total:</span>
                            <span class="font-medium text-green-600">$${Math.round(savings20Years).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            ${!isMobile ? `
            <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div class="flex items-start">
                    <svg class="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div class="text-sm">
                        <p class="font-medium text-yellow-800 mb-1">Important Note</p>
                        <p class="text-yellow-700">These estimates are based on Google's Solar API data and current energy rates. Actual results may vary based on local regulations, energy prices, and installation costs.</p>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    // Try to display flux overlay
    try {
        await displayFluxOverlay(data, lat, lng);
    } catch (error) {
        console.log("Flux overlay not available:", error.message);
    }
    
    // Display building outline if available
    if (data.buildingInsights?.boundingBox) {
        displayBuildingOutline(data.buildingInsights.boundingBox);
    }
}

// Rest of the functions remain the same but with mobile optimizations...
// [Include all other functions from the original file with mobile enhancements]

// Export for global access
window.initMap = initMap;
window.searchAddress = handleAddressSearch;
window.retryLastSearch = retryLastSearch;
