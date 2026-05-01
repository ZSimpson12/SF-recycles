const express = require('express');
const path = require('path');
const Tesseract = require('tesseract.js');
const router = express.Router();

module.exports = (upload, receipts, isValidSFNeighborhood, resolveNeighborhood) => {
  router.post('/', upload.single('receipt'), async (req, res) => {
    const { user, neighborhood } = req.body;
    const filename = req.file ? req.file.filename : null;

    if (!isValidSFNeighborhood(neighborhood)) {
      return res.status(400).json({ error: "Please enter a valid SF zip code." });
    }

    const resolvedNeighborhood = resolveNeighborhood(neighborhood);

    let ocrText = '';
    if (filename) {
      const imagePath = path.join(__dirname, '..', 'uploads', filename);
      try {
        const result = await Tesseract.recognize(imagePath, 'eng');
        ocrText = result.data.text;
        console.log("OCR RAW:\n", ocrText);
      } catch (err) {
        return res.status(500).json({ error: "OCR failed." });
      }
    }

    const receiptNumberMatch = ocrText.match(/(?:ticket|receipt)\s*#?\s*(\w+)/i);
    const receiptNumber = receiptNumberMatch ? receiptNumberMatch[1] : '';
    const weight = parseFloat(req.body.weight) || 0;
    const dollarMatch = ocrText.match(/\$\s*(\d+\.\d+)/);
    const payout = dollarMatch ? parseFloat(dollarMatch[1]) : 0;
    const totalPoints = Math.round(payout * 10);
    const breakdown = [{ weight, points: totalPoints }];

    console.log("weight:", weight, "payout:", payout, "points:", totalPoints, "receiptNumber:", receiptNumber);

    if (receiptNumber && receipts.some(r => r.receiptNumber === receiptNumber)) {
      return res.status(400).json({ error: "Receipt number already used." });
    }

    const receipt = {
      id: receipts.length + 1,
      user,
      neighborhood: resolvedNeighborhood,
      receiptNumber,
      weight,
      points: totalPoints,
      filename,
      created_at: new Date()
    };
    receipts.push(receipt);

    res.json({ id: receipt.id, points: totalPoints, payout, weight, receiptNumber, breakdown });
  });

  return router;
};