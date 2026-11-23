import {mkdirSync,existsSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
for(const dir of ['media-editor/data','media-editor/media'])mkdirSync(dir,{recursive:true});
if(!existsSync('media-editor/.env'))writeFileSync('media-editor/.env',`PAYLOAD_SECRET=${randomBytes(32).toString('hex')}\nDATABASE_URL=file:./data/editor.db\nNEXT_TELEMETRY_DISABLED=1\n`,{mode:0o600});
for(const args of [['ci','--prefix','media-editor','--no-audit','--no-fund'],['run','seed','--prefix','media-editor']]){
 const result=spawnSync('npm',args,{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
console.log('Local editor ready. Run npm run editor, then open http://127.0.0.1:5197/admin.');
