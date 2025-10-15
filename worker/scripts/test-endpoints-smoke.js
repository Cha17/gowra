// Quick smoke tests for protected endpoints
const STAGING_URL = 'https://gowwra-api-worker-staging.charlcrtz17.workers.dev';

async function req(method, path, body) {
  const res = await fetch(`${STAGING_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch { data = await res.text(); }
  console.log(method, path, res.status, typeof data === 'string' ? data : JSON.stringify(data));
  return res.status;
}

async function run() {
  console.log('--- Smoke test start ---');
  await req('GET', '/health');
  // Protected routes should 401 without auth
  await req('POST', '/api/orders', {});
  await req('POST', '/api/checkout', {});
  await req('GET', '/api/checkout/does-not-exist');
  console.log('--- Smoke test end ---');
}

run().catch(e => { console.error(e); process.exit(1); });


