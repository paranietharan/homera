const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const manifestPath = path.join(ROOT, 'manifest.json');

test('manifest.json complies with Manifest V3, least-privilege permissions, and strict CSP', () => {
  const raw = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);

  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage', 'unlimitedStorage']);
  assert.equal(manifest.host_permissions, undefined, 'Broad host_permissions must not be present');

  const csp = manifest.content_security_policy && manifest.content_security_policy.extension_pages;
  assert.ok(csp, 'content_security_policy.extension_pages must be defined');
  assert.ok(csp.includes("default-src 'self'"), 'CSP must restrict default-src to self');
  assert.ok(csp.includes("object-src 'none'"), 'CSP must disable object-src');
  assert.equal(csp.includes('unsafe-eval'), false, 'CSP must never allow unsafe-eval');

  // Verify referenced entry files exist
  assert.ok(fs.existsSync(path.join(ROOT, manifest.chrome_url_overrides.newtab)));
  assert.ok(fs.existsSync(path.join(ROOT, manifest.action.default_popup)));
  assert.ok(fs.existsSync(path.join(ROOT, manifest.action.default_icon)));
});
