// Global Variables
let map;
let buildingPolygon;
let fluxOverlay;

// Debug function to test Solar API data layers
async function testSolarDataLayers(lat, lng) {
    const url = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${lat}&location.longitude=${lng}&radiusMeters=100&view=FULL_LAYERS&requiredQuality=HIGH&pixelSizeMeters=0.5&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk`;
    
    try {
        console.log("Testing Solar Data Layers API at:", lat, lng);
        console.log("Request URL:", url);
        const response = await fetch(url);
        console.log("Response status:", response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log("Data Layers Response:", data);
            console.log("Response size:", JSON.stringify(data).length, "characters");
            
            // Check specifically for flux URLs
            const hasAnnualFlux = !!data.annualFluxUrl;
            const hasMonthlyFlux = !!data.monthlyFluxUrl;
            const hasAnyFlux = Object.keys(data).some(key => key.toLowerCase().includes('flux'));
            
            console.log("Flux URL analysis:", {
                hasAnnualFlux,
                hasMonthlyFlux,
                hasAnyFlux,
                allKeys: Object.keys(data)
            });
            
            return data;
        } else {
            const errorText = await response.text();
            console.error("API Error:", response.status, errorText);
            return null;
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        return null;
    }
}

// Initialize Google Maps
function initMap() {
    // Initialize the Google Maps instance with forced 2D mode
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 27.9306, lng: -82.4497 }, // Davis Islands, Tampa, FL
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        streetViewControl: false,
        fullscreenControl: false,
        tilt: 0, // Force 2D mode
        heading: 0, // No rotation
        rotateControl: false, // Disable rotation controls
        gestureHandling: 'greedy' // Better touch handling
    });

    // Attach event listeners
    const searchButton = document.getElementById("searchButton");
    const addressInput = document.getElementById("addressInput");
    
    if (searchButton) {
        searchButton.addEventListener("click", searchAddress);
    }
    
    if (addressInput) {
        // Set up Google Places Autocomplete
        const autocomplete = new google.maps.places.Autocomplete(addressInput, {
            types: ['address'],
            componentRestrictions: { country: 'us' }, // Restrict to US addresses
            fields: ['place_id', 'geometry', 'name', 'formatted_address']
        });
        
        // When user selects an address from autocomplete
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                // Store the place data globally for use in searchAddress
                window.selectedPlace = place;
                console.log("Autocomplete place selected:", place.formatted_address);
                
                // Auto-trigger search when a place is selected
                setTimeout(() => {
                    searchAddress();
                }, 100);
            } else {
                console.warn("No geometry found for selected place");
                window.selectedPlace = null;
            }
        });
        
        addressInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                searchAddress();
            }
        });
        
        // Clear selected place when user types manually
        addressInput.addEventListener("input", function(e) {
            // Only clear if the user is typing (not selecting from autocomplete)
            if (e.inputType && e.inputType.includes('insert')) {
                window.selectedPlace = null;
            }
        });
    }

    // Display welcome message
    const insightsDetail = document.getElementById("insightsDetail");
    if (insightsDetail) {
        insightsDetail.innerHTML = `
            <div class="text-center p-4">
                <h3 class="text-lg font-semibold mb-2">Welcome to Solar Analysis</h3>
                <p class="text-gray-600">Enter an address above to analyze rooftop solar potential and view detailed insights.</p>
            </div>
        `;
    }
}

// Search Address Function
async function searchAddress() {
    const addressInput = document.getElementById("addressInput");
    const solarInfo = document.getElementById("solarInfo");
    const insightsDetail = document.getElementById("insightsDetail");
    
    if (!addressInput || !addressInput.value.trim()) {
        alert("Please enter an address");
        return;
    }

    const address = addressInput.value.trim();
    
    // Manage loading state
    if (solarInfo) {
        solarInfo.classList.add("loading");
    }
    
    // Clear previous content/overlays
    if (buildingPolygon) {
        buildingPolygon.setMap(null);
        buildingPolygon = null;
    }
    
    if (fluxOverlay) {
        fluxOverlay.setMap(null);
        fluxOverlay = null;
    }
    
    if (insightsDetail) {
        insightsDetail.innerHTML = '<div class="text-center p-4">Loading solar analysis...</div>';
    }

    try {
        let location;
        
        // Check if we have autocomplete place data stored
        if (window.selectedPlace && window.selectedPlace.geometry) {
            console.log("Using autocomplete place data");
            location = {
                lat: window.selectedPlace.geometry.location.lat(),
                lng: window.selectedPlace.geometry.location.lng()
            };
        } else {
            // Fallback to geocoding if no autocomplete data
            console.log("Geocoding address:", address);
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk`;
            const geocodeResponse = await fetch(geocodeUrl);
            const geocodeData = await geocodeResponse.json();

            if (geocodeData.status !== "OK" || !geocodeData.results.length) {
                throw new Error("Address not found");
            }

            location = geocodeData.results[0].geometry.location;
        }
        
        const latLng = { lat: location.lat, lng: location.lng };
        console.log("Using location:", latLng);

        // Set map center and zoom
        map.setCenter(latLng);
        map.setZoom(20);

        // Call Google Solar API for building insights
        const buildingInsightsUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${location.lat}&location.longitude=${location.lng}&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk`;
        const insightsResponse = await fetch(buildingInsightsUrl);
        
        if (!insightsResponse.ok) {
            throw new Error(`Solar API error: ${insightsResponse.status}`);
        }
        
        const insights = await insightsResponse.json();

        // Call Google Solar API for data layers with debug
        console.log("Testing data layers for location:", location);
        dataLayersData = await testSolarDataLayers(location.lat, location.lng);
        
        // Log the actual data structure we received
        if (dataLayersData) {
            console.log("✅ Data layers response received:");
            console.log("Response keys:", Object.keys(dataLayersData));
            console.log("Full response:", JSON.stringify(dataLayersData, null, 2));
        } else {
            console.log("❌ No data layers response received");
        }

        // Display solar insights
        displaySolarInsights(insights);

        // Draw building outline
        if (insights.solarPotential && insights.solarPotential.buildingLocation && insights.solarPotential.buildingLocation.polygon) {
            const polygon = insights.solarPotential.buildingLocation.polygon;
            const paths = polygon.map(coord => ({ lat: coord.latitude, lng: coord.longitude }));
            
            buildingPolygon = new google.maps.Polygon({
                paths: paths,
                strokeColor: "#00BFFF",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#00BFFF",
                fillOpacity: 0.25
            });
            
            buildingPolygon.setMap(map);
        } else {
            // Place a simple marker if no polygon available
            new google.maps.Marker({
                position: latLng,
                map: map,
                title: "Solar Analysis Location"
            });
        }

        // Render GeoTIFF Flux Map Overlay - Auto-display immediately
        if (dataLayersData) {
            console.log("Auto-displaying flux overlay...");
            console.log("Checking for flux data in dataLayersData:", dataLayersData);
            console.log("Full dataLayersData structure:", JSON.stringify(dataLayersData, null, 2));
            
            // Try multiple flux URL possibilities
            let fluxUrl = dataLayersData.annualFluxUrl || 
                         dataLayersData.monthlyFluxUrl || 
                         dataLayersData.fluxUrl ||
                         dataLayersData.irradianceUrl;
                         
            let bounds = dataLayersData.imageryBounds || 
                        dataLayersData.dsmBounds ||
                        dataLayersData.bounds;
            
            // If bounds is not available, create a small area around the center point
            if (!bounds) {
                console.log("No bounds in response, creating bounds around center point");
                const centerLat = location.lat;
                const centerLng = location.lng;
                const offset = 0.0005; // Smaller area, approximately 50m at the equator
                
                bounds = {
                    sw: { latitude: centerLat - offset, longitude: centerLng - offset },
                    ne: { latitude: centerLat + offset, longitude: centerLng + offset }
                };
                console.log("Created bounds:", bounds);
            }
            
            if (fluxUrl && bounds) {
                console.log("Found flux URL, auto-displaying overlay:", fluxUrl);
                console.log("Using bounds:", bounds);
                
                // Append API key to the GeoTIFF URL (required for Solar API)
                const urlWithApiKey = `${fluxUrl}&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk`;
                console.log("Final URL with API key:", urlWithApiKey);
                
                const mapBounds = new google.maps.LatLngBounds(
                    new google.maps.LatLng(bounds.sw.latitude, bounds.sw.longitude),
                    new google.maps.LatLng(bounds.ne.latitude, bounds.ne.longitude)
                );
                
                // Ensure map is in 2D mode for proper overlay rendering
                console.log("Setting map to 2D mode for overlay...");
                map.setTilt(0);
                map.setHeading(0);
                
                // Force map type to satellite or hybrid for better overlay visibility
                if (map.getMapTypeId() !== 'satellite' && map.getMapTypeId() !== 'hybrid') {
                    map.setMapTypeId('satellite');
                }
                
                // Auto-create flux overlay immediately (no delay, no fallback)
                console.log("Creating flux overlay immediately...");
                
                // Try GroundOverlay first (simpler and often works better)
                try {
                    fluxOverlay = new google.maps.GroundOverlay(
                        urlWithApiKey,
                        mapBounds,
                        {
                            opacity: 0.8,
                            clickable: false
                        }
                    );
                    fluxOverlay.setMap(map);
                    console.log("✅ Flux GroundOverlay created and displayed automatically");
                    
                    // Fit map to show the overlay bounds
                    map.fitBounds(mapBounds);
                    
                    // Show success message to user
                    if (insightsDetail) {
                        const currentContent = insightsDetail.innerHTML;
                        insightsDetail.innerHTML = currentContent + `
                            <div class="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
                                <p class="text-sm text-green-800 font-semibold mb-2">✅ Solar flux heatmap overlay active!</p>
                                <p class="text-xs text-green-700 mb-3">Colors show solar irradiance levels on your roof:</p>
                                <div class="flex items-center space-x-4 text-xs">
                                    <div class="flex items-center">
                                        <div class="w-3 h-3 rounded mr-1" style="background: rgba(100, 150, 200, 0.8);"></div>
                                        <span class="text-blue-700">Low</span>
                                    </div>
                                    <div class="flex items-center">
                                        <div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 255, 0, 0.8);"></div>
                                        <span class="text-yellow-700">Good</span>
                                    </div>
                                    <div class="flex items-center">
                                        <div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 165, 0, 0.9);"></div>
                                        <span class="text-orange-700">High</span>
                                    </div>
                                    <div class="flex items-center">
                                        <div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 0, 0, 1);"></div>
                                        <span class="text-red-700">Optimal</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                    
                } catch (groundOverlayError) {
                    console.log("GroundOverlay failed, trying custom GeoTIFF overlay:", groundOverlayError);
                    
                    try {
                        fluxOverlay = new GeoTIFFOverlay(map, urlWithApiKey, mapBounds);
                        console.log("✅ Custom GeoTIFF overlay created as fallback");
                        
                        // Show success message to user
                        if (insightsDetail) {
                            const currentContent = insightsDetail.innerHTML;
                            insightsDetail.innerHTML = currentContent + `
                                <div class="mt-4 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                                    <p class="text-sm text-blue-800 font-semibold mb-2">✅ Solar flux heatmap processing...</p>
                                    <p class="text-xs text-blue-700 mb-3">Advanced overlay loading - colors show solar irradiance:</p>
                                    <div class="flex items-center space-x-4 text-xs">
                                        <div class="flex items-center">
                                            <div class="w-3 h-3 rounded mr-1" style="background: rgba(100, 150, 200, 0.8);"></div>
                                            <span class="text-blue-700">Low</span>
                                        </div>
                                        <div class="flex items-center">
                                            <div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 255, 0, 0.8);"></div>
                                            <span class="text-yellow-700">Good</span>
                                        </div>
                                        <div class="flex items-center">
                                            <div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 165, 0, 0.9);"></div>
                                            <span class="text-orange-700">High</span>
                                        </div>
                                        <div class="flex items-center">
                                            <div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 0, 0, 1);"></div>
                                            <span class="text-red-700">Optimal</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                        
                    } catch (geoTiffError) {
                        console.error("Both overlay methods failed:", geoTiffError);
                        // Create a simulated heat map based on solar potential data
                        createSimulatedHeatMap(insights, latLng);
                    }
                }
            } else {
                console.warn("Flux URL or bounds not found in data layers response");
                console.log("Available keys in dataLayersData:", Object.keys(dataLayersData));
                console.log("FluxUrl found:", !!fluxUrl);
                console.log("Bounds found:", !!bounds);
                
                if (insightsDetail) {
                    const currentContent = insightsDetail.innerHTML;
                    insightsDetail.innerHTML = currentContent + '<div class="mt-4 p-3 bg-orange-100 border border-orange-400 rounded"><p class="text-sm text-orange-800">ℹ️ Detailed solar flux heatmap not available for this specific location. Solar potential analysis is still accurate based on building data.</p></div>';
                }
            }
        } else {
            console.warn("No data layers data available");
            if (insightsDetail) {
                const currentContent = insightsDetail.innerHTML;
                insightsDetail.innerHTML = currentContent + '<div class="mt-4 p-3 bg-gray-100 border border-gray-400 rounded"><p class="text-sm text-gray-800">ℹ️ Solar data layers API not available for this location. Analysis based on building insights only.</p></div>';
            }
        }

    } catch (error) {
        console.error("Error in searchAddress:", error);
        if (insightsDetail) {
            insightsDetail.innerHTML = `
                <div class="text-center p-4">
                    <div class="text-red-600 font-semibold">Error</div>
                    <p class="text-gray-600 mt-2">${error.message}</p>
                </div>
            `;
        }
    } finally {
        if (solarInfo) {
            solarInfo.classList.remove("loading");
        }
    }
}

// Display Solar Insights Function
function displaySolarInsights(insightsData) {
    const insightsDetail = document.getElementById("insightsDetail");
    if (!insightsDetail) return;

    insightsDetail.innerHTML = "";

    if (!insightsData.solarPotential) {
        insightsDetail.innerHTML = '<div class="text-center p-4"><p class="text-gray-600">No detailed solar potential data available for this location.</p></div>';
        return;
    }

    const solarPotential = insightsData.solarPotential;
    
    let html = `
        <div class="solar-insights p-4">
            <h3 class="text-lg font-semibold mb-4">Solar Analysis Results</h3>
            <div class="grid grid-cols-2 gap-4 mb-4">
    `;

    // Key metrics
    if (solarPotential.maxSunshineHoursPerYear) {
        html += `
            <div class="metric-card blue">
                <div class="metric-value">${Math.round(solarPotential.maxSunshineHoursPerYear).toLocaleString()}</div>
                <div class="metric-label">Max Sunshine Hours/Year</div>
            </div>
        `;
    }

    if (solarPotential.maxPofWattsPeak) {
        html += `
            <div class="metric-card green">
                <div class="metric-value">${(solarPotential.maxPofWattsPeak / 1000).toFixed(1)} kW</div>
                <div class="metric-label">Max Power Capacity</div>
            </div>
        `;
    }

    if (solarPotential.maxAnnualKwh) {
        html += `
            <div class="metric-card yellow">
                <div class="metric-value">${Math.round(solarPotential.maxAnnualKwh).toLocaleString()}</div>
                <div class="metric-label">Max Annual kWh</div>
            </div>
        `;
    }

    if (solarPotential.panelCount) {
        html += `
            <div class="metric-card purple">
                <div class="metric-value">${solarPotential.panelCount}</div>
                <div class="metric-label">Recommended Panels</div>
            </div>
        `;
    }

    html += '</div>';

    // Panel configurations
    if (solarPotential.panelConfigGroups && solarPotential.panelConfigGroups.length > 0) {
        html += `
            <div class="mt-4">
                <h4 class="font-semibold mb-3">Panel Configuration Options</h4>
                <div class="space-y-2">
        `;
        
        solarPotential.panelConfigGroups.forEach((config, index) => {
            const annualProduction = Math.round(config.yearlyKwhProduction || 0);
            const panelCount = config.panelCount || 0;
            const estimatedSavings = annualProduction * 0.12; // Rough estimate at $0.12/kWh
            
            html += `
                <div class="panel-config">
                    <div class="panel-config-header">
                        <span>Configuration ${index + 1}</span>
                        <span class="text-sm font-normal">${panelCount} panels</span>
                    </div>
                    <div class="panel-config-details">
                        <div>Annual Production: ${annualProduction.toLocaleString()} kWh</div>
                        <div>Estimated Annual Savings: $${Math.round(estimatedSavings).toLocaleString()}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
    }

    html += '</div>';
    insightsDetail.innerHTML = html;
}

// GeoTIFF Overlay Class
class GeoTIFFOverlay extends google.maps.OverlayView {
    constructor(map, geotiffUrl, bounds) {
        super();
        this.map = map;
        this.geotiffUrl = geotiffUrl;
        this.bounds_ = bounds;
        this.canvas = null;
        this.imageData = null;
        this.imageWidth = 0;
        this.imageHeight = 0;
        
        // Bind methods for correct 'this' context
        this.onAdd = this.onAdd.bind(this);
        this.draw = this.draw.bind(this);
        this.onRemove = this.onRemove.bind(this);
        this.loadGeoTIFF = this.loadGeoTIFF.bind(this);
        this.renderCanvas = this.renderCanvas.bind(this);
        
        // Ensure map is in proper state for overlays
        this.ensureMap2D();
        
        this.setMap(map);
    }
    
    ensureMap2D() {
        // Force map to 2D mode to prevent tilt-related overlay issues
        if (this.map.getTilt() !== 0) {
            console.log("Forcing map tilt to 0 for overlay compatibility");
            this.map.setTilt(0);
        }
        if (this.map.getHeading() !== 0) {
            console.log("Forcing map heading to 0 for overlay compatibility");
            this.map.setHeading(0);
        }
        
        // Add listeners to maintain 2D mode while overlay is active
        this.tiltListener = this.map.addListener('tilt_changed', () => {
            if (this.map.getTilt() !== 0) {
                console.log("Map tilt detected, resetting to 0");
                this.map.setTilt(0);
            }
        });
        
        this.headingListener = this.map.addListener('heading_changed', () => {
            if (this.map.getHeading() !== 0) {
                console.log("Map heading detected, resetting to 0");
                this.map.setHeading(0);
            }
        });
    }

    onAdd() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'none';
        
        // Append to overlay layer
        const panes = this.getPanes();
        panes.overlayLayer.appendChild(this.canvas);
        
        // Start loading GeoTIFF data
        this.loadGeoTIFF();
    }

    async loadGeoTIFF() {
        try {
            console.log("Loading GeoTIFF from URL:", this.geotiffUrl);
            
            // Test URL accessibility first
            const testResponse = await fetch(this.geotiffUrl, { method: 'HEAD' });
            console.log("URL accessibility test:", testResponse.status, testResponse.statusText);
            
            if (!testResponse.ok) {
                throw new Error(`URL not accessible: ${testResponse.status} ${testResponse.statusText}`);
            }
            
            // Use geotiff.js to load and parse the GeoTIFF
            const tiff = await GeoTIFF.fromUrl(this.geotiffUrl);
            console.log("GeoTIFF loaded successfully");
            
            const image = await tiff.getImage();
            console.log("GeoTIFF image dimensions:", image.getWidth(), "x", image.getHeight());
            
            // Read raster data
            const rasters = await image.readRasters({ interleave: false, samples: [0] });
            console.log("Raster data loaded, length:", rasters[0].length);
            
            // Store image data
            this.imageData = rasters[0];
            this.imageWidth = image.getWidth();
            this.imageHeight = image.getHeight();
            
            console.log("GeoTIFF processing complete, triggering render");
            
            // Trigger initial render
            this.draw();
        } catch (error) {
            console.error("Error loading GeoTIFF:", error);
            console.error("URL that failed:", this.geotiffUrl);
        }
    }

    renderCanvas() {
        console.log("renderCanvas called");
        if (!this.canvas || !this.imageData) {
            console.log("Missing canvas or imageData:", { 
                hasCanvas: !!this.canvas, 
                hasImageData: !!this.imageData 
            });
            return;
        }
        
        const ctx = this.canvas.getContext('2d');
        const projection = this.getProjection();
        
        if (!projection) {
            console.log("No projection available yet, will retry on next draw");
            return;
        }
        
        console.log("Starting canvas render with projection available");
        
        // Calculate canvas position and size
        const sw = projection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
        const ne = projection.fromLatLngToDivPixel(this.bounds_.getNorthEast());
        
        const width = ne.x - sw.x;
        const height = sw.y - ne.y;
        
        // Update canvas style
        this.canvas.style.left = sw.x + 'px';
        this.canvas.style.top = ne.y + 'px';
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        // Set canvas size
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Find min/max flux values for normalization
        let minVal = Infinity;
        let maxVal = -Infinity;
        let validCount = 0;
        
        for (let i = 0; i < this.imageData.length; i++) {
            const val = this.imageData[i];
            if (val > 0) {
                minVal = Math.min(minVal, val);
                maxVal = Math.max(maxVal, val);
                validCount++;
            }
        }
        
        console.log("Flux data analysis:", {
            totalPixels: this.imageData.length,
            validPixels: validCount,
            minValue: minVal,
            maxValue: maxVal
        });
        
        if (minVal === Infinity || maxVal === -Infinity) {
            console.warn("No valid flux data found");
            return;
        }
        
        // Color mapping (Project Sunroof-like gradient)
        const colorStops = [
            [0.00, [0,   0,   0,   0]],     // Fully transparent for no sun/shadow
            [0.10, [100, 150, 200, 80]],    // Light blue, low opacity (some shade)
            [0.25, [150, 200, 100, 120]],   // Light green/yellow, moderate opacity
            [0.50, [255, 255, 0,   180]],   // Bright yellow, more opaque (good sun)
            [0.75, [255, 165, 0,   220]],   // Orange, mostly opaque (very good sun)
            [1.00, [255, 0,   0,   255]]    // Full red, fully opaque (optimal sun)
        ];
        
        // Helper function to interpolate color
        function interpolateColor(normalizedValue) {
            if (normalizedValue <= 0) return [0, 0, 0, 0];
            if (normalizedValue >= 1) return colorStops[colorStops.length - 1][1];
            
            // Find the two color stops to interpolate between
            for (let i = 0; i < colorStops.length - 1; i++) {
                const [val1, color1] = colorStops[i];
                const [val2, color2] = colorStops[i + 1];
                
                if (normalizedValue >= val1 && normalizedValue <= val2) {
                    const t = (normalizedValue - val1) / (val2 - val1);
                    return [
                        Math.round(color1[0] + t * (color2[0] - color1[0])),
                        Math.round(color1[1] + t * (color2[1] - color1[1])),
                        Math.round(color1[2] + t * (color2[2] - color1[2])),
                        Math.round(color1[3] + t * (color2[3] - color1[3]))
                    ];
                }
            }
            
            return colorStops[0][1];
        }
        
        // Create image data for canvas
        const canvasImageData = ctx.createImageData(width, height);
        const data = canvasImageData.data;
        
        // Map GeoTIFF pixels to canvas pixels
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const canvasIndex = (y * width + x) * 4;
                
                // Map canvas coordinates to GeoTIFF coordinates
                const geoX = Math.floor((x / width) * this.imageWidth);
                const geoY = Math.floor((y / height) * this.imageHeight);
                const geoIndex = geoY * this.imageWidth + geoX;
                
                if (geoIndex >= 0 && geoIndex < this.imageData.length) {
                    const fluxValue = this.imageData[geoIndex];
                    
                    if (fluxValue <= 0) {
                        // Transparent for no flux
                        data[canvasIndex] = 0;     // R
                        data[canvasIndex + 1] = 0; // G
                        data[canvasIndex + 2] = 0; // B
                        data[canvasIndex + 3] = 0; // A
                    } else {
                        // Normalize and get color
                        const normalizedValue = (fluxValue - minVal) / (maxVal - minVal);
                        const [r, g, b, a] = interpolateColor(normalizedValue);
                        
                        data[canvasIndex] = r;     // R
                        data[canvasIndex + 1] = g; // G
                        data[canvasIndex + 2] = b; // B
                        data[canvasIndex + 3] = a; // A
                    }
                } else {
                    // Transparent for out of bounds
                    data[canvasIndex] = 0;
                    data[canvasIndex + 1] = 0;
                    data[canvasIndex + 2] = 0;
                    data[canvasIndex + 3] = 0;
                }
            }
        }
        
        // Draw the image data to canvas
        ctx.putImageData(canvasImageData, 0, 0);
        console.log("Canvas image data drawn successfully");
        console.log("Canvas size:", this.canvas.width, "x", this.canvas.height);
        console.log("Canvas position:", this.canvas.style.left, this.canvas.style.top);
    }

    draw() {
        this.renderCanvas();
    }

    onRemove() {
        if (this.canvas) {
            this.canvas.parentNode.removeChild(this.canvas);
            this.canvas = null;
        }
        this.imageData = null;
        
        // Clean up map listeners
        if (this.tiltListener) {
            google.maps.event.removeListener(this.tiltListener);
            this.tiltListener = null;
        }
        if (this.headingListener) {
            google.maps.event.removeListener(this.headingListener);
            this.headingListener = null;
        }
        
        console.log("Overlay removed and listeners cleaned up");
    }
}

// Simulated heat map function for when flux data isn't available
function createSimulatedHeatMap(insights, location) {
    console.log("Creating simulated heat map based on solar potential data");
    
    if (!insights.solarPotential || !insights.solarPotential.buildingLocation) {
        console.log("No building location data for simulated heat map");
        return;
    }
    
    try {
        const buildingLocation = insights.solarPotential.buildingLocation;
        const solarPotential = insights.solarPotential;
        
        // Create a heat map based on solar potential
        if (buildingLocation.polygon && buildingLocation.polygon.length > 0) {
            const polygon = buildingLocation.polygon;
            const paths = polygon.map(coord => ({ lat: coord.latitude, lng: coord.longitude }));
            
            // Calculate solar intensity color based on potential
            let intensity = 0.5; // Default moderate
            
            if (solarPotential.maxSunshineHoursPerYear) {
                // Normalize sunshine hours (0-4000 typical range)
                intensity = Math.min(solarPotential.maxSunshineHoursPerYear / 3000, 1);
            }
            
            // Create color based on intensity
            let fillColor = '#FFFF00'; // Yellow default
            if (intensity > 0.8) fillColor = '#FF4500'; // Red-orange for high
            else if (intensity > 0.6) fillColor = '#FF8C00'; // Orange for good
            else if (intensity > 0.4) fillColor = '#FFD700'; // Gold for moderate
            else fillColor = '#87CEEB'; // Light blue for low
            
            // Remove existing flux overlay if any
            if (fluxOverlay) {
                fluxOverlay.setMap(null);
                fluxOverlay = null;
            }
            
            // Create simulated heat map as a colored polygon
            fluxOverlay = new google.maps.Polygon({
                paths: paths,
                strokeColor: fillColor,
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: fillColor,
                fillOpacity: 0.4
            });
            
            fluxOverlay.setMap(map);
            
            console.log("✅ Simulated heat map created with intensity:", intensity);
            
            // Show simulated heat map message
            const insightsDetail = document.getElementById("insightsDetail");
            if (insightsDetail) {
                const currentContent = insightsDetail.innerHTML;
                insightsDetail.innerHTML = currentContent + `
                    <div class="mt-4 p-4 bg-purple-50 border border-purple-300 rounded-lg">
                        <p class="text-sm text-purple-800 font-semibold mb-2">🎨 Simulated solar heat map active!</p>
                        <p class="text-xs text-purple-700 mb-3">Based on your roof's solar potential (${Math.round(intensity * 100)}% efficiency):</p>
                        <div class="flex items-center space-x-4 text-xs">
                            <div class="flex items-center">
                                <div class="w-3 h-3 rounded mr-1" style="background: #87CEEB;"></div>
                                <span class="text-blue-700">Low</span>
                            </div>
                            <div class="flex items-center">
                                <div class="w-3 h-3 rounded mr-1" style="background: #FFD700;"></div>
                                <span class="text-yellow-700">Good</span>
                            </div>
                            <div class="flex items-center">
                                <div class="w-3 h-3 rounded mr-1" style="background: #FF8C00;"></div>
                                <span class="text-orange-700">High</span>
                            </div>
                            <div class="flex items-center">
                                <div class="w-3 h-3 rounded mr-1" style="background: #FF4500;"></div>
                                <span class="text-red-700">Optimal</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error("Error creating simulated heat map:", error);
    }
}

// Make initMap available globally for Google Maps callback
window.initMap = initMap;
