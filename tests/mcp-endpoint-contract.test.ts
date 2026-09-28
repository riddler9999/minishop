import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {MCP_TOOL_NAMES} from '../api/mcp/contracts.ts';
import {TOOL_REGISTRY} from '../api/mcp/tool-registry.ts';

describe('MCP tool registry',()=>{
  it('exposes exactly the approved 18 seller tools',()=>{
    assert.deepEqual(Object.keys(TOOL_REGISTRY),[...MCP_TOOL_NAMES]);
  });
  it('keeps publish separate from write capability',()=>{
    assert.equal(TOOL_REGISTRY.update_store_theme.capability,'store:write');
    assert.equal(TOOL_REGISTRY.publish_store.capability,'store:publish');
    assert.equal(TOOL_REGISTRY.rollback_store_design.capability,'store:publish');
  });
  it('contains no superadmin or generic database escape hatch',()=>{
    for(const name of Object.keys(TOOL_REGISTRY)) assert.doesNotMatch(name,/superadmin|sql|rpc|table|row/i);
  });
});
