const crypto = require('crypto');
const { hashPassword, verifyPassword } = require('../database/connection');

function legacySha256(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

describe('SEC-002 — Password hashing (bcrypt + legacy migration)', () => {
  it('produces a bcrypt hash ($2b$ prefix), not a raw sha256', () => {
    expect(hashPassword('admin123')).toMatch(/^\$2b\$\d{2}\$/);
  });

  it('uses a salt: same password hashes differently every time', () => {
    const a = hashPassword('admin123');
    const b = hashPassword('admin123');
    expect(a).not.toBe(b);
    expect(verifyPassword('admin123', a).ok).toBe(true);
    expect(verifyPassword('admin123', b).ok).toBe(true);
  });

  it('rejects a wrong password', () => {
    const stored = hashPassword('correct');
    const res = verifyPassword('wrong', stored);
    expect(res.ok).toBe(false);
    expect(res.needsRehash).toBe(false);
  });

  it('accepts a legacy sha256 hash and flags it for rehash', () => {
    const stored = legacySha256('admin123');
    const res = verifyPassword('admin123', stored);
    expect(res.ok).toBe(true);
    expect(res.needsRehash).toBe(true);
  });

  it('does not rehash a wrong password against a legacy hash', () => {
    const stored = legacySha256('admin123');
    const res = verifyPassword('nope', stored);
    expect(res.ok).toBe(false);
    expect(res.needsRehash).toBe(false);
  });
});
