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