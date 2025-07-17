// Complete Solar Maps with Vercel Proxy Integration
// Replace your entire solar_maps.js file with this version

let map;
let buildingPolygon;
let fluxOverlay;

// UPDATE THIS TO YOUR ACTUAL VERCEL DEPLOYMENT URL
const PROXY_BASE_URL = 'https://your-app-name.vercel.app'; // CHANGE THIS!

function initMap() {
    console.log("Initializing Google Maps...");
    
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 27.9306, lng: -82.4497 },
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        streetViewControl: false,
        fullscreenControl: false,
        tilt: 0,
        heading: 0,
        rotateControl: false,
        gestureHandling: 'greedy'
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

async function testSolarDataLayers(lat, lng) {
    console.log('Testing Solar Data Layers with corrected parameters...');
    console.log('Location: ' + lat + ', ' + lng);
    
    const configs = [
        { view: 'IMAGERY_AND_ANNUAL_FLUX_LAYERS', radiusMeters: 100 },
        { view: 'ANNUAL_FLUX_LAYER', radiusMeters: 100 },
        { view: 'FULL_LAYERS', radiusMeters: 100 },
        { view: 'IMAGERY_AND_ANNUAL_FLUX_LAYERS', radiusMeters: 50 },
        { view: 'IMAGERY_AND_ANNUAL_FLUX_LAYERS', radiusMeters: 200 },
        { view: 'IMAGERY_AND_ANNUAL_FLUX_LAYERS', radiusMeters: 100, experiments: 'EXPANDED_COVERAGE' }
    ];
    
    for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        
        try {
            console.log('Attempt ' + (i + 1) + ': Testing ' + config.view + ' with ' + config.radiusMeters + 'm radius');
            
            let url = 'https://solar.googleapis.com/v1/dataLayers:get?location.latitude=' + lat + '&location.longitude=' + lng + '&radiusMeters=' + config.radiusMeters + '&view=' + config.view + '&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk';
            
            if (config.experiments) {
                url += '&experiments=' + config.experiments;
                console.log('Using experimental expanded coverage...');
            }
            
            console.log('Request URL:', url);
            
            const response = await fetch(url);
            console.log('Response status: ' + response.status + ' ' + response.statusText);
            
            if (response.ok) {
                const data = await response.json();
                const keys = Object.keys(data);
                console.log('Success! Response keys: ' + keys.join(', '));
                
                const fluxUrl = data.annualFluxUrl || data.monthlyFluxUrl || data.fluxUrl || data.irradianceUrl;
                
                if (fluxUrl) {
                    console.log('FLUX DATA FOUND with ' + config.view + '!');
                    console.log('Flux URL:', fluxUrl);
                    
                    const bounds = data.imageryBounds || data.dsmBounds || data.bounds;
                    
                    if (bounds) {
                        console.log('Bounds found:', bounds);
                    } else {
                        console.log('No bounds, but flux URL available');
                    }
                    
                    console.log('SUCCESS: Returning flux data');
                    return data;
                } else {
                    console.log('No flux data in ' + config.view);
                    console.log('Available fields: ' + keys.join(', '));
                }
            } else {
                const errorText = await response.text();
                console.log(config.view + ' failed: ' + response.status + ' - ' + errorText.substring(0, 200) + '...');
            }
            
        } catch (error) {
            console.log('Error with ' + config.view + ': ' + error.message);
        }
        
        await new Promise(function(resolve) {
            setTimeout(resolve, 500);
        });
    }
    
    console.log('No flux data found in any configuration');
    return null;
}

function createSimulatedFluxOverlay(solarPotential, location, bounds) {
    console.log("Creating simulated flux overlay as fallback...");
    
    try {
        let intensity = 0.5;
        
        if (solarPotential.maxSunshineHoursPerYear) {
            intensity = Math.min(solarPotential.maxSunshineHoursPerYear / 2500, 1);
            console.log('Calculated intensity based on sunshine hours:', intensity);
        }
        
        let fillColor = '#FFD700';
        let strokeColor = '#FFA500';
        
        if (intensity > 0.8) {
            fillColor = '#FF4500';
            strokeColor = '#FF0000';
        } else if (intensity > 0.6) {
            fillColor = '#FF8C00';
            strokeColor = '#FF4500';
        } else if (intensity > 0.4) {
            fillColor = '#FFD700';
            strokeColor = '#FFA500';
        } else {
            fillColor = '#87CEEB';
            strokeColor = '#4169E1';
        }
        
        if (solarPotential.buildingLocation && solarPotential.buildingLocation.polygon) {
            console.log("Using building polygon for simulated overlay");
            const polygon = solarPotential.buildingLocation.polygon;
            const paths = polygon.map(function(coord) {
                return { lat: coord.latitude, lng: coord.longitude };
            });
            
            fluxOverlay = new google.maps.Polygon({
                paths: paths,
                strokeColor: strokeColor,
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: fillColor,
                fillOpacity: 0.4
            });
        } else {
            console.log("Using rectangular area for simulated overlay");
            const mapBounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(bounds.sw.latitude, bounds.sw.longitude),
                new google.maps.LatLng(bounds.ne.latitude, bounds.ne.longitude)
            );
            
            fluxOverlay = new google.maps.Rectangle({
                bounds: mapBounds,
                strokeColor: strokeColor,
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: fillColor,
                fillOpacity: 0.4
            });
        }
        
        fluxOverlay.setMap(map);
        console.log("✅ Simulated flux overlay created successfully!");
        return true;
        
    } catch (error) {
        console.error("❌ Failed to create simulated overlay:", error);
        return false;
    }
}

async function searchAddress() {
    const addressInput = document.getElementById("addressInput");
    const solarInfo = document.getElementById("solarInfo");
    const insightsDetail = document.getElementById("insightsDetail");
    
    if (!addressInput || !addressInput.value.trim()) {
        alert("Please enter an address");
        return;
    }

    const address = addressInput.value.trim();
    console.log('Starting analysis for: ' + address);
    
    if (solarInfo) {
        solarInfo.classList.add("loading");
    }
    
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
        
        if (window.selectedPlace && window.selectedPlace.geometry) {
            console.log("Using autocomplete place data");
            location = {
                lat: window.selectedPlace.geometry.location.lat(),
                lng: window.selectedPlace.geometry.location.lng()
            };
        } else {
            console.log("Geocoding address:", address);
            const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(address) + '&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk';
            const geocodeResponse = await fetch(geocodeUrl);
            const geocodeData = await geocodeResponse.json();

            if (geocodeData.status !== "OK" || !geocodeData.results.length) {
                throw new Error("Address not found");
            }

            location = geocodeData.results[0].geometry.location;
        }
        
        const latLng = { lat: location.lat, lng: location.lng };
        console.log("Using location:", latLng);

        map.setCenter(latLng);
        map.setZoom(20);
        map.setTilt(0);
        map.setHeading(0);

        console.log("Fetching building insights...");
        const buildingInsightsUrl = 'https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=' + location.lat + '&location.longitude=' + location.lng + '&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk';
        const insightsResponse = await fetch(buildingInsightsUrl);
        
        if (!insightsResponse.ok) {
            throw new Error('Solar API error: ' + insightsResponse.status);
        }
        
        const insights = await insightsResponse.json();
        console.log("Building insights received");

        console.log("Fetching data layers...");
        const dataLayersData = await testSolarDataLayers(location.lat, location.lng);

        displaySolarInsights(insights);

        if (insights.solarPotential && insights.solarPotential.buildingLocation && insights.solarPotential.buildingLocation.polygon) {
            const polygon = insights.solarPotential.buildingLocation.polygon;
            const paths = polygon.map(function(coord) {
                return { lat: coord.latitude, lng: coord.longitude };
            });
            
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
            new google.maps.Marker({
                position: latLng,
                map: map,
                title: "Solar Analysis Location"
            });
        }

        // VERCEL PROXY INTEGRATION: Handle flux overlay with proxy
        if (dataLayersData) {
            console.log("Processing flux overlay with Vercel proxy...");
            console.log("Full dataLayersData structure:", JSON.stringify(dataLayersData, null, 2));
            
            let fluxUrl = dataLayersData.annualFluxUrl || dataLayersData.monthlyFluxUrl || dataLayersData.fluxUrl || dataLayersData.irradianceUrl;
            let bounds = dataLayersData.imageryBounds || dataLayersData.dsmBounds || dataLayersData.bounds;
            
            if (fluxUrl) {
                console.log("Flux URL found:", fluxUrl);
                
                if (!bounds) {
                    console.log("Creating default bounds around location");
                    const offset = 0.0005;
                    bounds = {
                        sw: { latitude: location.lat - offset, longitude: location.lng - offset },
                        ne: { latitude: location.lat + offset, longitude: location.lng + offset }
                    };
                }
                
                try {
                    console.log("Setting map to 2D mode for overlay...");
                    map.setTilt(0);
                    map.setHeading(0);
                    
                    // Use Vercel proxy instead of direct URL
                    const fluxUrlWithKey = fluxUrl + '&key=AIzaSyBzcUXYvRZVWAMasN93T9radVmiZVnaflk';
                    const proxiedUrl = PROXY_BASE_URL + '/api/geotiff-proxy?url=' + encodeURIComponent(fluxUrlWithKey);
                    
                    console.log("Using proxied URL:", proxiedUrl);
                    
                    // Test proxy accessibility
                    try {
                        const urlTest = await fetch(proxiedUrl, { method: 'HEAD' });
                        console.log('Proxy URL accessibility test: ' + urlTest.status + ' ' + urlTest.statusText);
                        
                        if (!urlTest.ok) {
                            throw new Error('Proxy not accessible: ' + urlTest.status);
                        }
                    } catch (e) {
                        console.log("Proxy URL test failed:", e.message);
                        throw new Error('Proxy failed: ' + e.message);
                    }
                    
                    const mapBounds = new google.maps.LatLngBounds(
                        new google.maps.LatLng(bounds.sw.latitude, bounds.sw.longitude),
                        new google.maps.LatLng(bounds.ne.latitude, bounds.ne.longitude)
                    );
                    
                    // Create GroundOverlay with proxied URL
                    fluxOverlay = new google.maps.GroundOverlay(
                        proxiedUrl,
                        mapBounds,
                        {
                            opacity: 0.7,
                            clickable: false
                        }
                    );
                    
                    fluxOverlay.setMap(map);
                    map.fitBounds(mapBounds);
                    
                    console.log("✅ SUCCESS: Real flux overlay created with Vercel proxy!");
                    
                    if (insightsDetail) {
                        const currentContent = insightsDetail.innerHTML;
                        insightsDetail.innerHTML = currentContent + '<div class="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg"><p class="text-sm text-green-800 font-semibold mb-2">✅ Solar flux heatmap active!</p><p class="text-xs text-green-700 mb-3">Real Google Solar API heatmap showing detailed irradiance:</p><div class="flex items-center space-x-4 text-xs"><div class="flex items-center"><div class="w-3 h-3 rounded mr-1" style="background: rgba(100, 150, 200, 0.8);"></div><span class="text-blue-700">Low</span></div><div class="flex items-center"><div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 255, 0, 0.8);"></div><span class="text-yellow-700">Good</span></div><div class="flex items-center"><div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 165, 0, 0.9);"></div><span class="text-orange-700">High</span></div><div class="flex items-center"><div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 0, 0, 1);"></div><span class="text-red-700">Optimal</span></div></div></div>';
                    }
                    
                } catch (overlayError) {
                    console.error("❌ Real overlay creation failed:", overlayError);
                    
                    // Fallback to simulated overlay if proxy fails
                    console.log("Falling back to simulated overlay...");
                    
                    if (insights.solarPotential) {
                        const overlayCreated = createSimulatedFluxOverlay(insights.solarPotential, location, bounds);
                        
                        if (overlayCreated && insightsDetail) {
                            const currentContent = insightsDetail.innerHTML;
                            insightsDetail.innerHTML = currentContent + '<div class="mt-4 p-4 bg-blue-50 border border-blue-300 rounded-lg"><p class="text-sm text-blue-800 font-semibold mb-2">✅ Solar flux simulation active!</p><p class="text-xs text-blue-700 mb-3">Simulated overlay based on your solar potential data:</p><div class="flex items-center space-x-4 text-xs"><div class="flex items-center"><div class="w-3 h-3 rounded mr-1" style="background: rgba(135, 206, 235, 0.8);"></div><span class="text-blue-700">Low</span></div><div class="flex items-center"><div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 215, 0, 0.8);"></div><span class="text-yellow-700">Good</span></div><div class="flex items-center"><div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 140, 0, 0.9);"></div><span class="text-orange-700">High</span></div><div class="flex items-center"><div class="w-3 h-3 rounded mr-1" style="background: rgba(255, 69, 0, 1);"></div><span class="text-red-700">Optimal</span></div></div><p class="text-xs text-gray-600 mt-2"><em>Proxy unavailable - using simulated data</em></p></div>';
                        }
                    } else {
                        if (insightsDetail) {
                            const currentContent = insightsDetail.innerHTML;
                            insightsDetail.innerHTML = currentContent + '<div class="mt-4 p-3 bg-red-100 border border-red-400 rounded"><p class="text-sm text-red-800">⚠️ Flux overlay creation failed. Proxy may not be deployed yet.</p></div>';
                        }
                    }
                }
                
            } else {
                console.log("No flux URL found in response");
                console.log("Available response fields:", Object.keys(dataLayersData));
                
                if (insightsDetail) {
                    const currentContent = insightsDetail.innerHTML;
                    insightsDetail.innerHTML = currentContent + '<div class="mt-4 p-3 bg-orange-100 border border-orange-400 rounded"><p class="text-sm text-orange-800">ℹ️ Solar analysis complete, but detailed flux heatmap not available for this location.</p></div>';
                }
            }
        } else {
            console.log("No data layers received from API");
            
            if (insightsDetail) {
                const currentContent = insightsDetail.innerHTML;
                insightsDetail.innerHTML = currentContent + '<div class="mt-4 p-3 bg-gray-100 border border-gray-400 rounded"><p class="text-sm text-gray-800">ℹ️ Solar potential analysis available. Detailed flux maps not available for this location.</p></div>';
            }
        }

    } catch (error) {
        console.error("Error in searchAddress:", error);
        if (insightsDetail) {
            insightsDetail.innerHTML = '<div class="text-center p-4"><div class="text-red-600 font-semibold">Error</div><p class="text-gray-600 mt-2">' + error.message + '</p></div>';
        }
    } finally {
        if (solarInfo) {
            solarInfo.classList.remove("loading");
        }
    }
}

function displaySolarInsights(insightsData) {
    const insightsDetail = document.getElementById("insightsDetail");
    if (!insightsDetail) return;

    insightsDetail.innerHTML = "";

    if (!insightsData.solarPotential) {
        insightsDetail.innerHTML = '<div class="text-center p-4"><p class="text-gray-600">No detailed solar potential data available for this location.</p></div>';
        return;
    }

    const solarPotential = insightsData.solarPotential;
    
    let html = '<div class="solar-insights p-4"><h3 class="text-lg font-semibold mb-4">Solar Analysis Results</h3><div class="grid grid-cols-2 gap-4 mb-4">';

    if (solarPotential.maxSunshineHoursPerYear) {
        html += '<div class="metric-card blue"><div class="metric-value">' + Math.round(solarPotential.maxSunshineHoursPerYear).toLocaleString() + '</div><div class="metric-label">Max Sunshine Hours/Year</div></div>';
    }

    if (solarPotential.maxPofWattsPeak) {
        html += '<div class="metric-card green"><div class="metric-value">' + (solarPotential.maxPofWattsPeak / 1000).toFixed(1) + ' kW</div><div class="metric-label">Max Power Capacity</div></div>';
    }

    if (solarPotential.maxAnnualKwh) {
        html += '<div class="metric-card yellow"><div class="metric-value">' + Math.round(solarPotential.maxAnnualKwh).toLocaleString() + '</div><div class="metric-label">Max Annual kWh</div></div>';
    }

    if (solarPotential.panelCount) {
        html += '<div class="metric-card purple"><div class="metric-value">' + solarPotential.panelCount + '</div><div class="metric-label">Recommended Panels</div></div>';
    }

    html += '</div>';

    if (solarPotential.panelConfigGroups && solarPotential.panelConfigGroups.length > 0) {
        html += '<div class="mt-4"><h4 class="font-semibold mb-3">Panel Configuration Options</h4><div class="space-y-2">';
        
        solarPotential.panelConfigGroups.forEach(function(config, index) {
            const annualProduction = Math.round(config.yearlyKwhProduction || 0);
            const panelCount = config.panelCount || 0;
            const estimatedSavings = annualProduction * 0.12;
            
            html += '<div class="panel-config"><div class="panel-config-header"><span>Configuration ' + (index + 1) + '</span><span class="text-sm font-normal">' + panelCount + ' panels</span></div><div class="panel-config-details"><div>Annual Production: ' + annualProduction.toLocaleString() + ' kWh</div><div>Estimated Annual Savings: $' + Math.round(estimatedSavings).toLocaleString() + '</div></div></div>';
        });
        
        html += '</div></div>';
    }

    html += '</div>';
    insightsDetail.innerHTML = html;
}

window.initMap = initMap;