import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {createDefaultStoreDesign} from '../src/domain/storeDesign/index.ts';
import {createStoreDesignMcpService} from '../api/mcp/store-design.ts';

describe('MiniShop MCP lifecycle E2E contract',()=>{
  it('auth-like seller flow mutates Draft, publishes buyer state, then rolls back',async()=>{
    let draft=createDefaultStoreDesign('clean-minimal');
    let published=createDefaultStoreDesign('soft-elegant');
    let previousPublished=createDefaultStoreDesign('street-bold');
    let draftRevision=1,publishedRevision=1;
    const adapter:any={
      async loadOwnStoreDesign(){return{draft,published,previousPublished,draftRevision,publishedRevision,updatedAt:null,publishedAt:null};},
      async saveDraft({expectedRevision,document}:any){assert.equal(expectedRevision,draftRevision);draft=document;draftRevision++;return{revision:draftRevision,document:draft};},
      async publishDraft({expectedDraftRevision}:any){assert.equal(expectedDraftRevision,draftRevision);previousPublished=published;published=draft;publishedRevision++;return{draft,published,previousPublished,draftRevision,publishedRevision,updatedAt:null,publishedAt:null};},
      async rollbackPublished(){const current=published;published=previousPublished;previousPublished=current;publishedRevision++;return{draft,published,previousPublished,draftRevision,publishedRevision,updatedAt:null,publishedAt:null};},
    };
    const store=createStoreDesignMcpService(adapter);
    assert.equal((await store.getStoreDesign()).published.themeId,'soft-elegant');
    await store.updateStoreTheme({themeId:'dark-modern'});
    await store.addStoreSection({template:'home',type:'rich-text'});
    assert.equal(published.themeId,'soft-elegant');
    await store.publishStore();
    assert.equal(published.themeId,'dark-modern');
    assert.ok(published.templates.home.sections.some((s:any)=>s.type==='rich-text'));
    await store.rollbackStoreDesign();
    assert.equal(published.themeId,'soft-elegant');
  });
});
