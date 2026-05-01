const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

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

const SF_ZIP_CODES = {
  "94102": "Civic Center", "94103": "SoMa", "94104": "Financial District",
  "94105": "South Beach", "94107": "Potrero Hill", "94108": "Chinatown",
  "94109": "Nob Hill", "94110": "Mission District", "94111": "Financial District",
  "94112": "Excelsior", "94114": "Castro", "94115": "Western Addition",
  "94116": "Inner Sunset", "94117": "Haight-Ashbury", "94118": "Inner Richmond",
  "94119": "West Portal", "94121": "Outer Richmond", "94122": "Outer Sunset",
  "94123": "Marina", "94124": "Bayview", "94127": "West Portal",
  "94129": "Presidio", "94130": "Treasure Island", "94131": "Glen Park",
  "94132": "Ocean View", "94133": "North Beach", "94134": "Visitacion Valley",
  "94158": "Mission Bay"
};

function isValidSFNeighborhood(input) {
  const trimmed = input.trim();
  if (SF_ZIP_CODES[trimmed]) return true;
  return SF_NEIGHBORHOODS.some(n => n.toLowerCase() === trimmed.toLowerCase());
}


const receipts = [];

const receiptsRoute = require('./routes/receipts')(upload, receipts, isValidSFNeighborhood, resolveNeighborhood);
const leaderboardRoute = require('./routes/leaderboard')(receipts);

app.use('/api/receipts', receiptsRoute);
app.use('/api/leaderboard', leaderboardRoute);

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));