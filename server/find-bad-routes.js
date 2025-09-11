
// scripts/find-bad-routes.js
// Usage: node scripts/find-bad-routes.js
// Scans src/**/*.ts and prints decorators with suspicious ':' in route paths.

const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) res = res.concat(walk(p));
    else if (entry.isFile() && p.endsWith('.ts')) res.push(p);
  }
  return res;
}

function findSuspiciousRoutes(file) {
  const text = fs.readFileSync(file, 'utf8');
  const regex = /@(?:Controller|Get|Post|Put|Patch|Delete)\s*\(\s*(['"`])([^'"`]*?)\1\s*\)/g;
  const out = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    const route = m[2];
    // skip empty ('') and root ('/')
    if (!route || route === '/' ) continue;

    // Find suspicious ':' occurrences
    let bad = false;
    for (let i = 0; i < route.length; i++) {
      if (route[i] === ':') {
        const next = route[i+1];
        const isParamChar = next && /[A-Za-z0-9_]/.test(next);
        if (!isParamChar) {
          bad = true;
          break;
        }
      }
    }
    // Also suspicious if contains '::' or ':/'
    if (route.includes('::') || route.includes(':/') || /:\s*$/.test(route)) bad = true;

    if (bad) {
      // compute line number
      const upto = text.slice(0, m.index);
      const line = upto.split(/\r?\n/).length;
      out.push({ route, line });
    }
  }
  return out;
}

const src = path.join(process.cwd(), 'src');
if (!fs.existsSync(src)) {
  console.error('Not found: ./src — run this from your server project root');
  process.exit(2);
}

let total = 0;
for (const file of walk(src)) {
  const issues = findSuspiciousRoutes(file);
  if (issues.length) {
    console.log('--- ' + file);
    for (const it of issues) {
      console.log(`L${it.line}: suspicious path => "${it.route}"`);
    }
    total += issues.length;
  }
}

if (total === 0) {
  console.log('No suspicious route patterns found.');
} else {
  console.log(`\nFound ${total} suspicious decorator path(s). Fix ":" without a name (e.g., use ":id").`);
}
