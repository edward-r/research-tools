// tools/ingest_reference.mjs
const parseKV=()=>Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const ensureDir=async(p)=>{const {mkdir}=await import('node:fs/promises'); const {dirname}=await import('node:path'); await mkdir(dirname(p),{recursive:true});};
const appendJsonl=async(file,obj)=>{const {appendFile}=await import('node:fs/promises'); await ensureDir(file); await appendFile(file, JSON.stringify(obj)+'\n','utf8');};
const print=(x)=>process.stdout.write((typeof x==='string'? x: JSON.stringify(x,null,2))+'\n');
const main=async()=>{
  const a=parseKV();
  const ref={ type:a.type||'ref', title:a.title||'(untitled)', author:a.author||'', year:a.year?+a.year:undefined, url:a.url||'', tags:a.tags||'', notes:a.notes||'', added_at:new Date().toISOString() };
  await appendJsonl('assets/metadata/references.jsonl', ref);
  print({ok:true, wrote:'assets/metadata/references.jsonl', ref});
};
main().catch(e=>{ console.error(e); process.exit(1); });
