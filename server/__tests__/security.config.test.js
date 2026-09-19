const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

/**
 * Runs a small Node snippet in an isolated child process so we can assert
 * on real boot behavior without mutating the test runner's own env.
 * @param {string} snippet JS code to evaluate via `node -e`
 * @param {Record<string,string|undefined>} env extra env vars (undefined deletes)
 * @returns {{status:number, stderr:string}}
 */
function runNode(snippet, env = {}) {
  try {
    const stdout = execFileSync(process.execPath, ['-e', snippet], {
      cwd: ROOT,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, stderr: stdout };
  } catch (err) {
    return { status: err.status ?? 1, stderr: (err.stderr || '') + (err.message || '') };
  }
}

describe('SEC-001 — JWT secret fail-fast', () => {
  it('throws when JWT_SECRET is not defined (refuses insecure boot)', () => {
    const res = runNode("require('./server/middleware/auth')", { JWT_SECRET: undefined });
    expect(res.status).not.toBe(0);
    expect(res.stderr).toMatch(/JWT_SECRET environment variable is required/);
  });

  it('loads fine when JWT_SECRET is provided', () => {
    const res = runNode("require('./server/middleware/auth'); process.stdout.write('OK')", {
      JWT_SECRET: 'a-test-secret',
    });
    expect(res.status).toBe(0);
    expect(res.stderr).toContain('OK');
  });
});
