const FEEDS = [
  {name:'Google News · 全球科技', url:'https://news.google.com/rss/search?q=AI+OR+robotics+OR+technology&hl=en-US&gl=US&ceid=US:en'},
  {name:'Google News · 汽车', url:'https://news.google.com/rss/search?q=automotive+OR+electric+vehicles+OR+Tesla&hl=en-US&gl=US&ceid=US:en'},
  {name:'Google News · 国际', url:'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en'},
  {name:'BBC News', url:'https://feeds.bbci.co.uk/news/world/rss.xml'},
  {name:'NPR News', url:'https://feeds.npr.org/1004/rss.xml'}
];
const xmlDecode = s => (s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))).replace(/\s+/g,' ').trim();
function tag(block,name){const m=block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,'i'));return m?xmlDecode(m[1]):''}
function items(xml,source){return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(m=>{let b=m[1],link=tag(b,'link'),title=tag(b,'title'),date=tag(b,'pubDate'),desc=tag(b,'description');if(!link||!title)return null;let ts=Date.parse(date);return {title,description:desc.slice(0,700),url:link,publishedAt:Number.isFinite(ts)?new Date(ts).toISOString():new Date().toISOString(),source}}).filter(Boolean)}
export async function onRequestGet({request}){
 const headers={'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=300','access-control-allow-origin':'*'};
 const results=await Promise.allSettled(FEEDS.map(async f=>{const r=await fetch(f.url,{headers:{'user-agent':'HotspotIntelligenceMVP/1.0 (RSS reader)'},cf:{cacheTtl:300,cacheEverything:true}});if(!r.ok)throw new Error(`${f.name}: HTTP ${r.status}`);return items(await r.text(),f.name)}));
 let all=[];let errors=[];for(let i=0;i<results.length;i++){const r=results[i];if(r.status==='fulfilled')all.push(...r.value);else errors.push({source:FEEDS[i].name,error:String(r.reason).slice(0,150)});}
 const seen=new Set();all=all.filter(x=>{const k=x.title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g,'').slice(0,100);if(!k||seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,100);
 return new Response(JSON.stringify({updatedAt:new Date().toISOString(),items:all,sourceStatus:{configured:FEEDS.length,successful:FEEDS.length-errors.length,errors}}),{headers});
}
