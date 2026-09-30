/* API checks for the new Public Browse + Client Applications endpoints */
const BASE = 'http://localhost:5000/api';

const req = async (method, path, { token, body } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  return { status: res.status, data };
};

const results = [];
const check = (name, cond, extra = '') => {
  results.push({ name, pass: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
};

const run = async () => {
  // 1. Public project feed (no auth)
  const feed = await req('GET', '/projects?limit=5');
  check('GET /projects is public → 200', feed.status === 200, `total=${feed.data?.total}`);
  check('Feed returns only Open projects', (feed.data?.projects || []).every((p) => p.status === 'Open'));
  check('Feed exposes safe fields only (no email)', (feed.data?.projects || []).every((p) => !('email' in (p.client || {}))));

  // 2. Public filters work
  const filtered = await req('GET', '/projects?category=Web Development&limit=5');
  check('Category filter works', filtered.status === 200 && (filtered.data?.projects || []).every((p) => p.category === 'Web Development'));
  const searched = await req('GET', '/projects?search=test&limit=5');
  check('Search filter works → 200', searched.status === 200);

  // 3. Project detail still requires auth
  const detailNoAuth = await req('GET', '/projects/000000000000000000000000');
  check('GET /projects/:id still requires auth → 401', detailNoAuth.status === 401);

  // 4. Client applications aggregate
  const stamp = Date.now();
  const client = await req('POST', '/auth/register', {
    body: { name: 'API Test Client', email: `apitc${stamp}@t.com`, password: 'secret123', role: 'Client' },
  });
  const freelancer = await req('POST', '/auth/register', {
    body: { name: 'API Test Freelancer', email: `apitf${stamp}@t.com`, password: 'secret123', role: 'Freelancer' },
  });
  const cToken = client.data.token;
  const fToken = freelancer.data.token;

  const mineEmpty = await req('GET', '/projects/applications/mine', { token: cToken });
  check('Client aggregate works (empty)', mineEmpty.status === 200 && mineEmpty.data?.total === 0, JSON.stringify(mineEmpty.data?.total));

  // No token → 401, freelancer → 403
  const mineNoAuth = await req('GET', '/projects/applications/mine');
  check('Aggregate without token → 401', mineNoAuth.status === 401);
  const mineFreelancer = await req('GET', '/projects/applications/mine', { token: fToken });
  check('Aggregate for freelancer → 403', mineFreelancer.status === 403);

  // 5. Full flow: project + bid → aggregate returns it
  const proj = await req('POST', '/projects', {
    token: cToken,
    body: { title: 'API Aggregate Test', description: 'Testing the client applications aggregate endpoint.', category: 'Web Development', budget: 300, duration: '3 days' },
  });
  check('Client created project', proj.status === 201, proj.data?.message);
  const bid = await req('POST', '/freelancers/bid', {
    token: fToken,
    body: { projectId: proj.data.project._id, proposal: 'I can do this.', bidAmount: 250, estimatedDuration: '3 days' },
  });
  check('Freelancer bid submitted', bid.status === 201, bid.data?.message);

  const mineWith = await req('GET', '/projects/applications/mine', { token: cToken });
  const found = (mineWith.data?.applications || []).find((a) => a._id === bid.data.application._id);
  check('Aggregate returns the application with project + freelancer', !!found && !!found.project && !!found.freelancer, `total=${mineWith.data?.total}`);
  check('Aggregate status filter', (await req('GET', '/projects/applications/mine?status=Pending', { token: cToken })).data?.applications?.every((a) => a.status === 'Pending'));

  // 6. Reviews endpoint for the Reviews page
  const reviews = await req('GET', `/reviews/user/${client.data.user._id}`, { token: cToken });
  check('GET /reviews/user/:id works', reviews.status === 200 && Array.isArray(reviews.data?.reviews));

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) { console.log('FAILED:', failed.map((f) => f.name).join(' | ')); process.exit(1); }
  process.exit(0);
};

run().catch((e) => { console.error('FATAL', e); process.exit(1); });
