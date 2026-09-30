const express = require('express');
const router = express.Router();
const {
  getMyTransactions,
  getProjectTransaction,
  releaseTransaction,
  refundTransaction,
  failTransaction,
} = require('../controllers/transactionController');
const { protect, isClient } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyTransactions);
router.get('/project/:projectId', getProjectTransaction);

// Escrow lifecycle actions (client only)
router.post('/:id/release', isClient, releaseTransaction);
router.post('/:id/refund', isClient, refundTransaction);
router.post('/:id/fail', isClient, failTransaction);

module.exports = router;
