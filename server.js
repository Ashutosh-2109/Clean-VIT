const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());


// SERVE FRONTEND
app.use(express.static(path.join(__dirname, '.')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


const dataFile = path.join(__dirname, 'data.json');

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify({ cleaningRequests: [] }, null, 2));
}

function readData() {
  const raw = fs.readFileSync(dataFile, 'utf-8');
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// SERVE STATIC FILES
app.use(express.static(path.join(__dirname, '.')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/requests', (req, res) => {
  const data = readData();
  res.json(data.cleaningRequests);
});

app.post('/api/requests', (req, res) => {
  const { hostelType, block, roomNumber, studentId } = req.body;
  if (!hostelType || !block || !roomNumber || !studentId) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const data = readData();
  const request = {
    id: Date.now().toString(),
    hostelType,
    block,
    roomNumber,
    studentId,
    status: 'pending',
    timestamp: new Date().toISOString(),
    assignedCleaner: null,
    assignedAt: null,
    startedAt: null,
    completedAt: null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null
  };
  data.cleaningRequests.push(request);
  writeData(data);
  res.json(request);
});

app.put('/api/requests/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'in-progress', 'completed', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const data = readData();
  const reqIndex = data.cleaningRequests.findIndex(r => r.id === req.params.id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Request not found' });
  }

  const request = data.cleaningRequests[reqIndex];
  request.status = status;
  
  if (status === 'in-progress') {
    request.startedAt = new Date().toISOString();
  } else if (status === 'completed') {
    request.completedAt = new Date().toISOString();
  } else if (status === 'approved') {
    request.approvedAt = new Date().toISOString();
  } else if (status === 'rejected') {
    request.rejectedAt = new Date().toISOString();
  }
  
  writeData(data);
  res.json(request);
});

app.delete('/api/requests/:id', (req, res) => {
  const data = readData();
  const reqIndex = data.cleaningRequests.findIndex(r => r.id === req.params.id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Request not found' });
  }
  const removed = data.cleaningRequests.splice(reqIndex, 1)[0];
  writeData(data);
  res.json({ success: true, removed });
});

app.post('/api/login', (req, res) => {
  const cleaners = {
    C001: { id: 'C001', name: 'Rajesh Kumar', hostelType: 'mens' },
    C002: { id: 'C002', name: 'Suresh Singh', hostelType: 'mens' },
    C003: { id: 'C003', name: 'Priya Sharma', hostelType: 'ladies' },
    C004: { id: 'C004', name: 'Anjali Gupta', hostelType: 'ladies' }
  };

  const { cleanerId } = req.body;
  const cleaner = cleaners[cleanerId];
  if (!cleaner) {
    return res.status(401).json({ error: 'Invalid cleaner ID' });
  }
  res.json(cleaner);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Clean VIT backend running on http://localhost:${PORT}`);
});
