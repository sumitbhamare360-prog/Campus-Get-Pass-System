import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new Database('campus.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT UNIQUE,
    name TEXT,
    phone TEXT,
    age INTEGER,
    id_proof_type TEXT,
    id_proof_number TEXT,
    purpose TEXT,
    host_name TEXT,
    department TEXT,
    entry_time TEXT,
    exit_time TEXT,
    status TEXT,
    photo TEXT
  );

  CREATE TABLE IF NOT EXISTS hosts (
    host_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    department TEXT,
    role TEXT,
    contact TEXT
  );

  CREATE TABLE IF NOT EXISTS approvals (
    approval_id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT,
    host_id INTEGER,
    approval_status TEXT,
    approval_time TEXT
  );

  CREATE TABLE IF NOT EXISTS admins (
    admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT,
    date TEXT,
    time TEXT,
    organizer_contact TEXT,
    venue TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    location TEXT
  );
`);

// Insert default users if empty
try {
  db.exec('ALTER TABLE users ADD COLUMN location TEXT');
} catch (e) {
  // Column might already exist
}

try {
  db.exec('ALTER TABLE visitors ADD COLUMN host_location TEXT');
} catch (e) {
  // Column might already exist
}

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare('INSERT INTO users (username, password, role, location) VALUES (?, ?, ?, ?)');
  insertUser.run('admin', 'admin123', 'admin', null);
  insertUser.run('security', 'sec123', 'security', null);
  insertUser.run('host', 'host123', 'host', 'Main Building, Room 101');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/login', (req, res) => {
    const { username, password, role } = req.body;
    
    if (role === 'visitor') {
      try {
        const visitor = db.prepare('SELECT * FROM visitors WHERE visitor_id = ?').get(username) as any;
        if (visitor) {
          res.json({ success: true, role: 'visitor', visitor_id: visitor.visitor_id });
        } else {
          res.status(401).json({ error: 'Invalid Visitor ID' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
      return;
    }

    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ? AND role = ?').get(username, password, role) as any;
      if (user) {
        res.json({ success: true, role: user.role, username: user.username });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Visitors API
  app.post('/api/visitors', (req, res) => {
    const { name, phone, age, id_proof_type, id_proof_number, purpose, host_name, department, photo } = req.body;
    
    // Generate unique visitor ID
    const visitor_id = 'VIS' + Date.now().toString().slice(-6);
    const entry_time = new Date().toISOString();
    
    // Determine status based on purpose
    let status = 'Pending Approval';
    if (['Admission Enquiry', 'Campus Tour'].includes(purpose)) {
      status = 'Approved';
    }

    // Get host location if host_name is provided
    let host_location = null;
    if (host_name) {
      try {
        const host = db.prepare('SELECT location FROM users WHERE username = ? AND role = ?').get(host_name, 'host') as any;
        if (host) {
          host_location = host.location;
        }
      } catch (e) {
        console.error('Error fetching host location', e);
      }
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO visitors (visitor_id, name, phone, age, id_proof_type, id_proof_number, purpose, host_name, department, entry_time, status, photo, host_location)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(visitor_id, name, phone, age, id_proof_type, id_proof_number, purpose, host_name, department, entry_time, status, photo, host_location);
      
      res.json({ success: true, visitor_id, status });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to register visitor' });
    }
  });

  app.get('/api/visitors', (req, res) => {
    try {
      const visitors = db.prepare('SELECT * FROM visitors ORDER BY entry_time DESC').all();
      res.json(visitors);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch visitors' });
    }
  });

  app.get('/api/visitors/:id', (req, res) => {
    try {
      const visitor = db.prepare('SELECT * FROM visitors WHERE visitor_id = ?').get(req.params.id);
      if (visitor) {
        res.json(visitor);
      } else {
        res.status(404).json({ error: 'Visitor not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch visitor' });
    }
  });

  app.put('/api/visitors/:id/status', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    
    try {
      let stmt;
      if (status === 'Completed') {
        const exit_time = new Date().toISOString();
        stmt = db.prepare('UPDATE visitors SET status = ?, exit_time = ? WHERE visitor_id = ?');
        stmt.run(status, exit_time, id);
      } else {
        stmt = db.prepare('UPDATE visitors SET status = ? WHERE visitor_id = ?');
        stmt.run(status, id);
      }
      res.json({ success: true, status });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  app.delete('/api/visitors/:id', (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM visitors WHERE visitor_id = ?');
      stmt.run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete visitor' });
    }
  });

  app.get('/api/dashboard/stats', (req, res) => {
    try {
      const activeVisitors = db.prepare("SELECT COUNT(*) as count FROM visitors WHERE status = 'Inside Campus'").get();
      const pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM visitors WHERE status = 'Pending Approval'").get();
      const completedVisits = db.prepare("SELECT COUNT(*) as count FROM visitors WHERE status = 'Completed'").get();
      const totalVisits = db.prepare("SELECT COUNT(*) as count FROM visitors").get();
      
      const purposeStats = db.prepare("SELECT purpose, COUNT(*) as count FROM visitors GROUP BY purpose").all();
      const deptStats = db.prepare("SELECT department, COUNT(*) as count FROM visitors GROUP BY department").all();

      res.json({
        active: activeVisitors.count,
        pending: pendingApprovals.count,
        completed: completedVisits.count,
        total: totalVisits.count,
        byPurpose: purposeStats,
        byDepartment: deptStats
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Host Management API
  app.get('/api/users/hosts', (req, res) => {
    try {
      const hosts = db.prepare("SELECT id, username, role, location FROM users WHERE role = 'host'").all();
      res.json(hosts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch hosts' });
    }
  });

  app.post('/api/users/hosts', (req, res) => {
    const { username, password, location } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO users (username, password, role, location) VALUES (?, ?, ?, ?)');
      stmt.run(username, password, 'host', location || null);
      res.json({ success: true });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Username already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create host' });
      }
    }
  });

  app.delete('/api/users/hosts/:id', (req, res) => {
    try {
      const stmt = db.prepare("DELETE FROM users WHERE id = ? AND role = 'host'");
      stmt.run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete host' });
    }
  });

  app.put('/api/users/hosts/:id', (req, res) => {
    const { username, password, location } = req.body;
    try {
      if (password) {
        const stmt = db.prepare("UPDATE users SET username = ?, password = ?, location = ? WHERE id = ? AND role = 'host'");
        stmt.run(username, password, location || null, req.params.id);
      } else {
        const stmt = db.prepare("UPDATE users SET username = ?, location = ? WHERE id = ? AND role = 'host'");
        stmt.run(username, location || null, req.params.id);
      }
      res.json({ success: true });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Username already exists' });
      } else {
        res.status(500).json({ error: 'Failed to update host' });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
