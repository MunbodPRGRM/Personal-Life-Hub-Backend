const pool = require('../config/db');

const validStatuses = ['active', 'completed', 'cancelled'];

const getGoals = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ success: true, data: rows });
};

const createGoal = async (req, res) => {
  const { title, description, status, progress, target_date } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อ goal' });
  }

  const validStatus = validStatuses.includes(status) ? status : 'active';
  const validProgress = progress >= 0 && progress <= 100 ? progress : 0;

  const [result] = await pool.query(
    'INSERT INTO goals (user_id, title, description, status, progress, target_date) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, title, description || null, validStatus, validProgress, target_date || null]
  );

  res.status(201).json({
    success: true,
    message: 'สร้าง goal สำเร็จ',
    data: { id: result.insertId, title, description: description || null, status: validStatus, progress: validProgress, target_date: target_date || null },
  });
};

const updateGoal = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, progress, target_date } = req.body;

  const [rows] = await pool.query('SELECT id FROM goals WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบ goal' });
  }

  const validStatus = status && validStatuses.includes(status) ? status : null;
  const validProgress = progress !== undefined && progress >= 0 && progress <= 100 ? progress : null;

  await pool.query(
    'UPDATE goals SET title = COALESCE(?, title), description = COALESCE(?, description), status = COALESCE(?, status), progress = COALESCE(?, progress), target_date = COALESCE(?, target_date) WHERE id = ?',
    [title ?? null, description ?? null, validStatus, validProgress, target_date ?? null, id]
  );

  const [updated] = await pool.query('SELECT * FROM goals WHERE id = ?', [id]);
  res.json({ success: true, message: 'อัปเดต goal สำเร็จ', data: updated[0] });
};

const deleteGoal = async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query('SELECT id FROM goals WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบ goal' });
  }

  await pool.query('DELETE FROM goals WHERE id = ?', [id]);
  res.json({ success: true, message: 'ลบ goal สำเร็จ' });
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
