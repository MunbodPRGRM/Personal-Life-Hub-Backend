const pool = require('../config/db');

const validTags = ['work', 'personal', 'study', 'other'];

const getNotes = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ success: true, data: rows });
};

const createNote = async (req, res) => {
  const { title, content, tags } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อ note' });
  }

  const validTag = validTags.includes(tags) ? tags : 'other';

  const [result] = await pool.query(
    'INSERT INTO notes (user_id, title, content, tags) VALUES (?, ?, ?, ?)',
    [req.user.id, title, content || null, validTag]
  );

  res.status(201).json({
    success: true,
    message: 'สร้าง note สำเร็จ',
    data: { id: result.insertId, title, content: content || null, tags: validTag },
  });
};

const updateNote = async (req, res) => {
  const { id } = req.params;
  const { title, content, tags } = req.body;

  const [rows] = await pool.query('SELECT id FROM notes WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบ note' });
  }

  const validTag = tags && validTags.includes(tags) ? tags : null;

  await pool.query(
    'UPDATE notes SET title = COALESCE(?, title), content = COALESCE(?, content), tags = COALESCE(?, tags) WHERE id = ?',
    [title ?? null, content ?? null, validTag, id]
  );

  const [updated] = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);
  res.json({ success: true, message: 'อัปเดต note สำเร็จ', data: updated[0] });
};

const deleteNote = async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query('SELECT id FROM notes WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบ note' });
  }

  await pool.query('DELETE FROM notes WHERE id = ?', [id]);
  res.json({ success: true, message: 'ลบ note สำเร็จ' });
};

module.exports = { getNotes, createNote, updateNote, deleteNote };
