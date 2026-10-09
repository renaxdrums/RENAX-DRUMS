const fs=require('node:fs'),path=require('node:path');
const http=require('node:http');
exports.install=async (context,testURL)=>{
 const root=process.env.NEURAL_TEST_ROOT;
 if(!root)throw new Error('Set NEURAL_TEST_ROOT to the development runtime/assets directory.');
 const link=path.join(__dirname,'_neural-assets');
 if(!fs.existsSync(link))fs.symlinkSync(path.join(root,'neural-assets'),link,'dir');
 const server=http.createServer((req,res)=>{
  const relative=new URL(req.url,'http://localhost').pathname;
  const file=path.join(root,'neural-assets',relative);
  res.setHeader('Access-Control-Allow-Origin','*');
  if(!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',file.endsWith('.json')?'application/json':'application/octet-stream');
  res.setHeader('Content-Length',fs.statSync(file).size);fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const assetURL=testURL+'/tests/_neural-assets';
 exports.assetURL=assetURL;
 await context.route('https://cdn.jsdelivr.net/**',route=>{
  const url=new URL(route.request().url());let file;
  if(url.pathname.includes('/@huggingface/transformers@'))file=path.join(root,'neural-runtime/node_modules/@huggingface/transformers/dist',url.pathname.split('/').at(-1));
  else if(url.pathname.includes('/onnxruntime-web@'))file=path.join(root,'neural-runtime/node_modules/onnxruntime-web/dist',url.pathname.split('/').at(-1));
  else file=path.join(__dirname,'../prototypes/amorce',url.pathname.split('/').at(-1));
  return route.fulfill({headers:{'access-control-allow-origin':'*'},contentType:file.endsWith('.wasm')?'application/wasm':/\.(mjs|js)$/.test(file)?'text/javascript':'application/octet-stream',body:fs.readFileSync(file)});
 });
 await context.route('https://huggingface.co/**',route=>{
  const url=new URL(route.request().url()),relative=url.pathname.split('/resolve/')[1]?.split('/').slice(1).join('/');
  if(!relative)return route.abort();
  return route.fulfill({status:307,headers:{location:assetURL+'/'+relative,'access-control-allow-origin':'*'},body:''});
 });
 return ()=>{server.close();fs.unlinkSync(link);};
};
