"""Loopback-only frontend. Exposes only public Firebase web configuration."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote
import argparse, json, os, re

ROOT=Path(__file__).resolve().parent
REPO=ROOT.parent.parent
PUBLIC={
 'NEXT_PUBLIC_FIREBASE_API_KEY':'apiKey', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN':'authDomain',
 'NEXT_PUBLIC_FIREBASE_PROJECT_ID':'projectId','NEXT_PUBLIC_FIREBASE_APP_ID':'appId',
 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET':'storageBucket','NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID':'messagingSenderId',
 'NEXT_PUBLIC_FIRESTORE_DATABASE':'databaseId'
}
def public_config():
 values={}
 # Read only an exact allowlist. Admin credentials and other env vars are never served.
 source=REPO/'apphosting.yaml'
 if source.exists():
  text=source.read_text()
  for key in PUBLIC:
   match=re.search(r'(?m)^\s*- variable: '+re.escape(key)+r'\s*\n\s*value:\s*([^\n#]+)',text)
   if match:values[key]=match.group(1).strip().strip('"\'')
 source=REPO/'.env.local'
 if source.exists():
  for line in source.read_text().splitlines():
   key,sep,value=line.partition('=')
   if sep and key.strip() in PUBLIC:values[key.strip()]=value.strip().strip('"\'')
 for key in PUBLIC:
  if key in os.environ:values[key]=os.environ[key]
 config={PUBLIC[key]:value for key,value in values.items() if value and value!='INSERIRE'}
 configured=all(config.get(key) for key in ['apiKey','authDomain','projectId','appId'])
 return {'configured':configured,'firebase':{k:v for k,v in config.items() if k!='databaseId'},'databaseId':config.get('databaseId','colletta')}

def catalog_payload():
 items=json.loads((REPO/'lib/dati/catalogo-amazon.json').read_text())
 bands=[]
 for band_id,label,minimum,maximum in re.findall(r'\{ id: "([^"]+)", etichetta: "([^"]+)", minCent: (\d+), maxCent: (\d+|Infinity) \}',(REPO/'lib/tipi.ts').read_text()):
  bands.append({'id':band_id,'label':label,'min':int(minimum),'max':None if maximum=='Infinity' else int(maximum)})
 if not bands:raise ValueError('Catalog price bands unavailable')
 affiliate=(REPO/'lib/dominio/amazon.ts').read_text()
 tag=re.search(r'TAG_AFFILIATO_AMAZON\s*=\s*"([^"\n]+)"',affiliate).group(1)
 disclosure=re.search(r'DICHIARAZIONE_AFFILIATO_AMAZON\s*=\s*"([^"\n]+)"',affiliate).group(1)
 ages=dict(re.findall(r'"(PRD-\d{3})":\s*"([BARD]+)"',(REPO/'lib/dati/eta-prodotti.ts').read_text()))
 age_keys={'B':'bambino','A':'adolescente','R':'ragazzo','D':'adulto'}
 allowed={'id','slug','nome','marca','prezzoCent','descrizione','perche','destinatari','temi','asin','urlEsterno','foto','rilevatoIl','sottocategoria'}
 public=[]
 for item in items:
  row={key:value for key,value in item.items() if key in allowed}
  row['eta']=[age_keys[c] for c in ages.get(item['id'],'')]
  public.append(row)
 return {'version':1,'items':public,'affiliateTag':tag,'affiliateDisclosure':disclosure,'priceBands':bands}

class GiftyHandler(SimpleHTTPRequestHandler):
 def log_message(self, format, *args):
  # Auth callback queries contain one-time credentials and must never enter logs.
  pass
 def end_headers(self):
  self.send_header('Cache-Control','no-store')
  self.send_header('X-Content-Type-Options','nosniff')
  self.send_header('Referrer-Policy','no-referrer')
  super().end_headers()
 def do_GET(self):
  path=unquote(urlsplit(self.path).path)
  if path=='/catalogo.json':
   body=json.dumps(catalog_payload(),ensure_ascii=False).encode();kind='application/json'
  elif path.startswith('/foto-prodotti/'):
   name=path.removeprefix('/foto-prodotti/')
   if not re.fullmatch(r'PRD-\d{3}\.(jpg|jpeg|png|webp)',name):self.send_error(404);return
   target=REPO/'public/foto-prodotti'/name
   if not target.is_file():self.send_error(404);return
   body=target.read_bytes();kind=self.guess_type(str(target))
  elif path=='/auth-config.json':
   body=json.dumps(public_config()).encode();kind='application/json'
  elif path=='/shared-auth.mjs':body=(REPO/'lib/auth/firebase-core.mjs').read_bytes();kind='text/javascript'
  elif path in ['/','/index.html','/accedi']:body=(ROOT/'index.html').read_bytes();kind='text/html'
  else:
   target=(ROOT/path.lstrip('/')).resolve()
   allowed=path in ['/app.js','/auth.js','/style.css','/catalog.mjs','/home-section.js','/home-section.css'] or (path.startswith('/assets/') and target.is_relative_to(ROOT/'assets') and target.suffix.lower() in {'.png','.jpg','.jpeg','.webp','.svg','.ttf','.woff','.woff2','.txt'})
   if not allowed or not target.is_file():self.send_error(404);return
   self.path=path
   return super().do_GET()
  self.send_response(200);self.send_header('Content-Type',kind+'; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)

def main():
 parser=argparse.ArgumentParser(description='Gifty locale')
 parser.add_argument('--port',type=int,default=4193)
 args=parser.parse_args()
 server=ThreadingHTTPServer(('127.0.0.1',args.port),partial(GiftyHandler,directory=str(ROOT)))
 print(f'Gifty: http://127.0.0.1:{args.port}',flush=True)
 try:server.serve_forever()
 except KeyboardInterrupt:server.server_close()
if __name__=='__main__':main()
