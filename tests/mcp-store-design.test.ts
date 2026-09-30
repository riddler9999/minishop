import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {createDefaultStoreDesign} from '../src/domain/storeDesign/index.ts';
import {McpError} from '../api/_mcp/errors.ts';
import {createStoreDesignMcpService} from '../api/_mcp/store-design.ts';

function service() {
  let draft = createDefaultStoreDesign('clean-minimal');
  let published = createDefaultStoreDesign('soft-elegant');
  let previousPublished = createDefaultStoreDesign('street-bold');
  let draftRevision = 3;
  let publishedRevision = 2;
  const adapter = {
    async loadOwnStoreDesign() { return {draft,published,previousPublished,draftRevision,publishedRevision,updatedAt:null,publishedAt:null}; },
    async saveDraft(input: any) {
      if (input.expectedRevision !== draftRevision) throw Object.assign(new Error('conflict'), {code:'STORE_DESIGN_CONFLICT'});
      draft = input.document;
      draftRevision += 1;
      return {revision:draftRevision, document:draft};
    },
    async publishDraft(input: any) {
      if (input.expectedDraftRevision !== draftRevision) throw Object.assign(new Error('conflict'), {code:'STORE_DESIGN_CONFLICT'});
      previousPublished = published;
      published = draft;
      publishedRevision += 1;
      return {draft,published,previousPublished,draftRevision,publishedRevision,updatedAt:null,publishedAt:null};
    },
    async rollbackPublished(input: {expectedPublishedRevision:number}) {
      if (input.expectedPublishedRevision !== publishedRevision) throw Object.assign(new Error('conflict'), {code:'STORE_DESIGN_CONFLICT'});
      if (!previousPublished) throw new Error('missing previous');
      const current = published;
      published = previousPublished;
      previousPublished = current;
      publishedRevision += 1;
      return {draft,published,previousPublished,draftRevision,publishedRevision,updatedAt:null,publishedAt:null};
    },
  };
  return {svc:createStoreDesignMcpService(adapter as any), state:()=>({draft,published,previousPublished,draftRevision,publishedRevision})};
}

describe('MiniShop MCP StoreDesign commands', () => {
  it('reads current lifecycle', async () => {
    const {svc}=service();
    const result=await svc.getStoreDesign();
    assert.equal(result.draftRevision,3);
    assert.equal(result.publishedRevision,2);
  });

  it('updates supported theme without publishing', async () => {
    const {svc,state}=service();
    const before=state().published.themeId;
    const result=await svc.updateStoreTheme({themeId:'dark-modern'});
    assert.equal(result.changed,true);
    assert.equal(state().draft.themeId,'dark-modern');
    assert.equal(state().published.themeId,before);
  });

  it('rejects unsupported theme ids without changing the Draft', async () => {
    const {svc,state}=service();
    await assert.rejects(svc.updateStoreTheme({themeId:'unknown-theme' as any}), (e:unknown)=>e instanceof McpError&&e.code==='INVALID_SECTION');
    assert.equal(state().draftRevision,3);
    assert.equal(state().draft.themeId,'clean-minimal');
  });

  it('adds only registered sections supported by the target template', async () => {
    const {svc,state}=service();
    await svc.addStoreSection({template:'home',type:'rich-text'});
    assert.ok(state().draft.templates.home.sections.some((s:any)=>s.type==='rich-text'));
    await assert.rejects(svc.addStoreSection({template:'home',type:'product-gallery' as any}), (e:unknown)=>e instanceof McpError && e.code==='UNSUPPORTED_TEMPLATE');
    await assert.rejects(svc.addStoreSection({template:'home',type:'unknown' as any}), (e:unknown)=>e instanceof McpError && e.code==='INVALID_SECTION');
  });

  it('updates typed section settings, moves sections and protects non-removable sections', async () => {
    const {svc,state}=service();
    const hero=state().draft.templates.home.sections.find((s:any)=>s.type==='hero')!;
    await svc.updateStoreSection({template:'home',sectionId:hero.id,settings:{headline:'New headline'}});
    assert.equal((state().draft.templates.home.sections.find((s:any)=>s.id===hero.id) as any).settings.headline,'New headline');

    const firstId=state().draft.templates.home.sections[0]!.id;
    const lastIndex=state().draft.templates.home.sections.length-1;
    await svc.moveStoreSection({template:'home',sectionId:firstId,toIndex:lastIndex});
    assert.equal(state().draft.templates.home.sections[lastIndex]!.id,firstId);

    const protectedSection=state().draft.templates.product.sections.find((s:any)=>s.type==='product-info')!;
    await assert.rejects(svc.removeStoreSection({template:'product',sectionId:protectedSection.id}), (e:unknown)=>e instanceof McpError && e.code==='INVALID_SECTION');
  });

  it('publishes current Draft and rolls back Previous Published', async () => {
    const {svc,state}=service();
    await svc.updateStoreTheme({themeId:'dark-modern'});
    await svc.publishStore();
    assert.equal(state().published.themeId,'dark-modern');
    await svc.rollbackStoreDesign();
    assert.equal(state().published.themeId,'soft-elegant');
  });
});
