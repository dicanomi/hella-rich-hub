import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {renderMetadata} from './metadata-html.mjs';

const baseEnv={...process.env};
delete baseEnv.VITE_SITE_URL;
delete baseEnv.VITE_ALLOW_INDEXING;
function build(env={},mode='release'){
 return spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build','--mode',mode],{env:{...baseEnv,...env},encoding:'utf8'});
}
function succeeds(result){assert.equal(result.status,0,result.stderr || result.stdout);}
try {
 for(const origin of ['http://localhost:5190','https://127.0.0.1','https://[::1]','https://192.168.1.1','https://ratioclub.com/nested/','https://example.invalid@invalid.example','http://ratioclub.com']){
  assert.notEqual(build({VITE_SITE_URL:origin}).status,0,`Must reject unsafe/unsupported release origin: ${origin}`);
 }
 succeeds(build({VITE_SITE_URL:'https://ratioclub.com'}));
 assert.match(readFileSync('dist/index.html','utf8'),/name="robots" content="noindex, nofollow"/);
 assert.match(readFileSync('dist/robots.txt','utf8'),/Disallow: \/\n/);
 assert.ok(!readdirSync('dist/assets').some(name=>/HeroOptionsReview|HeroParticleReview|HeroImageReview|WireframeReview|GraphReview|MotionReview/.test(name)),'Release must exclude experiment chunks');
 succeeds(build({VITE_SITE_URL:'https://ratioclub.com',VITE_ALLOW_INDEXING:'true'}));
 for(const route of ['index','solutions','about','contact']){
  const html=readFileSync(`dist/${route}.html`,'utf8');
  assert.match(html,/name="robots" content="index, follow"/);
  assert.match(html,/<main[ >]/);
  assert.match(html,/<h1[ >]/);
  assert.ok(!html.includes('/src/assets/'));
  const schema=JSON.parse(html.match(/<script id="site-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema['@graph'][0].name,'RatioClub');
  assert.match(html,/rel="canonical" href="https:\/\/ratioclub.com\//);
 }
 for(const route of ['privacy-notice','terms-and-conditions','404'])assert.match(readFileSync(`dist/${route}.html`,'utf8'),/name="robots" content="noindex, nofollow"/);
 assert.match(readFileSync('dist/llms.txt','utf8'),/https:\/\/ratioclub.com\/solutions/);
 const sitemap=readFileSync('dist/sitemap.xml','utf8');
 assert.equal((sitemap.match(/<url>/g)||[]).length,4);
 assert.ok(!sitemap.includes('privacy-notice'));
 assert.match(readFileSync('dist/_headers','utf8'),/frame-src 'none'/);
 assert.match(readFileSync('dist/404.html','utf8'),/Signal Down/);
 const escaped=renderMetadata('<html><head></head></html>','/','https://ratioclub.com');
 assert.match(escaped,/Consulting &amp; AI/);
 const bytes=directory=>readdirSync(directory,{withFileTypes:true}).reduce((total,entry)=>total+(entry.isDirectory()?bytes(`${directory}/${entry.name}`):statSync(`${directory}/${entry.name}`).size),0);
 console.log(`Release bundle: ${bytes('dist')} bytes in all static files.`);
 console.log('Release configuration checks passed: invalid origins rejected, preview protected, release routes and indexing verified.');
} finally {
 succeeds(build({},'release'));
 console.log('Restored official-domain release build with indexing disabled.');
}
