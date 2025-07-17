// api/geotiff-proxy.js
// Vercel serverless function to proxy GeoTIFF requests and bypass CORS

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.query;

    // Validate that a URL was provided
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate that it's a Google Solar API URL (security)
    if (!url.includes('solar.googleapis.com')) {
        return res.status(400).json({ error: 'Only Google Solar API URLs are allowed' });
    }

    try {
        console.log('Proxying GeoTIFF request to:', url);

        // Fetch the GeoTIFF from Google's API
        const response = await fetch(url);

        if (!response.ok) {
            console.error('GeoTIFF fetch failed:', response.status, response.statusText);
            return res.status(response.status).json({ 
                error: `Failed to fetch GeoTIFF: ${response.statusText}` 
            });
        }

        // Get the image data as a buffer
        const buffer = await response.arrayBuffer();
        
        console.log('GeoTIFF fetched successfully, size:', buffer.byteLength, 'bytes');

        // Set CORS headers to allow browser access
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Set content type for GeoTIFF
        res.setHeader('Content-Type', 'image/tiff');
        res.setHeader('Content-Length', buffer.byteLength);
        
        // Optional: Add caching headers
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        
        // Send the GeoTIFF data
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ 
            error: 'Failed to proxy GeoTIFF request',
            details: error.message 
        });
    }
}