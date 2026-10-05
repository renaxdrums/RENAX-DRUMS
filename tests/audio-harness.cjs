const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
exports.start=async()=>{
 let server,url=process.env.TEST_URL;
 if(!url){server=http.createServer((req,res)=>{const root=path.resolve(__dirname,'..');let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file===root)file=path.join(root,'index.html');if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.wav')?'audio/wav':'application/octet-stream');res.end(b);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port;}
 const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'}),headless:true,args:['--autoplay-policy=no-user-gesture-required']});return {browser,server,url};
};
exports.save=(name,data)=>{const dir=process.env.TEST_OUTPUT_DIR||path.join(__dirname,'results');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,name),JSON.stringify(data,null,2)+'\n');};
