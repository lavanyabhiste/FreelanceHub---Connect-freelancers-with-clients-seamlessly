const express = require('express');
const router = express.Router();
const { createDispute, getMyDisputes } = require('../controllers/disputeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createDispute);
router.get('/mine', getMyDisputes);

module.exports = router;
