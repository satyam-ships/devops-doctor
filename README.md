# devops-doctor 🚑

> Catch production mistakes in your **Dockerfiles, Kubernetes manifests and GitHub Actions workflows** before they ship. Zero dependencies.

```bash
npx devops-doctor Dockerfile k8s/deploy.yaml .github/workflows/ci.yml
```

```
Dockerfile
  ⚠ L1: unpinned base image (uses latest); pin a version
  ✗ L2: secret in ENV/ARG; use runtime secrets
  ✗ no non-root USER set; container runs as root
  ⚠ no HEALTHCHECK defined
```

## Rules
**Docker**: unpinned/latest images · secrets in ENV/ARG · running as root · curl|sh · ADD from URL · missing HEALTHCHECK
**Kubernetes**: no resource limits · latest tags · privileged · hostNetwork · missing liveness/readiness probes · runAsNonRoot unset
**GitHub Actions**: unpinned third-party actions · script injection via event data · `pull_request_target` + checkout · missing `permissions`

Exit code `1` on any error: ready for CI.

## Roadmap
- [ ] AWS (public S3, open security groups) via CLI output
- [ ] Live `kubectl` cluster checks (CrashLoopBackOff, missing limits)
- [ ] Nginx, SSL expiry, DNS checks
- [ ] `--fix` suggestions and SARIF output

## License
[MIT](LICENSE)
