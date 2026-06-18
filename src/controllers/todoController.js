const pool = require('../config/db');

const getTodos = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ success: true, data: rows });
};

const createTodo = async (req, res) => {
  const { title, description, due_date } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อ todo' });
  }

  const [result] = await pool.query(
    'INSERT INTO todos (user_id, title, description, due_date) VALUES (?, ?, ?, ?)',
    [req.user.id, title, description || null, due_date || null]
  );

  res.status(201).json({
    success: true,
    message: 'สร้าง todo สำเร็จ',
    data: { id: result.insertId, title, description, due_date, is_completed: false },
  });
};

const updateTodo = async (req, res) => {
  const { id } = req.params;
  const { title, description, is_completed, due_date } = req.body;

  const [rows] = await pool.query('SELECT id FROM todos WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบ todo' });
  }

  await pool.query(
    'UPDATE todos SET title = COALESCE(?, title), description = COALESCE(?, description), is_completed = COALESCE(?, is_completed), due_date = COALESCE(?, due_date) WHERE id = ?',
    [title ?? null, description ?? null, is_completed ?? null, due_date ?? null, id]
  );

  const [updated] = await pool.query('SELECT * FROM todos WHERE id = ?', [id]);
  res.json({ success: true, message: 'อัปเดต todo สำเร็จ', data: updated[0] });
};

const deleteTodo = async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query('SELECT id FROM todos WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบ todo' });
  }

  await pool.query('DELETE FROM todos WHERE id = ?', [id]);
  res.json({ success: true, message: 'ลบ todo สำเร็จ' });
};

module.exports = { getTodos, createTodo, updateTodo, deleteTodo };
