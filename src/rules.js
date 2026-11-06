'use strict';
const L = (level, line, msg) => ({ level, line, msg });

function lintDockerfile(text) {
  const out = []; const lines = text.split('\n');
  lines.forEach((raw, i) => {
    const l = raw.trim(), n = i + 1;
    if (/^FROM\s+\S+:latest\b/i.test(l) || (/^FROM\s+[^\s:@]+(\s|$)/i.test(l) && !/scratch/i.test(l) && !/\bAS\b.*$/i.test('') && !/^FROM\s+\$/.test(l))) out.push(L('warn', n, 'unpinned base image (uses latest); pin a version'));
    if (/^(ENV|ARG)\s+\w*(PASSWORD|SECRET|TOKEN|KEY)\w*[= ]\S+/i.test(l)) out.push(L('error', n, 'secret in ENV/ARG; use runtime secrets'));
    if (/^ADD\s+https?:/i.test(l)) out.push(L('warn', n, 'ADD from URL; use curl with checksum verification'));
    if (/apt-get install/.test(l) && !/--no-install-recommends/.test(l)) out.push(L('warn', n, 'apt-get install without --no-install-recommends'));
    if (/curl[^|]*\|\s*(sh|bash)/.test(l)) out.push(L('error', n, 'piping curl to shell'));
  });
  if (!/^USER\s+(?!root)/im.test(text)) out.push(L('error', 0, 'no non-root USER set; container runs as root'));
  if (!/^HEALTHCHECK/im.test(text)) out.push(L('warn', 0, 'no HEALTHCHECK defined'));
  return out;
}

function lintK8s(text) {
  const out = [];
  if (!/\bresources:/.test(text) && /kind:\s*(Deployment|StatefulSet|DaemonSet|Pod)/.test(text)) out.push(L('warn', 0, 'no resource requests/limits'));
  if (/image:\s*\S+:latest\b/.test(text) || /image:\s*[^\s:@]+\s*$/m.test(text)) out.push(L('warn', 0, 'image uses latest or no tag'));
  if (/privileged:\s*true/.test(text)) out.push(L('error', 0, 'privileged container'));
  if (/hostNetwork:\s*true/.test(text)) out.push(L('error', 0, 'hostNetwork enabled'));
  if (/kind:\s*(Deployment|StatefulSet|Pod)/.test(text)) {
    if (!/livenessProbe:/.test(text)) out.push(L('warn', 0, 'no livenessProbe'));
    if (!/readinessProbe:/.test(text)) out.push(L('warn', 0, 'no readinessProbe'));
    if (!/runAsNonRoot:\s*true/.test(text)) out.push(L('warn', 0, 'runAsNonRoot not set'));
  }
  return out;
}

function lintWorkflow(text) {
  const out = [];
  text.split('\n').forEach((l, i) => {
    const m = /uses:\s*([\w.-]+\/[\w./-]+)@(\S+)/.exec(l);
    if (m && !/^[a-f0-9]{40}$/.test(m[2]) && !m[1].startsWith('actions/')) out.push(L('warn', i + 1, `action ${m[1]}@${m[2]} not pinned to a commit SHA`));
    if (/\$\{\{\s*github\.event\.(issue|pull_request|comment)\.[^}]*(title|body)/.test(l) && /run:/.test(l)) out.push(L('error', i + 1, 'untrusted input in run: script injection risk'));
  });
  if (/pull_request_target/.test(text) && /actions\/checkout/.test(text)) out.push(L('error', 0, 'pull_request_target with checkout can run untrusted code'));
  if (!/^permissions:/m.test(text)) out.push(L('warn', 0, 'no top-level permissions; set least privilege'));
  return out;
}

function detect(file) {
  if (/(^|\/)Dockerfile/.test(file)) return lintDockerfile;
  if (/\.github\/workflows\/.*\.ya?ml$/.test(file)) return lintWorkflow;
  if (/\.ya?ml$/.test(file)) return lintK8s;
  return null;
}
module.exports = { lintDockerfile, lintK8s, lintWorkflow, detect };
