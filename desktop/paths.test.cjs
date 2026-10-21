const {test}=require('node:test');const assert=require('node:assert/strict');const path=require('node:path');const {resolveAsset}=require('./paths.cjs');
const root=path.resolve('dist');
test('desktop origin serves bundled root and font assets',()=>{assert.equal(resolveAsset(root,'craftnor://studio/'),path.join(root,'index.html'));assert.equal(resolveAsset(root,'craftnor://studio/fonts/telugu.ttf'),path.join(root,'fonts/telugu.ttf'));});
test('desktop protocol rejects origins and encoded traversal',()=>{for(const url of ['https://studio/','craftnor://other/','craftnor://studio/%2e%2e%2fsecret','craftnor://studio/%5csecret','craftnor://studio/%00'])assert.throws(()=>resolveAsset(root,url));});
