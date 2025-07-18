// api/geotiff-proxy.js
// Enhanced Vercel serverless function for GeoTIFF proxy with better error handling

export default async function handler(req, res) {
    // Enable CORS for all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET requests for actual proxy
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.query;

    // Validate that a URL was provided
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Enhanced validation for Google Solar API URLs
    const allowedDomains = [
        'solar.googleapis.com',
        'earthengine.googleapis.com',
        'storage.googleapis.com'
    ];
    
    const isValidUrl = allowedDomains.some(domain => url.includes(domain));
    
    if (!isValidUrl) {
        console.error('Invalid URL attempted:', url);
        return res.status(400).json({ 
            error: 'Only Google Solar API URLs are allowed',
            attempted: url.substring(0, 100) + '...'
        });
    }

    try {
        console.log('Proxying GeoTIFF request to:', url.substring(0, 100) + '...');

        // Enhanced fetch with timeout and headers
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Vercel-Proxy/1.0',
                'Accept': 'image/tiff,image/*,*/*'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error('GeoTIFF fetch failed:', response.status, response.statusText);
            
            // Try to get error details
            let errorDetails = '';
            try {
                const errorText = await response.text();
                errorDetails = errorText.substring(0, 200);
            } catch (e) {
                errorDetails = 'Could not read error response';
            }
            
            return res.status(response.status).json({ 
                error: `Failed to fetch GeoTIFF: ${response.statusText}`,
                details: errorDetails,
                status: response.status
            });
        }

        // Get content type and length
        const contentType = response.headers.get('content-type') || 'image/tiff';
        const contentLength = response.headers.get('content-length');
        
        console.log('Content-Type:', contentType);
        console.log('Content-Length:', contentLength);

        // Stream the response for better memory usage
        if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB limit
            return res.status(413).json({ 
                error: 'File too large', 
                size: contentLength 
            });
        }

        // Get the image data as array buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log('GeoTIFF fetched successfully, size:', buffer.byteLength, 'bytes');

        // Validate it's actually image data
        if (buffer.byteLength < 100) {
            return res.status(422).json({ 
                error: 'Response too small to be valid GeoTIFF',
                size: buffer.byteLength 
            });
        }

        // Set comprehensive headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', buffer.byteLength);
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200'); // Cache for 1-2 hours
        res.setHeader('Content-Disposition', 'inline; filename="solar-flux.tiff"');
        
        // Optional: Add ETag for better caching
        const crypto = require('crypto');
        const etag = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 16);
        res.setHeader('ETag', `"${etag}"`);
        
        // Send the GeoTIFF data
        return res.send(buffer);

    } catch (error) {
        console.error('Proxy error:', error);
        
        // Handle specific error types
        if (error.name === 'AbortError') {
            return res.status(408).json({ 
                error: 'Request timeout - GeoTIFF fetch took too long',
                timeout: '30 seconds'
            });
        }
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({ 
                error: 'Unable to connect to Google Solar API',
                details: error.message 
            });
        }
        
        return res.status(500).json({ 
            error: 'Failed to proxy GeoTIFF request',
            details: error.message,
            type: error.name || 'Unknown'
        });
    }
}