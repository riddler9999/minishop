import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('deploy checklist includes VPN on/off buyer verification',()=>{ const s=fs.readFileSync('api/DEPLOY_CHECKLIST.md','utf8'); assert.match(s,/VPN on and once off/); });
