const express = require('express');
const router = express.Router();

module.exports = (receipts) => {
  router.get('/', (req, res) => {
    const leaderboard = {};
    receipts.forEach(r => {
      if (!leaderboard[r.neighborhood]) leaderboard[r.neighborhood] = 0;
      leaderboard[r.neighborhood] += r.points;
    });
    const sorted = Object.entries(leaderboard)
      .map(([neighborhood, total_points]) => ({ neighborhood, total_points }))
      .sort((a, b) => b.total_points - a.total_points);
    res.json(sorted);
  });

  return router;
};