const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadApi(fetch, env = {}) {
  const storage = new Map();
  const context = {
    exports: {}, process: { env }, window: {}, Headers, URLSearchParams,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    fetch,
  };
  const source = fs.readFileSync(require.resolve('../src/lib/api.ts'), 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(js, context);
  const api = context.exports;
  api.saveSession({ accessToken: 'expired', refreshToken: 'refresh-old', sessionId: 'session', user: { id: 'admin', role: 'ADMIN' } });
  return { api, storage };
}
const reply = (status, payload) => new Response(JSON.stringify(payload), {
  status, headers: { 'content-type': 'application/json' },
});

test('production defaults to AWS and rejects another configured backend', () => {
  assert.equal(loadApi(() => {}, { NODE_ENV: 'production' }).api.API_BASE_URL, 'https://api.clothify.ng');
  assert.throws(() => loadApi(() => {}, { NODE_ENV: 'production', NEXT_PUBLIC_API_BASE_URL: 'https://wrong.invalid' }), /production admin/);
  assert.equal(loadApi(() => {}, { NODE_ENV: 'production', NEXT_PUBLIC_APP_ENV: 'staging' }).api.API_BASE_URL, 'https://aws-test.clothify.ng');
});

test('concurrent 401s share one refresh and store the wrapped rotated session', async () => {
  let refreshes = 0;
  let retries = 0;
  const { api, storage } = loadApi(async (url, options) => {
    if (url.endsWith('/auth/refresh')) {
      refreshes++;
      await new Promise((resolve) => setImmediate(resolve));
      return reply(200, { success: true, data: { accessToken: 'fresh', refreshToken: 'rotated', sessionId: 'session' } });
    }
    if (options.headers.get('Authorization') === 'Bearer fresh') {
      retries++;
      return reply(200, { success: true, data: { ready: true } });
    }
    return reply(401, { message: 'Expired' });
  });
  const results = await Promise.all([api.apiFetch('/admin/me'), api.apiFetch('/admin/roles')]);
  assert.ok(results.every((result) => result.ready));
  assert.equal(refreshes, 1);
  assert.equal(retries, 2);
  assert.equal(storage.get('clothify_admin_refresh_token'), 'rotated');
});

test('failed refresh clears the session and a permissions denial preserves it', async () => {
  const failed = loadApi(async () => reply(401, { message: 'Invalid session' }));
  await assert.rejects(failed.api.apiFetch('/admin/me'), { status: 401 });
  assert.equal(failed.storage.size, 0);
  const denied = loadApi(async () => reply(403, { message: 'Forbidden' }));
  await assert.rejects(denied.api.apiFetch('/admin/finance'), { status: 403 });
  assert.equal(denied.storage.get('clothify_admin_access_token'), 'expired');
});
