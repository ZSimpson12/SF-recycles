const express = require('express');
const path = require('path');
const Tesseract = require('tesseract.js');
const router = express.Router();

function normalizeMaterial(rawMaterial) {
  if (!rawMaterial) return '';
  const text = rawMaterial.toLowerCase();
  if (text.includes('aluminum') || text.includes('can')) return 'aluminum';
  if (text.includes('plastic')) return 'plastic';
  if (text.includes('glass')) return 'glass';
  return '';
}

function calculatePoints(material, weight) {
  const multipliers = {
    plastic: 2,
    aluminum: 4,
    glass: 1.5
  };
  const multiplier = multipliers[material] || 1;
  return Math.round(weight * multiplier);
}

module.exports = (upload, receipts, isValidSFNeighborhood) => {
  router.post('/', upload.single('receipt'), async (req, res) => {
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

    // Extract info from OCR text
    const dateMatch = ocrText.match(/\d{2}\/\d{2}\/\d{4}/);
    const materialMatch = ocrText.match(/plastic|glass|aluminum|can/i);
    const weightMatch = ocrText.match(/(\d+(\.\d+)?)\s?(lbs|kg)/i);
    const receiptNumberMatch = ocrText.match(/(Receipt\s*#?:?\s*)(\w+)/i);

    const date = dateMatch ? dateMatch[0] : '';
    const materialRaw = materialMatch ? materialMatch[0] : '';
    const material = normalizeMaterial(materialRaw);
    const weight = weightMatch ? parseFloat(weightMatch[1]) : 0;
    const receiptNumber = receiptNumberMatch ? receiptNumberMatch[2] : '';

    // Check for duplicate receipt number
    if (receiptNumber && receipts.some(r => r.receiptNumber === receiptNumber)) {
      return res.status(400).json({ error: "Receipt number already used." });
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

    // Return all extracted info
    res.json({ id: receipt.id, points, date, material, weight, receiptNumber });
  });

  return router;
};