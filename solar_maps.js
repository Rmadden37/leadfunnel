// solar_maps.js - Simplified Solar Analysis with Color Gradient

let map;
let buildingPolygon; // Used for drawing the building outline

// NOTE: PROXY_BASE_URL is no longer actively used in this simplified version
// because we are not fetching GeoTIFFs directly anymore.
const PROXY_BASE_URL = 'https://leadfunnel-rho.vercel.app';

function initMap() {
    console.log("Initializing Google Maps...");

    // Detect if mobile for better UX
    const isMobile = window.innerWidth <= 768;

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 27.9306, lng: -82.4497 }, // Default center for Florida
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.SATELLITE, // Satellite view is best for solar analysis
        streetViewControl: false,
        fullscreenControl: !isMobile,
        tilt: 0, // Ensure 2D view for simpler analysis
        heading: 0,
        rotateControl: false,
        gestureHandling: isMobile ? 'cooperative' : 'greedy',
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
    });

    const searchButton = document.getElementById("searchButton");
    const addressInput = document.getElementById("addressInput");

    if (searchButton) {
        searchButton.addEventListener("click", searchAddress);
    }

    if (addressInput) {
        // Google Places Autocomplete setup
        if (google.maps.places) {
            const autocomplete = new google.maps.places.Autocomplete(addressInput, {
                types: ['address'],
                componentRestrictions: { country: 'us' }, // Restrict to US addresses
                fields: ['place_id', 'geometry', 'name', 'formatted_address']
            });

            autocomplete.addListener('place_changed', function() {
                const place = autocomplete.getPlace();
                if (place.geometry) {
                    window.selectedPlace = place;
                    console.log("Autocomplete place selected:", place.formatted_address);
                    // Trigger search after a slight delay to ensure place data is ready
                    setTimeout(function() {
                        searchAddress();
                    }, 100);
                }
            });
        }

        // Allow Enter key to trigger search in address input
        addressInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                searchAddress();
            }
        });

        // Clear selectedPlace if user manually types after autocomplete
        addressInput.addEventListener("input", function(e) {
            if (e.inputType && e.inputType.includes('insert')) {
                window.selectedPlace = null;
            }
        });
    }

    const insightsDetail = document.getElementById("insightsDetail");
    if (insightsDetail) {
        // Initial welcome message for the insights panel
        insightsDetail.innerHTML = '<div class="text-center p-4"><h3 class="text-lg font-semibold mb-2">Welcome to Solar Analysis</h3><p class="text-gray-600">Enter an address above to analyze rooftop solar potential and view detailed insights.</p></div>';
    }
}

/**
 * Main function to search for an address, fetch solar insights, and display them.
 * This version simplifies the process by focusing on basic building insights and
 * a numeric solar potential display, without attempting to render GeoTIFF overlays.
 */
async function searchAddress() {
    const addressInput = document.getElementById("addressInput");
    const solarInfo = document.getElementById("solarInfo");
    const insightsDetail = document.getElementById("insightsDetail");

    if (!addressInput || !addressInput.value.trim()) {
        alert("Please enter an address");
        return;
    }

    const address = addressInput.value.trim();
    console.log('🔍 Starting simplified solar analysis for:', address);

    // Show loading state in the UI
    if (solarInfo) solarInfo.classList.add("loading");

    // Clear any previously drawn building polygon
    if (buildingPolygon) {
        buildingPolygon.setMap(null);
        buildingPolygon = null;
    }

    // Display loading message in the insights panel
    if (insightsDetail) {
        insightsDetail.innerHTML = '<div class="text-center p-4">🔄 Loading detailed solar analysis...</div>';
    }

    try {
        // Determine location either from Autocomplete or by Geocoding the entered address
        let location;
        if (window.selectedPlace && window.selectedPlace.geometry) {
            console.log("Using autocomplete place data");
            location = {
                lat: window.selectedPlace.geometry.location.lat(),
                lng: window.selectedPlace.geometry.location.lng()
            };
        } else {
            console.log("Geocoding address:", address);
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk`;
            const geocodeResponse = await fetch(geocodeUrl);
            const geocodeData = await geocodeResponse.json();

            if (geocodeData.status !== "OK" || !geocodeData.results.length) {
                throw new Error("Address not found. Please try a more specific address.");
            }
            location = geocodeData.results[0].geometry.location;
        }

        console.log("📍 Using location:", location);

        // Update map view to the found location
        map.setCenter(location);
        map.setZoom(20); // Zoom in close enough to see the building
        map.setTilt(0);
        map.setHeading(0);

        // Fetch building insights from Google Solar API
        console.log("🏠 Fetching building insights...");
        const buildingInsightsUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${location.lat}&location.longitude=${location.lng}&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk`;
        const insightsResponse = await fetch(buildingInsightsUrl);

        if (!insightsResponse.ok) {
            const errorText = await insightsResponse.text();
            console.error("Building insights error:", insightsResponse.status, errorText);
            throw new Error(`Solar analysis failed: ${insightsResponse.status} - ${insightsResponse.statusText}`);
        }

        const insights = await insightsResponse.json();
        console.log("✅ Building insights received");

        // Draw the building polygon on the map
        if (insights.solarPotential?.buildingLocation?.polygon) {
            const polygon = insights.solarPotential.buildingLocation.polygon;
            const buildingPaths = polygon.map(coord => ({
                lat: coord.latitude,
                lng: coord.longitude
            }));

            buildingPolygon = new google.maps.Polygon({
                paths: buildingPaths,
                strokeColor: "#00BFFF", // Blue outline for the building
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#00BFFF",
                fillOpacity: 0.15 // Slightly transparent fill
            });

            buildingPolygon.setMap(map);
            console.log("🏗️ Building outline created");
        }

        // Display the fetched solar insights, including the new color gradient scale
        displaySolarInsights(insights);

    } catch (error) {
        console.error("❌ Error in searchAddress:", error);
        // Display an error message in the insights panel if something goes wrong
        if (insightsDetail) {
            insightsDetail.innerHTML = `<div class="text-center p-4">
                <div class="text-red-600 font-semibold">Analysis Error</div>
                <p class="text-gray-600 mt-2">${error.message}</p>
                <button onclick="searchAddress()" class="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Try Again
                </button>
            </div>`;
        }
    } finally {
        // Remove loading state from the UI
        if (solarInfo) solarInfo.classList.remove("loading");
    }
}

/**
 * Displays the solar insights data, including metric cards and a new color-coded solar potential scale.
 */
function displaySolarInsights(insightsData) {
    const insightsDetail = document.getElementById("insightsDetail");
    if (!insightsDetail) return;

    // Handle case where no solar potential data is available for the location
    if (!insightsData.solarPotential) {
        insightsDetail.innerHTML = '<div class="text-center p-4"><p class="text-gray-600">No detailed solar potential data available for this location.</p></div>';
        return;
    }

    const solarPotential = insightsData.solarPotential;

    // Start building the HTML for the insights display
    let html = `<div class="solar-insights p-4">
        <h3 class="text-lg font-semibold mb-4">Solar Analysis Results</h3>
        <div class="grid grid-cols-2 gap-4 mb-4">`;

    // Add metric cards for various solar potential data points
    if (solarPotential.maxSunshineHoursPerYear) {
        html += `<div class="metric-card blue">
            <div class="metric-value">${Math.round(solarPotential.maxSunshineHoursPerYear).toLocaleString()}</div>
            <div class="metric-label">Max Sunshine Hours/Year</div>
        </div>`;
    }

    if (solarPotential.maxPofWattsPeak) {
        html += `<div class="metric-card green">
            <div class="metric-value">${(solarPotential.maxPofWattsPeak / 1000).toFixed(1)} kW</div>
            <div class="metric-label">Max Power Capacity</div>
        </div>`;
    }

    if (solarPotential.maxAnnualKwh) {
        html += `<div class="metric-card yellow">
            <div class="metric-value">${Math.round(solarPotential.maxAnnualKwh).toLocaleString()}</div>
            <div class="metric-label">Max Annual kWh</div>
        </div>`;
    }

    if (solarPotential.panelCount) {
        html += `<div class="metric-card purple">
            <div class="metric-value">${solarPotential.panelCount}</div>
            <div class="metric-label">Recommended Panels</div>
        </div>`;
    }

    html += '</div>'; // Close grid-cols-2 div

    // --- START: NEW CODE FOR SOLAR POTENTIAL COLOR GRADIENT SCALE ---
    if (solarPotential.maxSunshineHoursPerYear) {
        const sunHours = solarPotential.maxSunshineHoursPerYear;
        let potentialLevel = '';
        let bgColorClass = '';    // Tailwind CSS class for background color
        let textColorClass = '';  // Tailwind CSS class for text color

        // Determine potential level and corresponding colors based on sunshine hours
        if (sunHours < 1500) {
            potentialLevel = 'Low Potential';
            bgColorClass = 'bg-red-100';    // Light red background
            textColorClass = 'text-red-800'; // Dark red text
        } else if (sunHours >= 1500 && sunHours < 2000) {
            potentialLevel = 'Good Potential';
            bgColorClass = 'bg-yellow-100';  // Light yellow background
            textColorClass = 'text-yellow-800'; // Dark yellow text
        } else if (sunHours >= 2000 && sunHours < 2500) {
            potentialLevel = 'High Potential';
            bgColorClass = 'bg-green-100';   // Light green background
            textColorClass = 'text-green-800'; // Dark green text
        } else { // sunHours >= 2500
            potentialLevel = 'Excellent Potential';
            bgColorClass = 'bg-blue-100';    // Light blue background (often used for optimal/efficient)
            textColorClass = 'text-blue-800';  // Dark blue text
        }

        // Add the color-coded potential scale to the HTML
        html += `
            <div class="mt-6 p-4 rounded-lg ${bgColorClass} border border-gray-200">
                <h4 class="font-semibold ${textColorClass} mb-2">Overall Solar Potential:</h4>
                <div class="w-full h-4 rounded-full overflow-hidden mb-2">
                    <div class="h-full rounded-full" style="background: linear-gradient(to right, #ef4444, #fcd34d, #4ade80, #3b82f6); width: 100%;"></div>
                </div>
                <p class="${textColorClass} text-lg font-bold text-center">${potentialLevel}</p>
            </div>
        `;
    }
    // --- END: NEW CODE ---

    // Add panel configuration options if available
    if (solarPotential.panelConfigGroups?.length > 0) {
        html += '<div class="mt-4"><h4 class="font-semibold mb-3">Panel Configuration Options</h4><div class="space-y-2">';

        solarPotential.panelConfigGroups.forEach((config, index) => {
            const annualProduction = Math.round(config.yearlyKwhProduction || 0);
            const panelCount = config.panelCount || 0;
            // Example estimated savings: Assuming an average electricity cost of $0.12 per kWh
            const estimatedSavings = annualProduction * 0.12;

            html += `<div class="panel-config">
                <div class="panel-config-header">
                    <span>Configuration ${index + 1}</span>
                    <span class="text-sm font-normal">${panelCount} panels</span>
                </div>
                <div class="panel-config-details">
                    <div>Annual Production: ${annualProduction.toLocaleString()} kWh</div>
                    <div>Estimated Annual Savings: $${Math.round(estimatedSavings).toLocaleString()}</div>
                </div>
            </div>`;
        });

        html += '</div></div>'; // Close panel-config-groups div and mt-4 div
    }

    html += '</div>'; // Close solar-insights div
    insightsDetail.innerHTML = html; // Inject generated HTML into the insights panel
}

// Ensure initMap is available globally for the Google Maps API callback
window.initMap = initMap;