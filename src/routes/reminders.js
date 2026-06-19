const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getReminders, createReminder, updateReminder, deleteReminder } = require('../controllers/reminderController');

router.use(authMiddleware);

router.get('/', getReminders);
router.post('/', createReminder);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);

module.exports = router;
