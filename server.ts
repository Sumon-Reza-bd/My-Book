import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Backend Config:', {
  hasUrl: !!supabaseUrl,
  urlStart: supabaseUrl.substring(0, 20),
  hasKey: !!supabaseAnonKey,
  rawUrl: supabaseUrl
});

// Create client with global fetch explicitly
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Debug Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseAnonKey,
        url: supabaseUrl.substring(0, 10) + '...'
      } 
    });
  });

  // API Routes
  app.get("/api/db/:table", async (req, res) => {
    try {
      const { table } = req.params;
      const { select = "*", order, ascending = "false" } = req.query;
      
      const url = `${supabaseUrl}/rest/v1/${table}?select=${select}${order ? `&order=${order}.${ascending === 'true' ? 'asc' : 'desc'}` : ''}`;
      console.log(`[GET] ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error(`Supabase Error [${table}]:`, response.status, errData);
        throw new Error(errData.message || errData.error || response.statusText);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Server error fetching:', error.message);
      res.status(500).json({ error: error.message, details: error.details || null });
    }
  });

  app.get("/api/db/:table/single", async (req, res) => {
    try {
      const { table } = req.params;
      const url = `${supabaseUrl}/rest/v1/${table}?select=*`;
      console.log(`[GET SINGLE] ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.pgrst.object+json'
        }
      });

      if (response.status === 406 || response.status === 404) return res.json(null);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error(`Supabase Error Single [${table}]:`, response.status, errData);
        throw new Error(errData.message || response.statusText);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Server error fetching single:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/db/:table", async (req, res) => {
    try {
      const { table } = req.params;
      const url = `${supabaseUrl}/rest/v1/${table}`;
      console.log(`[POST] ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(req.body)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error(`Supabase Error Post [${table}]:`, response.status, errData);
        throw new Error(errData.message || response.statusText);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Server error saving:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/db/:table/:id", async (req, res) => {
    try {
      const { table, id } = req.params;
      const url = `${supabaseUrl}/rest/v1/${table}?id=eq.${id}`;
      console.log('Deleting Supabase URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || response.statusText);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
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
