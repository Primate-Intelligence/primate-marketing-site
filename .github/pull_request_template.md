## Security checklist (required)

- [ ] Authn enforced on all new/changed endpoints
- [ ] Object-level authz (IDOR): user can only reach resources they own
- [ ] Input validated + bounded (types, lengths, ranges)
- [ ] Rate limiting considered for new endpoints/flows
- [ ] Errors leak no internals or PII
- [ ] No secrets in code/config

## What & why

<!-- 1-3 lines: what changed and why -->
