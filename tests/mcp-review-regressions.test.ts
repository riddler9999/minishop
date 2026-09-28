import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {createDefaultStoreDesign} from '../src/domain/storeDesign/index.ts';
import {createStoreDesignMcpService} from '../api/mcp/store-design.ts';
import {McpError} from '../api/mcp/errors.ts';

describe('MCP review regressions',()=>{
  it('rejects unknown StoreDesign templates instead of crashing',async()=>{
    const doc=createDefaultStoreDesign('clean-minimal');
    const adapter:any={
      async loadOwnStoreDesign(){return{draft:doc,published:doc,previousPublished:null,draftRevision:1,publishedRevision:1,updatedAt:null,publishedAt:null};},
      async saveDraft(){throw new Error('should not persist');},
      async publishDraft(){throw new Error('unused');},
      async rollbackPublished(){throw new Error('unused');},
    };
    const svc=createStoreDesignMcpService(adapter);
    await assert.rejects(svc.addStoreSection({template:'unknown' as any,type:'hero'}),(e:unknown)=>e instanceof McpError&&e.code==='UNSUPPORTED_TEMPLATE');
  });

  it('rejects malformed typed section settings that normalize would silently discard',async()=>{
    const doc=createDefaultStoreDesign('clean-minimal');
    const adapter:any={
      async loadOwnStoreDesign(){return{draft:doc,published:doc,previousPublished:null,draftRevision:1,publishedRevision:1,updatedAt:null,publishedAt:null};},
      async saveDraft(){throw new Error('should not persist');},
      async publishDraft(){throw new Error('unused');},
      async rollbackPublished(){throw new Error('unused');},
    };
    const svc=createStoreDesignMcpService(adapter);
    const hero=doc.templates.home.sections.find((s:any)=>s.type==='hero')!;
    await assert.rejects(
      svc.updateStoreSection({template:'home',sectionId:hero.id,settings:{headline:123 as any}}),
      (e:unknown)=>e instanceof McpError&&e.code==='INVALID_SECTION',
    );
  });
});
