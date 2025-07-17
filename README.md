# Google Maps Solar Analysis Integration

This project integrates Google Maps, Google Solar API, and geotiff.js to display rooftop solar potential with visual heatmap overlays.

## Features

- **Interactive Google Maps**: Satellite view with building outlines
- **Solar Potential Analysis**: Real-time solar data from Google Solar API
- **GeoTIFF Heatmap Overlays**: Visual representation of solar flux data
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

1. **Google Cloud Platform Account** with the following APIs enabled:
   - Maps JavaScript API
   - Geocoding API 
   - Solar API

2. **API Key Configuration**: Replace `YOUR_API_KEY` in the following files:
   - `solar_maps.js` (3 locations in the fetch URLs)
   - `index.html` (in the Google Maps script tag)

## File Structure

```
/
├── index.html                # Main HTML file with complete UI
├── test_solar.html          # Simple test page for debugging
├── solar_maps.js            # Core Google Maps + Solar API integration
├── solar_maps_advanced.js   # Enhanced version with advanced features
├── styles.css               # CSS styles including loading states
├── animation.js             # Existing animation and UI logic
├── setup.sh                 # Installation and setup script
└── README.md               # This documentation file
```

## Implementation Options

### 1. Basic Implementation (`solar_maps.js`)
- Core functionality for Google Maps + Solar API integration
- GeoTIFF heatmap overlays with Project Sunroof-like colors
- Basic error handling and user feedback
- Clean, minimal codebase

### 2. Advanced Implementation (`solar_maps_advanced.js`)
- Enhanced error handling with retry logic
- Financial calculations (costs, savings, payback period)
- Environmental impact calculations
- Google Places Autocomplete integration
- State management and caching
- Advanced UI features (notifications, loading states)
- Better user experience with detailed feedback

### 3. Test Implementation (`test_solar.html`)
- Standalone test page for debugging
- Minimal HTML structure
- Easy to test API functionality
- Perfect for development and troubleshooting

## HTML Elements Required

The implementation expects these specific HTML elements:

```html
<!-- Address input field -->
<input type="text" id="addressInput" placeholder="Enter address..." />

<!-- Search trigger button -->
<button id="searchButton">Analyze Solar Potential</button>

<!-- Google Map container -->
<div id="map"></div>

<!-- Solar information display -->
<div id="solarInfo">
  <div id="insightsDetail"></div>
</div>
```

## JavaScript Functions

### Core Functions

1. **`initMap()`** - Google Maps callback function
   - Initializes the map with Davis Islands, Tampa, FL as default center
   - Sets up event listeners for address search
   - Displays welcome message

2. **`searchAddress()`** - Main analysis function
   - Geocodes the entered address
   - Calls Google Solar API for building insights
   - Calls Google Solar API for GeoTIFF data layers
   - Displays results and renders heatmap overlay

3. **`displaySolarInsights(insightsData)`** - Results display
   - Shows key solar metrics (sunshine hours, max power, annual kWh, panel count)
   - Lists panel configuration options
   - Formats data in responsive grid layout

### GeoTIFF Overlay Class

The `GeoTIFFOverlay` class extends `google.maps.OverlayView` to render solar flux heatmaps:

- **Constructor**: Takes map, GeoTIFF URL, and geographic bounds
- **loadGeoTIFF()**: Fetches and parses GeoTIFF data using geotiff.js
- **renderCanvas()**: Converts flux data to visual heatmap with Project Sunroof-like colors
- **Color Mapping**: 6-stop gradient from transparent (no sun) to red (optimal sun)

## Color Scheme

The heatmap uses this color progression:
- **Transparent**: No sun/shadow areas
- **Light Blue**: Some shade (low solar potential)
- **Green/Yellow**: Moderate solar potential  
- **Bright Yellow**: Good solar potential
- **Orange**: Very good solar potential
- **Red**: Optimal solar potential

## API Integration

### Google Solar API Endpoints

1. **Building Insights**: `https://solar.googleapis.com/v1/buildingInsights:findClosest`
   - Returns solar potential data for the closest building
   - Includes panel configurations and energy production estimates

2. **Data Layers**: `https://solar.googleapis.com/v1/dataLayers:get`
   - Returns URLs for GeoTIFF flux maps and DSM bounds
   - Used for heatmap overlay visualization

### Error Handling

- Comprehensive try/catch blocks for all API calls
- User-friendly error messages for common issues:
  - Address not found
  - Solar data not available
  - API rate limits or errors
  - GeoTIFF loading failures

## Setup Instructions

1. **Enable APIs** in Google Cloud Console:
   ```
   Maps JavaScript API
   Geocoding API
   Solar API
   ```

2. **Get API Key** with permissions for above APIs

3. **Replace API Keys** in code:
   ```javascript
   // In solar_maps.js (3 locations)
   const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`;
   
   const buildingInsightsUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${location.lat}&location.longitude=${location.lng}&key=YOUR_API_KEY`;
   
   const dataLayersUrl = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${location.lat}&location.longitude=${location.lng}&radiusMeters=15&view=FULL_LAYERS&key=YOUR_API_KEY`;
   ```

   ```html
   <!-- In index.html -->
   <script async defer 
     src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places,geometry&callback=initMap">
   </script>
   ```

4. **Test the Implementation**:
   - Open `index.html` in a web browser
   - Enter a valid address (works best with US addresses)
   - Click "Analyze Solar Potential"
   - View the interactive map with solar data overlay

## Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Make setup script executable and run it
chmod +x setup.sh
./setup.sh
```

The setup script will guide you through:
- API key configuration
- Prerequisites checking
- API validation
- Local server startup

### Option 2: Manual Setup
1. **Get Google Cloud API Key** with these APIs enabled:
   - Maps JavaScript API
   - Geocoding API  
   - Solar API

2. **Replace API keys** in the following files:
   ```bash
   # Replace YOUR_API_KEY with your actual API key
   sed -i 's/YOUR_API_KEY/your_actual_api_key_here/g' solar_maps.js
   sed -i 's/YOUR_API_KEY/your_actual_api_key_here/g' index.html
   sed -i 's/YOUR_API_KEY/your_actual_api_key_here/g' test_solar.html
   ```

3. **Start a local server**:
   ```bash
   # Python 3
   python3 -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (with npx)
   npx http-server -p 8000
   ```

4. **Open in browser**: http://localhost:8000

### Option 3: Choose Your Implementation
- **Basic**: Use `solar_maps.js` with `index.html`
- **Advanced**: Replace `solar_maps.js` with `solar_maps_advanced.js` in your HTML
- **Testing**: Use `test_solar.html` for development

## Dependencies

- **Google Maps JavaScript API**: Map rendering and geocoding
- **geotiff.js v2.0.7**: GeoTIFF parsing and processing
- **Tailwind CSS**: UI styling (already included)

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance Notes

- GeoTIFF files can be large (1-5MB), loading may take a few seconds
- Canvas rendering is optimized for real-time map interaction
- API rate limits may apply based on your Google Cloud usage tier

## Troubleshooting

### Common Issues

1. **Map not loading**: Check API key permissions and quotas
2. **No solar data**: Solar API coverage limited to certain regions
3. **Heatmap not displaying**: GeoTIFF data may not be available for all locations
4. **CORS errors**: Ensure API key has proper domain restrictions

### Debug Mode

Add this to browser console for additional logging:
```javascript
// Enable debug logging
console.log("Solar API Response:", insights);
console.log("Data Layers Response:", dataLayersData);
```

## Future Enhancements

- Add drawing tools for custom roof selection
- Implement solar panel cost calculations
- Add 3D building visualization
- Include weather data integration
- Export analysis reports as PDF
# leadfunnel
