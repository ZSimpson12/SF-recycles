const express = require('express');
const router = express.Router();

module.exports = (receipts) => {
  router.get('/', (req, res) => {
    // per-user aggregation
    const userMap = {};
    receipts.forEach(r => {
      if (!userMap[r.user]) {
        userMap[r.user] = { user: r.user, neighborhood: r.neighborhood, points: 0, weight: 0 };
      }
      userMap[r.user].points += r.points;
      userMap[r.user].weight += r.weight || 0;
    });
    const users = Object.values(userMap).sort((a, b) => b.points - a.points);

    // per-neighborhood aggregation
    const neighborhoodMap = {};
    receipts.forEach(r => {
      if (!neighborhoodMap[r.neighborhood]) {
        neighborhoodMap[r.neighborhood] = { neighborhood: r.neighborhood, points: 0, weight: 0 };
      }
      neighborhoodMap[r.neighborhood].points += r.points;
      neighborhoodMap[r.neighborhood].weight += r.weight || 0;
    });
    const neighborhoods = Object.values(neighborhoodMap).sort((a, b) => b.points - a.points);

    res.json({ users, neighborhoods });
  });

  return router;
};