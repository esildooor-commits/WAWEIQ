import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import { promisify } from "util";

const resolveSrv = promisify(dns.resolveSrv);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to check stream URL reachability
  app.post("/api/check-stream", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      // Perform a HEAD request with a 3-second timeout
      const response = await axios.head(url, { 
        timeout: 3000,
        headers: { 'User-Agent': 'WaveIQ/1.0' }
      });
      res.json({ reachable: response.status === 200 });
    } catch (error) {
      // If HEAD fails, try a GET with a short range to see if it's reachable
      try {
        const response = await axios.get(url, { 
          timeout: 3000,
          headers: { 'Range': 'bytes=0-0', 'User-Agent': 'WaveIQ/1.0' }
        });
        res.json({ reachable: response.status === 200 || response.status === 206 });
      } catch (innerError) {
        res.json({ reachable: false });
      }
    }
  });

  // Dynamic mirror management
  let dynamicMirrors: string[] = [
    'https://de1.api.radio-browser.info',
    'https://at1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info'
  ];

  async function refreshMirrors() {
    console.log("[Proxy] Refreshing Radio Browser mirrors via DNS SRV...");
    try {
      const records = await resolveSrv('_api._tcp.radio-browser.info');
      if (records && records.length > 0) {
        // Sort by priority and weight if we wanted to be perfect, 
        // but just getting the list is usually enough.
        const newMirrors = records.map(r => `https://${r.name}`);
        const httpMirrors = records.map(r => `http://${r.name}`);
        
        dynamicMirrors = Array.from(new Set([...newMirrors, ...httpMirrors]));
        console.log(`[Proxy] Successfully refreshed mirrors via DNS: ${dynamicMirrors.length} found`);
        return;
      }
    } catch (dnsError: any) {
      console.warn(`[Proxy] DNS SRV lookup failed: ${dnsError.message}. Falling back to seeds.`);
    }

    // Fallback to seeds if DNS fails
    const seeds = [
      'https://de1.api.radio-browser.info',
      'https://at1.api.radio-browser.info',
      'https://nl1.api.radio-browser.info',
      'https://fr1.api.radio-browser.info',
      'https://pl1.api.radio-browser.info'
    ];
    
    for (const seed of seeds) {
      try {
        const response = await axios.get(`${seed}/json/servers`, { 
          timeout: 10000,
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          }
        });
        if (Array.isArray(response.data) && response.data.length > 0) {
          const newMirrors = response.data
            .filter((s: any) => s.name && !s.name.includes('localhost'))
            .map((s: any) => `https://${s.name}`);
          
          const httpMirrors = response.data
            .filter((s: any) => s.name && !s.name.includes('localhost'))
            .map((s: any) => `http://${s.name}`);
          
          if (newMirrors.length > 0) {
            // Combine https and http mirrors, prioritizing https
            dynamicMirrors = Array.from(new Set([...newMirrors, ...seeds, ...httpMirrors]));
            console.log(`[Proxy] Successfully refreshed mirrors: ${dynamicMirrors.length} found`);
            return;
          }
        }
      } catch (e: any) {
        console.warn(`[Proxy] Failed to refresh mirrors from ${seed}: ${e.message} ${e.code || ''}`);
      }
    }
    console.warn("[Proxy] Could not refresh mirror list, using current list.");
  }

  // Initial refresh
  refreshMirrors();
  // Refresh every hour
  setInterval(refreshMirrors, 3600000);

  // Proxy for Radio Browser API to avoid CORS and connectivity issues
  app.get("/api/radio-browser/*", async (req, res) => {
    // Use req.params[0] for cleaner wildcard matching
    const apiPath = req.params[0];
    
    if (!apiPath) {
      return res.status(400).json({ error: "API path is required" });
    }

    // Ensure path starts with /
    let cleanPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
    
    // Attempt to fix potential case sensitivity issues and endpoint naming for country codes
    if (cleanPath.includes('/bycountrycode/')) {
      cleanPath = cleanPath.replace('/bycountrycode/', '/bycountry/');
    }
    
    // Ensure path starts with /
    if (!cleanPath.startsWith('/')) {
      cleanPath = `/${cleanPath}`;
    }
    
    // Lowercase the country code part
    const parts = cleanPath.split('/bycountry/');
    if (parts.length > 1) {
      cleanPath = `${parts[0]}/bycountry/${parts[1].toLowerCase()}`;
    }

    // Use dynamic mirrors, shuffled but prioritizing known good ones
    const mirrorsToTry = [...new Set([
      ...dynamicMirrors.sort(() => Math.random() - 0.5),
      'https://all.api.radio-browser.info',
      'http://all.api.radio-browser.info'
    ])];
    
    let lastError: any;
    let success = false;

    for (const mirror of mirrorsToTry) {
      const tryRequest = async (currentMirror: string) => {
        const cleanMirror = currentMirror.endsWith('/') ? currentMirror.slice(0, -1) : currentMirror;
        const targetUrl = `${cleanMirror}${cleanPath}`;
        
        console.log(`[Proxy] Attempting mirror: ${currentMirror}, URL: ${targetUrl}`);
        
        const response = await axios.get(targetUrl, {
          params: req.query,
          timeout: 8000,
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*' 
          }
        });
        
        const contentType = response.headers['content-type'] || '';
        const isJson = contentType.includes('application/json') || 
                       contentType.includes('text/json') || 
                       contentType.includes('text/javascript') ||
                       (typeof response.data === 'object' && response.data !== null);

        if (isJson) {
          console.log(`[Proxy] Mirror ${currentMirror} succeeded (Content-Type: ${contentType})`);
          success = true;
          return res.json(response.data);
        } else {
          const dataStr = typeof response.data === 'string' ? response.data : '';
          if (dataStr && (dataStr.trim().startsWith('[') || dataStr.trim().startsWith('{'))) {
             try {
               const parsed = JSON.parse(dataStr);
               console.log(`[Proxy] Mirror ${currentMirror} succeeded after manual JSON parse`);
               success = true;
               return res.json(parsed);
             } catch (e) {}
          }
          throw new Error("Mirror returned non-JSON response");
        }
      };

      try {
        const result = await tryRequest(mirror);
        if (result) return result;
      } catch (error: any) {
        lastError = error;
        const status = error.response ? `(Status: ${error.response.status})` : '';
        const errorCode = error.code ? `(Code: ${error.code})` : '';
        const responseData = error.response ? JSON.stringify(error.response.data) : '';
        console.warn(`[Proxy] Mirror ${mirror} failed: ${error.message} ${status} ${errorCode}. Response: ${responseData}`);
        
        // If HTTPS failed with DNS error, try HTTP version immediately
        if (error.code === 'ENOTFOUND' && mirror.startsWith('https://')) {
          const httpMirror = mirror.replace('https://', 'http://');
          console.log(`[Proxy] Retrying with HTTP for mirror: ${httpMirror}`);
          try {
            const result = await tryRequest(httpMirror);
            if (result) return result;
          } catch (httpError: any) {
            console.warn(`[Proxy] HTTP fallback failed for ${httpMirror}: ${httpError.message}`);
          }
        }
      }
    }

    if (!success) {
      console.error(`[Proxy] All Radio Browser mirrors failed for path: ${cleanPath}`);
      // Return 200 with success: false to avoid Nginx/CloudRun intercepting 502 with HTML
      return res.status(200).json({ 
        success: false,
        error: "All Radio Browser mirrors failed", 
        details: lastError?.message || "Unknown error",
        path: cleanPath,
        code: lastError?.code
      });
    }
  });

    // Proxy for IP location to avoid CORS and mixed content issues
  app.get("/api/location", async (req, res) => {
    const providers = [
      { url: 'https://ipwho.is/', transform: (d: any) => ({ country: d.country, countryCode: d.country_code, city: d.city }) },
      { url: 'https://freeipapi.com/api/json', transform: (d: any) => ({ country: d.countryName, countryCode: d.countryCode, city: d.cityName }) },
      { url: 'https://api.db-ip.com/v2/free/self', transform: (d: any) => ({ country: d.countryName || d.country, countryCode: d.countryCode || d.country_code, city: d.city || d.cityName }) },
      { url: 'https://ipapi.co/json/', transform: (d: any) => ({ country: d.country_name, countryCode: d.country, city: d.city }) },
      { url: 'https://geolocation-db.com/json/', transform: (d: any) => ({ country: d.country_name, countryCode: d.country_code, city: d.city }) },
      { url: 'http://ip-api.com/json/', transform: (d: any) => ({ country: d.country, countryCode: d.countryCode, city: d.city }) },
      { url: 'https://ipinfo.io/json', transform: (d: any) => ({ country: d.country, countryCode: d.country, city: d.city }) }
    ];

    // Shuffle providers to distribute load and avoid consistent 429s on one
    const shuffledProviders = [...providers].sort(() => Math.random() - 0.5);

    for (const provider of shuffledProviders) {
      try {
        console.log(`[Proxy] Attempting location provider: ${provider.url}`);
        const response = await axios.get(provider.url, { 
          timeout: 5000,
          headers: { 'User-Agent': 'WaveIQ/1.6' }
        });
        if (response.data) {
          const result = provider.transform(response.data);
          if (result.countryCode) {
            console.log(`[Proxy] Location provider ${provider.url} succeeded: ${result.countryCode}`);
            return res.json(result);
          }
        }
        throw new Error("Invalid response from provider");
      } catch (error: any) {
        const status = error.response ? `(Status: ${error.response.status})` : '';
        console.warn(`[Proxy] Location provider ${provider.url} failed: ${error.message} ${status}`);
      }
    }

    res.status(502).json({ error: "All location providers failed" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
