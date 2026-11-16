/* push.js — tolak (push) projek ke GitHub menggunakan token dalam fail .env
   Tiada pakej luar. Perlu: Node.js 18+ dan Git. Token TIDAK disimpan dalam .git/config. */
const {execFileSync}=require('child_process');
const fs=require('fs'),path=require('path');
const ROOT=__dirname;process.chdir(ROOT);

/* ---------- 1. Baca .env ---------- */
function loadEnv(){
  const f=path.join(ROOT,'.env');
  if(!fs.existsSync(f))die('Fail .env tiada. Salin .env.example kepada .env dan isi token.');
  const o={};
  for(const l of fs.readFileSync(f,'utf8').split(/\r?\n/)){
    const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if(m&&!l.trim().startsWith('#'))o[m[1]]=m[2].replace(/^["']|["']$/g,'');
  }return o;
}
const die=m=>{console.error('\n❌ '+m);process.exit(1)};
const E=loadEnv();
for(const k of ['GITHUB_TOKEN','GITHUB_USER','GITHUB_REPO'])if(!E[k]||/^ISI_/.test(E[k]))die(`${k} belum diisi dalam .env`);
const BRANCH=E.GITHUB_BRANCH||'main',TOKEN=E.GITHUB_TOKEN;
const REMOTE=`https://github.com/${E.GITHUB_USER}/${E.GITHUB_REPO}.git`;
const AUTH='Authorization: Basic '+Buffer.from('x-access-token:'+TOKEN).toString('base64');

/* ---------- 2. Pembantu git (token disorok daripada output) ---------- */
const mask=s=>String(s).split(TOKEN).join('***');
function git(args,{auth=false,soft=false}={}){
  const a=auth?['-c','http.extraheader='+AUTH,...args]:args;
  try{return execFileSync('git',a,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()}
  catch(e){if(soft)return null;
    const err=mask((e.stderr||'')+(e.stdout||'')||e.message);
    const x=new Error(err);x.stderr=err;throw x}
}
try{git(['--version'])}catch{die('Git tidak dipasang. Muat turun di https://git-scm.com')}

/* ---------- 3. Pengawal keselamatan: fail sulit mesti diabaikan ---------- */
const SULIT=['.env','kafa-db.json','*.db.json'];
let gi=fs.existsSync('.gitignore')?fs.readFileSync('.gitignore','utf8'):'';
const tambah=SULIT.filter(s=>!gi.split(/\r?\n/).map(x=>x.trim()).includes(s));
if(tambah.length){gi+=(gi.endsWith('\n')||!gi?'':'\n')+'# ditambah oleh push.js\n'+tambah.join('\n')+'\n';
  fs.writeFileSync('.gitignore',gi);console.log('🔒 .gitignore dikemas kini:',tambah.join(', '))}

/* ---------- 4. Sediakan repo ---------- */
if(!fs.existsSync('.git')){git(['init']);console.log('📁 Repo git dicipta')}
git(['checkout','-B',BRANCH],{soft:true});
if(E.GIT_NAME)git(['config','user.name',E.GIT_NAME]);
if(E.GIT_EMAIL)git(['config','user.email',E.GIT_EMAIL]);
if(!git(['config','user.name'],{soft:true})||!git(['config','user.email'],{soft:true}))
  die('Isi GIT_NAME dan GIT_EMAIL dalam .env');
git(['remote','remove','origin'],{soft:true});git(['remote','add','origin',REMOTE]);

/* Pastikan fail sulit tidak sedang dijejak */
for(const f of ['.env','kafa-db.json']){
  if(git(['ls-files','--error-unmatch',f],{soft:true})!==null){
    git(['rm','--cached','-q',f]);console.log(`⚠️  ${f} dibuang daripada penjejakan (fail asal kekal di PC).`);
    console.log('   Jika ia pernah di-push sebelum ini, ia MASIH ada dalam sejarah GitHub — tukar token / buang sejarah.');
  }}

/* ---------- 5. Commit ---------- */
const msg=process.argv.slice(2).join(' ')||'Kemas kini '+new Date().toLocaleString('sv-SE').slice(0,16);
git(['add','-A']);
const diff=git(['diff','--cached','--name-only']);
if(diff){console.log('📝 Fail berubah:\n   '+diff.split('\n').join('\n   '));git(['commit','-m',msg]);console.log('✅ Commit:',msg)}
else console.log('ℹ️  Tiada perubahan baharu untuk di-commit.');

/* ---------- 6. Push ---------- */
function push(){return git(['push','-u','origin',BRANCH],{auth:true})}
try{push()}
catch(e){
  if(/rejected|fetch first|non-fast-forward/i.test(e.stderr)){
    console.log('↻ Remote ada commit lain — cuba tarik (rebase) dahulu…');
    try{git(['pull','--rebase','origin',BRANCH],{auth:true});push()}
    catch(e2){die('Gagal selepas rebase:\n'+e2.stderr+'\nSelesaikan konflik secara manual.')}
  }else if(/401|403|Authentication|denied|not found/i.test(e.stderr))
    die('Pengesahan gagal. Semak token (kebenaran Contents: Read and write), nama pengguna & nama repo.\n'+e.stderr);
  else die(e.stderr);
}
console.log(`\n🚀 Berjaya push ke ${E.GITHUB_USER}/${E.GITHUB_REPO} (${BRANCH})`);
console.log(`🌐 https://${E.GITHUB_USER.toLowerCase()}.github.io/${E.GITHUB_REPO}/  (tunggu ~1 minit untuk Pages)`);
