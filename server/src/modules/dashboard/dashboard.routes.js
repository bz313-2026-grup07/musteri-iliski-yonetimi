const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { validate } = require('../../utils/validate');
const { dailyQuerySchema } = require('./dashboard.schemas');
const dashboard = require('./dashboard.service');

const router = express.Router();
router.use(requireAuth);

router.get('/daily', async (req, res) => {
  const { date } = validate(dailyQuerySchema, req.query);
  res.json({ data: await dashboard.getDailySummary(date) });
});

module.exports = router;
