const pool = require('../config/db');

const validTypes = ['income', 'expense'];

const getTransactions = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC',
    [req.user.id]
  );
  res.json({ success: true, data: rows });
};

const createTransaction = async (req, res) => {
  const { type, amount, category, note, date } = req.body;

  if (!validTypes.includes(type)) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุประเภท (income หรือ expense)' });
  }
  const amountNum = Number(amount);
  if (!(amountNum > 0)) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุจำนวนเงินที่มากกว่า 0' });
  }
  if (!date) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุวันที่' });
  }

  const [result] = await pool.query(
    'INSERT INTO transactions (user_id, type, amount, category, note, date) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, type, amountNum, category || null, note || null, date]
  );

  res.status(201).json({
    success: true,
    message: 'บันทึกรายการสำเร็จ',
    data: {
      id: result.insertId,
      type,
      amount: amountNum,
      category: category || null,
      note: note || null,
      date,
    },
  });
};

const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { type, amount, category, note, date } = req.body;

  const [rows] = await pool.query('SELECT id FROM transactions WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบรายการ' });
  }

  const validType = type && validTypes.includes(type) ? type : null;

  let amountNum = null;
  if (amount !== undefined) {
    amountNum = Number(amount);
    if (!(amountNum > 0)) {
      return res.status(400).json({ success: false, message: 'จำนวนเงินต้องมากกว่า 0' });
    }
  }

  await pool.query(
    'UPDATE transactions SET type = COALESCE(?, type), amount = COALESCE(?, amount), category = COALESCE(?, category), note = COALESCE(?, note), date = COALESCE(?, date) WHERE id = ?',
    [validType, amountNum, category ?? null, note ?? null, date ?? null, id]
  );

  const [updated] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]);
  res.json({ success: true, message: 'อัปเดตรายการสำเร็จ', data: updated[0] });
};

const deleteTransaction = async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query('SELECT id FROM transactions WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบรายการ' });
  }

  await pool.query('DELETE FROM transactions WHERE id = ?', [id]);
  res.json({ success: true, message: 'ลบรายการสำเร็จ' });
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction };
