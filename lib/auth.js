const bcrypt = require('bcrypt');
const { getDb } = require('./db');

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function getUserByUsername(username) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);
}

function createUser(username, password, role, name) {
  const db = getDb();
  const hashedPassword = hashPassword(password);
  const stmt = db.prepare(`
    INSERT INTO users (username, password, role, name)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(username, hashedPassword, role, name);
}

module.exports = {
  hashPassword,
  verifyPassword,
  getUserByUsername,
  createUser,
};
