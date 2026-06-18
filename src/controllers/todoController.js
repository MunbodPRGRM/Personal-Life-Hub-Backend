const pool = require('../config/db');

const getTodos = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ success: true, data: rows });
};

const createTodo = async (req, res) => {
  const { title, description, due_date, priority } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อ todo' });
  }

  const validPriority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';

  const [result] = await pool.query(
    'INSERT INTO todos (user_id, title, description, due_date, priority) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, title, description || null, due_date || null, validPriority]
  );

  res.status(201).json({
    success: true,
    message: 'สร้าง todo สำเร็จ',
    data: { id: result.insertId, title, description: description || null, due_date: due_date || null, priority: validPriority, is_done: false },
  });
};

const updateTodo = async (req, res) => {
  const { id } = req.params;
  const { title, description, is_done, due_date, priority } = req.body;

  const [rows] = await pool.query('SELECT id FROM todos WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบ todo' });
  }

  await pool.query(
    'UPDATE todos SET title = COALESCE(?, title), description = COALESCE(?, description), is_done = COALESCE(?, is_done), due_date = COALESCE(?, due_date), priority = COALESCE(?, priority) WHERE id = ?',
    [title ?? null, description ?? null, is_done ?? null, due_date ?? null, priority ?? null, id]
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
