'use strict';
const t = require('node:test'); const assert = require('node:assert');
const { lintDockerfile, lintK8s, lintWorkflow } = require('../src/rules');
t.test('dockerfile root + latest + secret', () => {
  const i = lintDockerfile('FROM node:latest\nENV API_TOKEN=abc\nCMD ["node"]');
  assert.ok(i.some(x => /root/.test(x.msg))); assert.ok(i.some(x => /secret/.test(x.msg))); assert.ok(i.some(x => /latest/.test(x.msg)));
});
t.test('good dockerfile has no errors', () => {
  const i = lintDockerfile('FROM node:22-slim\nUSER node\nHEALTHCHECK CMD true\nCMD ["node"]');
  assert.strictEqual(i.filter(x => x.level === 'error').length, 0);
});
t.test('k8s privileged', () => assert.ok(lintK8s('kind: Pod\nprivileged: true').some(x => /privileged/.test(x.msg))));
t.test('workflow injection', () => assert.ok(lintWorkflow('permissions: {}\n run: echo ${{ github.event.issue.title }}').some(x => x.level === 'error')));
