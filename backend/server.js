const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Neighborhoods and receipts
const SF_NEIGHBORHOODS = [
  "Alamo Square", "Anza Vista", "Balboa Terrace", "Bayview", "Bernal Heights",
  "Castro", "Chinatown", "Civic Center", "Cole Valley", "Cow Hollow",
  "Crocker Amazon", "Diamond Heights", "Dogpatch", "Dolores Heights",
  "Duboce Triangle", "Excelsior", "Fillmore", "Financial District",
  "Fisherman's Wharf", "Forest Hill", "Glen Park", "Haight-Ashbury",
  "Hayes Valley", "Hunter's Point", "India Basin", "Ingleside",
  "Inner Richmond", "Inner Sunset", "Japantown", "Jordan Park",
  "Laurel Heights", "Lake Street", "Lakeshore", "Little Hollywood",
  "Lower Haight", "Lower Pacific Heights", "Marina", "Mission District",
  "Mission Terrace", "Miraloma Park", "Nob Hill", "Noe Valley",
  "North Beach", "North Waterfront", "Ocean View", "Outer Mission",
  "Outer Richmond", "Outer Sunset", "Pacific Heights", "Parkside",
  "Portola", "Potrero Hill", "Presidio", "Presidio Heights",
  "Russian Hill", "Sea Cliff", "Silver Terrace", "SoMa",
  "South Beach", "St. Francis Wood", "Sunnyside", "Telegraph Hill",
  "Tenderloin", "Treasure Island", "Twin Peaks", "Union Square",
  "Visitacion Valley", "West Portal", "Western Addition", "Westwood Highlands",
  "Westwood Park"
];
const receipts = [];

function isValidSFNeighborhood(input) {
  return SF_NEIGHBORHOODS.some(
    n => n.toLowerCase() === input.trim().toLowerCase()
  );
}

// Import and use routes
const receiptsRoute = require('./routes/receipts')(upload, receipts, isValidSFNeighborhood);
const leaderboardRoute = require('./routes/leaderboard')(receipts);

app.use('/api/receipts', receiptsRoute);
app.use('/api/leaderboard', leaderboardRoute);

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Receipt processing route
app.post('/api/receipts', upload.single('receipt'), async (req, res) => {
  const { user, neighborhood } = req.body;
  const filename = req.file ? req.file.filename : null;

  // Validate neighborhood
  if (!isValidSFNeighborhood(neighborhood)) {
    return res.status(400).json({ error: "Invalid neighborhood." });
  }

  // OCR the image
  let ocrText = '';
  if (filename) {
    const imagePath = path.join(__dirname, '..', 'uploads', filename);
    try {
      const result = await Tesseract.recognize(imagePath, 'eng');
      ocrText = result.data.text;
    } catch (err) {
      return res.status(500).json({ error: "OCR failed." });
    }
  }

  // Parse info from OCR text (simple regex examples)
  const dateMatch = ocrText.match(/\d{2}\/\d{2}\/\d{4}/);
  const materialMatch = ocrText.match(/plastic|glass|paper|metal/i);
  const weightMatch = ocrText.match(/(\d+(\.\d+)?)\s?(lbs|kg)/i);
  const receiptNumberMatch = ocrText.match(/(Receipt\s*#?:?\s*)(\w+)/i);

  const date = dateMatch ? dateMatch[0] : '';
  const material = materialMatch ? materialMatch[0].toLowerCase() : '';
  const weight = weightMatch ? parseFloat(weightMatch[1]) : 0;
  const receiptNumber = receiptNumberMatch ? receiptNumberMatch[2] : '';

  // Check for duplicate receipt number
  if (receiptNumber && receipts.some(r => r.receiptNumber === receiptNumber)) {
    return res.status(400).json({ error: "Receipt number already used." });
  }

  // Calculate points (example logic)
  function calculatePoints(material, weight) {
    const multipliers = { paper: 1, plastic: 2, glass: 1.5, metal: 3 };
    const multiplier = multipliers[material] || 1;
    return Math.round(weight * multiplier);
  }
  const points = calculatePoints(material, weight);

  const receipt = {
    id: receipts.length + 1,
    user,
    neighborhood,
    receiptNumber,
    date,
    material,
    weight,
    points,
    filename,
    created_at: new Date()
  };
  receipts.push(receipt);

  res.json({ id: receipt.id, points, date, material, weight, receiptNumber });
});