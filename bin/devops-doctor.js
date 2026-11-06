#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const { detect } = require('../src/rules');
const files = process.argv.slice(2);
if (!files.length) { console.log('Usage: devops-doctor <Dockerfile|k8s.yaml|.github/workflows/ci.yml> ...'); process.exit(0); }
let errors = 0;
for (const f of files) {
  const lint = detect(f);
  if (!lint) { console.log(`- ${f}: skipped (unknown type)`); continue; }
  const issues = lint(fs.readFileSync(f, 'utf8'));
  console.log(`\n${f}`);
  if (!issues.length) console.log('  ✓ no issues');
  for (const i of issues) { if (i.level === 'error') errors++; console.log(`  ${i.level === 'error' ? '✗' : '⚠'} ${i.line ? 'L' + i.line + ': ' : ''}${i.msg}`); }
}
process.exit(errors ? 1 : 0);
