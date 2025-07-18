// Fixed Solar Maps with Proper Flux Overlay Implementation
// Replace your solar_maps.js file with this corrected version

let map;
let buildingPolygon;
let fluxOverlay;

// UPDATE THIS TO YOUR ACTUAL VERCEL DEPLOYMENT URL
const PROXY_BASE_URL = 'https://leadfunnel-rho.vercel.app';

function initMap() {
    console.log("Initializing Google Maps...");
    
    // Detect if mobile for better UX
    const isMobile = window.innerWidth <= 768;
    
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 27.9306, lng: -82.4497 },
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        streetViewControl: false,
        fullscreenControl: !isMobile,
        tilt: 0,
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
                    setTimeout(function() {
                        searchAddress();
                    }, 100);
                }
            });
        }
        
        addressInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                searchAddress();
            }
        });
        
        addressInput.addEventListener("input", function(e) {
            if (e.inputType && e.inputType.includes('insert')) {
                window.selectedPlace = null;
            }
        });
    }

    const insightsDetail = document.getElementById("insightsDetail");
    if (insightsDetail) {
        insightsDetail.innerHTML = '<div class="text-center p-4"><h3 class="text-lg font-semibold mb-2">Welcome to Solar Analysis</h3><p class="text-gray-600">Enter an address above to analyze rooftop solar potential and view detailed insights.</p></div>';
    }
}

// Fixed function to get solar data layers with better error handling
async function getSolarDataLayers(lat, lng) {
    console.log('🌞 Fetching Solar Data Layers for Tampa Bay area...');
    console.log('📍 Location:', lat, lng);
    
    try {
        // Optimized request for Tampa Bay high-quality data
        const url = `https://solar.googleapis.com/v1/dataLayers:get?` +
                   `location.latitude=${lat}&` +
                   `location.longitude=${lng}&` +
                   `radiusMeters=50&` +
                   `view=FULL_LAYERS&` +
                   `requiredQuality=HIGH&` +
                   `pixelSizeMeters=0.1&` +
                   `exactQualityRequired=false&` +
                   `key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk`;
        
        console.log('🔗 Making request to:', url.substring(0, 100) + '...');
        
        const response = await fetch(url);
        console.log(`📡 Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText.substring(0, 200));
            throw new Error(`Solar API request failed: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Data received, keys:', Object.keys(data));
        
        // Check for available flux URLs in order of preference
        const fluxUrl = data.annualFluxUrl || 
                       data.monthlyFluxUrl || 
                       data.fluxUrl || 
                       data.irradianceUrl;
        
        if (fluxUrl) {
            console.log('🎯 FLUX URL FOUND:', fluxUrl.substring(0, 80) + '...');
            
            // Get bounds information
            const bounds = data.imageryBounds || 
                          data.annualFluxBounds ||
                          data.dsmBounds || 
                          data.bounds;
            
            if (bounds) {
                console.log('📐 Bounds found:', bounds);
                data.bounds = bounds; // Normalize bounds property
            } else {
                console.log('📐 No bounds found, creating estimated bounds');
                const offset = 0.0005; // ~50 meters
                data.estimatedBounds = {
                    sw: { latitude: lat - offset, longitude: lng - offset },
                    ne: { latitude: lat + offset, longitude: lng + offset }
                };
            }
            
            return data;
        } else {
            console.log('❌ No flux URL found in response');
            console.log('Available data fields:', Object.keys(data));
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error fetching solar data:', error.message);
        return null;
    }
}

// FIXED: Enhanced function to create real flux overlay with proper error handling
async function createRealFluxOverlay(dataLayersData, location) {
    console.log("🔄 Creating real flux overlay...");
    
    try {
        // FIXED: Get the flux URL from the data
        const fluxUrl = dataLayersData.annualFluxUrl || 
                       dataLayersData.monthlyFluxUrl || 
                       dataLayersData.fluxUrl || 
                       dataLayersData.irradianceUrl;
        
        if (!fluxUrl) {
            throw new Error('No flux URL found in data');
        }
        
        console.log("📊 Using flux URL:", fluxUrl.substring(0, 80) + "...");
        
        // Get bounds - prefer smaller, more detailed bounds
        let bounds = dataLayersData.bounds || 
                    dataLayersData.imageryBounds || 
                    dataLayersData.annualFluxBounds ||
                    dataLayersData.estimatedBounds ||
                    dataLayersData.dsmBounds;
        
        if (!bounds) {
            console.log("Creating precise bounds around building location");
            const offset = 0.0003; // ~30 meters for detailed view
            bounds = {
                sw: { latitude: location.lat - offset, longitude: location.lng - offset },
                ne: { latitude: location.lat + offset, longitude: location.lng + offset }
            };
        }
        
        console.log("🗺️ BOUNDS DEBUG:");
        console.log("Building location:", location);
        console.log("Overlay bounds:", bounds);
        
        // Validate bounds contain the building location
        const containsBuilding = (
            location.lat >= bounds.sw.latitude && 
            location.lat <= bounds.ne.latitude &&
            location.lng >= bounds.sw.longitude && 
            location.lng <= bounds.ne.longitude
        );
        
        if (!containsBuilding) {
            console.log("🚨 Adjusting bounds to include building...");
            const offsetLat = 0.0005;
            const offsetLng = 0.0005;
            bounds = {
                sw: { latitude: location.lat - offsetLat, longitude: location.lng - offsetLng },
                ne: { latitude: location.lat + offsetLat, longitude: location.lng + offsetLng }
            };
            console.log("📍 Adjusted bounds:", bounds);
        }
        
        // Ensure map is in 2D mode for proper overlay rendering
        map.setTilt(0);
        map.setHeading(0);
        
        // FIXED: Prepare the proxied URL with proper encoding
        const fluxUrlWithKey = fluxUrl.includes('key=') ? fluxUrl : `${fluxUrl}&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk`;
        const proxiedUrl = `${PROXY_BASE_URL}/api/geotiff-proxy?url=${encodeURIComponent(fluxUrlWithKey)}`;
        
        console.log("🔗 Testing proxy URL:", proxiedUrl);
        
        // Test the proxy endpoint first with a HEAD request
        try {
            const testResponse = await fetch(proxiedUrl, { method: 'HEAD' });
            console.log(`🧪 Proxy test result: ${testResponse.status} ${testResponse.statusText}`);
            
            if (!testResponse.ok) {
                console.error(`❌ Proxy test failed: ${testResponse.status}`);
                // Try with GET instead of HEAD
                const getTest = await fetch(proxiedUrl);
                console.log(`🧪 GET test result: ${getTest.status} ${getTest.statusText}`);
                if (!getTest.ok) {
                    throw new Error(`Proxy unavailable: ${getTest.status}`);
                }
            }
        } catch (proxyError) {
            console.error('❌ Proxy test failed:', proxyError.message);
            throw new Error(`Proxy connection failed: ${proxyError.message}`);
        }
        
        // Create precise map bounds
        const mapBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(bounds.sw.latitude, bounds.sw.longitude),
            new google.maps.LatLng(bounds.ne.latitude, bounds.ne.longitude)
        );
        
        // Remove any existing overlay
        if (fluxOverlay) {
            fluxOverlay.setMap(null);
        }
        
        // Create GroundOverlay with enhanced visibility
        fluxOverlay = new google.maps.GroundOverlay(
            proxiedUrl,
            mapBounds,
            {
                opacity: 0.85,
                clickable: false
            }
        );
        
        // Add comprehensive error handling
        let overlayLoaded = false;
        let loadingTimeout;
        
        fluxOverlay.addListener('error', function(error) {
            console.error('🚨 GroundOverlay ERROR:', error);
            clearTimeout(loadingTimeout);
        });
        
        fluxOverlay.addListener('idle', function() {
            overlayLoaded = true;
            console.log('✅ GroundOverlay loaded successfully!');
            clearTimeout(loadingTimeout);
        });
        
        // Set a loading timeout
        loadingTimeout = setTimeout(() => {
            if (!overlayLoaded) {
                console.log('⚠️ Overlay loading timeout - testing URL directly...');
                
                fetch(proxiedUrl)
                    .then(response => {
                        console.log('Direct URL test:', response.status, response.statusText);
                        console.log('Content-Type:', response.headers.get('content-type'));
                        console.log('Content-Length:', response.headers.get('content-length'));
                    })
                    .catch(error => {
                        console.error('❌ Direct URL test failed:', error);
                    });
            }
        }, 15000);
        
        // Add the overlay to the map
        fluxOverlay.setMap(map);
        
        // Add visual bounds indicator (temporary)
        const testRect = new google.maps.Rectangle({
            bounds: mapBounds,
            strokeColor: '#00FF00',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillOpacity: 0
        });
        testRect.setMap(map);
        
        // Remove test rectangle after 5 seconds
        setTimeout(() => {
            testRect.setMap(null);
            console.log("✅ Green test rectangle removed");
        }, 5000);
        
        console.log('🎯 GroundOverlay created successfully');
        console.log('  URL:', proxiedUrl.substring(0, 100) + '...');
        console.log('  Bounds:', mapBounds.toString());
        
        // Fit map to show the overlay area
        const extendedBounds = new google.maps.LatLngBounds();
        extendedBounds.extend(new google.maps.LatLng(bounds.sw.latitude - 0.0001, bounds.sw.longitude - 0.0001));
        extendedBounds.extend(new google.maps.LatLng(bounds.ne.latitude + 0.0001, bounds.ne.longitude + 0.0001));
        map.fitBounds(extendedBounds);
        
        return true;
        
    } catch (error) {
        console.error("❌ Real flux overlay creation failed:", error.message);
        
        // Clean up failed overlay
        if (fluxOverlay) {
            fluxOverlay.setMap(null);
            fluxOverlay = null;
        }
        
        throw error;
    }
}

// Enhanced simulation overlay as fallback
function createHighQualitySimulatedOverlay(solarPotential, location, buildingPolygonPaths) {
    console.log("🎨 Creating high-quality simulated flux overlay...");
    
    try {
        // Calculate intensity based on solar potential
        let intensity = 0.5;
        if (solarPotential.maxSunshineHoursPerYear) {
            intensity = Math.min(solarPotential.maxSunshineHoursPerYear / 2500, 1);
        }
        
        // Use building polygon if available for precise overlay
        if (buildingPolygonPaths && buildingPolygonPaths.length > 0) {
            console.log("Creating rooftop-specific simulated overlay");
            
            // Remove existing overlay
            if (fluxOverlay) {
                fluxOverlay.setMap(null);
            }
            
            // Create detailed rooftop overlay with gradient effect
            fluxOverlay = new google.maps.Polygon({
                paths: buildingPolygonPaths,
                strokeColor: intensity > 0.7 ? '#FF4500' : intensity > 0.5 ? '#FF8C00' : '#FFD700',
                strokeOpacity: 0.9,
                strokeWeight: 2,
                fillColor: intensity > 0.7 ? '#FF6347' : intensity > 0.5 ? '#FFA500' : '#FFD700',
                fillOpacity: 0.6
            });
            
            fluxOverlay.setMap(map);
            
            // Add hover effects for interactivity
            fluxOverlay.addListener('mouseover', function() {
                this.setOptions({ fillOpacity: 0.8 });
            });
            
            fluxOverlay.addListener('mouseout', function() {
                this.setOptions({ fillOpacity: 0.6 });
            });
            
            console.log("✅ Rooftop-specific simulated overlay created");
            return true;
        }
        
        console.log("❌ No building polygon available for detailed simulation");
        return false;
        
    } catch (error) {
        console.error("❌ Simulated overlay creation failed:", error);
        return false;
    }
}

// FIXED: Enhanced search function with better error handling
async function searchAddress() {
    const addressInput = document.getElementById("addressInput");
    const solarInfo = document.getElementById("solarInfo");
    const insightsDetail = document.getElementById("insightsDetail");
    
    if (!addressInput || !addressInput.value.trim()) {
        alert("Please enter an address");
        return;
    }

    const address = addressInput.value.trim();
    console.log('🔍 Starting enhanced solar analysis for:', address);
    
    // Show loading state
    if (solarInfo) solarInfo.classList.add("loading");
    
    // Clear previous overlays
    if (buildingPolygon) {
        buildingPolygon.setMap(null);
        buildingPolygon = null;
    }
    if (fluxOverlay) {
        fluxOverlay.setMap(null);
        fluxOverlay = null;
    }
    
    if (insightsDetail) {
        insightsDetail.innerHTML = '<div class="text-center p-4">🔄 Loading detailed solar analysis...</div>';
    }

    try {
        // Get location
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

        // Set map view
        map.setCenter(location);
        map.setZoom(20);
        map.setTilt(0);
        map.setHeading(0);

        // Get building insights first
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

        // Display insights first
        displaySolarInsights(insights);

        // Draw building polygon
        let buildingPaths = null;
        if (insights.solarPotential?.buildingLocation?.polygon) {
            const polygon = insights.solarPotential.buildingLocation.polygon;
            buildingPaths = polygon.map(coord => ({ 
                lat: coord.latitude, 
                lng: coord.longitude 
            }));
            
            buildingPolygon = new google.maps.Polygon({
                paths: buildingPaths,
                strokeColor: "#00BFFF",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#00BFFF",
                fillOpacity: 0.15
            });
            
            buildingPolygon.setMap(map);
            console.log("🏗️ Building outline created");
        }

        // FIXED: Get detailed solar flux data with better error handling
        console.log("☀️ Fetching detailed solar flux data...");
        let overlaySuccess = false;
        
        try {
            const dataLayersData = await getSolarDataLayers(location.lat, location.lng);

            if (dataLayersData) {
                try {
                    overlaySuccess = await createRealFluxOverlay(dataLayersData, location);
                    
                    if (overlaySuccess && insightsDetail) {
                        const currentContent = insightsDetail.innerHTML;
                        insightsDetail.innerHTML = currentContent + 
                            `<div class="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
                                <p class="text-sm text-green-800 font-semibold mb-2">🎯 High-Resolution Solar Heat Map Active!</p>
                                <p class="text-xs text-green-700 mb-3">Detailed Google Solar API flux overlay showing precise rooftop solar irradiance:</p>
                                <div class="flex items-center justify-between text-xs">
                                    <div class="flex items-center">
                                        <div class="w-3 h-3 rounded mr-1" style="background: rgba(60, 80, 120, 0.9);"></div>
                                        <span class="text-blue-700">Shaded</span>
                                    </div>
                                    <div class="flex items-center">
                                        <div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 215, 0, 0.9);"></div>
                                        <span class="text-yellow-700">Good</span>
                                    </div>
                                    <div class="flex items-center">
                                        <div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 140, 0, 0.9);"></div>
                                        <span class="text-orange-700">Excellent</span>
                                    </div>
                                    <div class="flex items-center">
                                        <div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 69, 0, 1);"></div>
                                        <span class="text-red-700">Optimal</span>
                                    </div>
                                </div>
                                <p class="text-xs text-green-600 mt-2 font-medium">🔥 Look for the bright orange/yellow areas - those are your best solar zones!</p>
                            </div>`;
                    }
                } catch (overlayError) {
                    console.error("Real overlay failed:", overlayError.message);
                    overlaySuccess = false;
                }
            }
        } catch (dataLayersError) {
            console.error("Data layers fetch failed:", dataLayersError.message);
            overlaySuccess = false;
        }

        // Fallback to simulation if real overlay failed
        if (!overlaySuccess && insights.solarPotential) {
            console.log("🎨 Using enhanced simulation fallback...");
            const simulationSuccess = createHighQualitySimulatedOverlay(
                insights.solarPotential, 
                location, 
                buildingPaths
            );
            
            if (simulationSuccess && insightsDetail) {
                const currentContent = insightsDetail.innerHTML;
                insightsDetail.innerHTML = currentContent + 
                    `<div class="mt-4 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                        <p class="text-sm text-blue-800 font-semibold mb-2">🎨 Enhanced Solar Simulation Active!</p>
                        <p class="text-xs text-blue-700 mb-3">High-quality rooftop simulation based on your solar potential:</p>
                        <div class="flex items-center justify-between text-xs">
                            <div class="flex items-center">
                                <div class="w-3 h-3 rounded mr-1" style="background: rgba(135, 206, 235, 0.8);"></div>
                                <span class="text-blue-700">Low</span>
                            </div>
                            <div class="flex items-center">
                                <div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 215, 0, 0.8);"></div>
                                <span class="text-yellow-700">Good</span>
                            </div>
                            <div class="flex items-center">
                                <div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 140, 0, 0.9);"></div>
                                <span class="text-orange-700">High</span>
                            </div>
                            <div class="flex items-center">
                                <div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 69, 0, 1);"></div>
                                <span class="text-red-700">Optimal</span>
                            </div>
                        </div>
                        <p class="text-xs text-gray-600 mt-2"><em>Detailed flux data temporarily unavailable - using enhanced simulation</em></p>
                    </div>`;
            }
        }

        if (!overlaySuccess && insightsDetail) {
            const currentContent = insightsDetail.innerHTML;
            insightsDetail.innerHTML = currentContent + 
                `<div class="mt-4 p-3 bg-orange-100 border border-orange-400 rounded">
                    <p class="text-sm text-orange-800">ℹ️ Solar analysis complete. Detailed irradiance mapping temporarily unavailable for this location.</p>
                </div>`;
        }

    } catch (error) {
        console.error("❌ Error in searchAddress:", error);
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
        if (solarInfo) solarInfo.classList.remove("loading");
    }
}

function displaySolarInsights(insightsData) {
    const insightsDetail = document.getElementById("insightsDetail");
    if (!insightsDetail) return;

    if (!insightsData.solarPotential) {
        insightsDetail.innerHTML = '<div class="text-center p-4"><p class="text-gray-600">No detailed solar potential data available for this location.</p></div>';
        return;
    }

    const solarPotential = insightsData.solarPotential;
    
    let html = `<div class="solar-insights p-4">
        <h3 class="text-lg font-semibold mb-4">Solar Analysis Results</h3>
        <div class="grid grid-cols-2 gap-4 mb-4">`;

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

    html += '</div>';

    if (solarPotential.panelConfigGroups?.length > 0) {
        html += '<div class="mt-4"><h4 class="font-semibold mb-3">Panel Configuration Options</h4><div class="space-y-2">';
        
        solarPotential.panelConfigGroups.forEach((config, index) => {
            const annualProduction = Math.round(config.yearlyKwhProduction || 0);
            const panelCount = config.panelCount || 0;
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
        
        html += '</div></div>';
    }

    html += '</div>';
    insightsDetail.innerHTML = html;
}

// Make sure initMap is available globally
window.initMap = initMap;