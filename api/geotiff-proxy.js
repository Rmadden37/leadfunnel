// api/geotiff-proxy.js
// Enhanced Vercel serverless function for GeoTIFF proxy with better error handling

module.exports = async function handler(req, res) {
    // Enable CORS for all origins with more permissive headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Range');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Allow GET and HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return res.status(405).json({ 
            error: 'Method not allowed - only GET and HEAD are supported',
            allowedMethods: ['GET', 'HEAD', 'OPTIONS']
        });
    }

    const { url } = req.query;

    // Validate that a URL was provided
    if (!url) {
        return res.status(400).json({ 
            error: 'URL parameter is required',
            usage: 'Add ?url=YOUR_GEOTIFF_URL to the request'
        });
    }

    // Enhanced validation for Google Solar API URLs
    const allowedDomains = [
        'solar.googleapis.com',
        'earthengine.googleapis.com',
        'storage.googleapis.com',
        'storage.cloud.google.com'
    ];
    
    const isValidUrl = allowedDomains.some(domain => url.includes(domain));
    
    if (!isValidUrl) {
        console.error('❌ Invalid URL attempted:', url.substring(0, 100));
        return res.status(400).json({ 
            error: 'Only Google Solar API URLs are allowed',
            allowedDomains: allowedDomains,
            attempted: url.substring(0, 100) + '...'
        });
    }

    try {
        console.log('🔄 Proxying GeoTIFF request to:', url.substring(0, 100) + '...');
        console.log('📊 Request method:', req.method);

        // Enhanced fetch with timeout and better headers
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const fetchOptions = {
            method: req.method,
            signal: controller.signal,
            headers: {
                'User-Agent': 'Vercel-Solar-Proxy/1.0',
                'Accept': 'image/tiff,image/*,application/octet-stream,*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache'
            }
        };

        // Add Range header if present in original request
        if (req.headers.range) {
            fetchOptions.headers['Range'] = req.headers.range;
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        console.log('📡 Response status:', response.status, response.statusText);
        console.log('📋 Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

        if (!response.ok) {
            console.error('❌ GeoTIFF fetch failed:', response.status, response.statusText);
            
            // Try to get error details
            let errorDetails = '';
            try {
                const errorText = await response.text();
                errorDetails = errorText.substring(0, 500);
                console.error('Error details:', errorDetails);
            } catch (e) {
                errorDetails = 'Could not read error response';
            }
            
            return res.status(response.status).json({ 
                error: `Failed to fetch GeoTIFF: ${response.status} ${response.statusText}`,
                details: errorDetails,
                originalStatus: response.status,
                url: url.substring(0, 100) + '...'
            });
        }

        // Get response headers
        const contentType = response.headers.get('content-type') || 'image/tiff';
        const contentLength = response.headers.get('content-length');
        const acceptRanges = response.headers.get('accept-ranges');
        const contentRange = response.headers.get('content-range');
        
        console.log('📝 Content details:');
        console.log('  Type:', contentType);
        console.log('  Length:', contentLength);
        console.log('  Accept-Ranges:', acceptRanges);
        console.log('  Content-Range:', contentRange);

        // Check file size limits (50MB for safety)
        if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
            return res.status(413).json({ 
                error: 'File too large for proxy', 
                size: contentLength,
                maxSize: '50MB'
            });
        }

        // Set response headers
        res.setHeader('Content-Type', contentType);
        if (contentLength) {
            res.setHeader('Content-Length', contentLength);
        }
        if (acceptRanges) {
            res.setHeader('Accept-Ranges', acceptRanges);
        }
        if (contentRange) {
            res.setHeader('Content-Range', contentRange);
        }
        
        // Set caching headers
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200');
        
        // For HEAD requests, just return headers without body
        if (req.method === 'HEAD') {
            console.log('✅ HEAD request completed successfully');
            return res.status(response.status).end();
        }

        // Handle partial content requests
        if (response.status === 206) {
            console.log('📦 Handling partial content response');
            res.status(206);
        }

        // Stream the response for better memory usage
        if (!response.body) {
            console.error('❌ No response body available');
            return res.status(502).json({ error: 'No response body from source' });
        }

        // Stream the response
        console.log('🚀 Streaming response...');
        
        // For Node.js/Vercel environment, we need to handle the stream properly
        try {
            const reader = response.body.getReader();
            let chunks = [];
            let totalSize = 0;
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                chunks.push(value);
                totalSize += value.length;
                
                // Safety check to prevent memory issues
                if (totalSize > 50 * 1024 * 1024) {
                    throw new Error('Response too large during streaming');
                }
            }
            
            // Combine all chunks
            const buffer = new Uint8Array(totalSize);
            let offset = 0;
            for (const chunk of chunks) {
                buffer.set(chunk, offset);
                offset += chunk.length;
            }
            
            console.log('✅ GeoTIFF streamed successfully, final size:', buffer.byteLength, 'bytes');
            
            // Validate minimum size
            if (buffer.byteLength < 100) {
                return res.status(422).json({ 
                    error: 'Response too small to be valid GeoTIFF',
                    size: buffer.byteLength 
                });
            }

            // Optional: Add ETag for better caching
            try {
                const crypto = require('crypto');
                const etag = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 16);
                res.setHeader('ETag', `"${etag}"`);
            } catch (cryptoError) {
                console.log('⚠️ Could not generate ETag:', cryptoError.message);
            }
            
            // Send the final buffer
            return res.send(Buffer.from(buffer));
            
        } catch (streamError) {
            console.error('❌ Streaming error:', streamError.message);
            return res.status(502).json({
                error: 'Failed to stream GeoTIFF data',
                details: streamError.message
            });
        }

    } catch (error) {
        console.error('❌ Proxy error:', error);
        
        // Handle specific error types with detailed messages
        if (error.name === 'AbortError') {
            return res.status(408).json({ 
                error: 'Request timeout - GeoTIFF fetch took too long',
                timeout: '30 seconds',
                suggestion: 'Try again or check if the source URL is accessible'
            });
        }
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({ 
                error: 'Unable to connect to Google Solar API',
                details: error.message,
                suggestion: 'Check your internet connection and try again'
            });
        }
        
        if (error.message.includes('fetch')) {
            return res.status(502).json({
                error: 'Failed to fetch from source',
                details: error.message,
                suggestion: 'The source URL may be temporarily unavailable'
            });
        }
        
        return res.status(500).json({ 
            error: 'Internal proxy error',
            details: error.message,
            type: error.name || 'Unknown',
            suggestion: 'Please try again or contact support'
        });
    }
};