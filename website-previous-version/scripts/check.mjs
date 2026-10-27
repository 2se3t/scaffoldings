import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('dist');
const config=JSON.parse(await readFile('site.config.json','utf8'));
const all=[];
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,item.name);item.isDirectory()?await walk(p):all.push(p);}}
await walk(root);
const pages=all.filter(p=>p.endsWith('index.html'));
assert.equal(pages.length,10,'Expected 10 language/service pages');
const titles=new Set();
for(const file of pages){const html=await readFile(file,'utf8');const relative=path.relative(root,file).replaceAll('\\','/').replace(/index\.html$/,'');
assert.equal((html.match(/<h1[ >]/g)||[]).length,1,relative+': single H1');
assert.match(html,relative.startsWith('kz/')?/<html lang="kk">/:/<html lang="ru">/);
const title=html.match(/<title>(.*?)<\/title>/)[1];assert(!titles.has(title),relative+': duplicate title');titles.add(title);
assert(html.includes(`rel="canonical" href="${config.origin}/${relative}"`),relative+': canonical');
assert.match(html,/hreflang="ru"/);assert.match(html,/hreflang="kk"/);
const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(schema['@context'],'https://schema.org');
assert.equal(schema['@graph'][0].name,'YugStroyMontazh');
for(const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)){const url=match[1];if(!url.startsWith('/'))continue;const [pathname,hash]=url.split('#');let local=path.join(root,pathname);const info=await stat(local).catch(()=>null);assert(info,`${relative}: missing asset/link ${url}`);if(info.isDirectory()){local=path.join(local,'index.html');await stat(local);}if(hash){const target=await readFile(local,'utf8');assert(target.includes(`id="${hash}"`),`${relative}: missing anchor ${url}`);}}
for(const m of html.matchAll(/<img\b([^>]+)>/g)){assert.match(m[1],/\balt="[^"]*"/);assert.match(m[1],/\bwidth="\d+"/);assert.match(m[1],/\bheight="\d+"/);}
assert(!html.includes('260 000')&&!html.includes('350 ₸')&&!html.includes('20+'),relative+': unverified claims');
assert(html.includes(config.publicLaunch?'index,follow,max-image-preview:large':'noindex,nofollow'));
}
const css=await readFile(path.join(root,'assets/styles.css'),'utf8');
for(const m of css.matchAll(/url\(['"]?(\/[^)'"\s]+)['"]?\)/g))await stat(path.join(root,m[1]));
const sitemap=await readFile(path.join(root,'sitemap.xml'),'utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,10);
const robots=await readFile(path.join(root,'robots.txt'),'utf8');assert(robots.includes(config.publicLaunch?'Allow: /':'Disallow: /'));
if(config.publicLaunch){assert(config.phone&&config.whatsapp,'Public launch requires real contact details');assert.match(config.whatsapp.replace(/\D/g,''),/^\d{10,15}$/);}
console.log(`PASS: ${pages.length} pages; internal links/anchors; canonical/hreflang; JSON-LD; images; local fonts; robots/sitemap; no invented rates or statistics.`);
