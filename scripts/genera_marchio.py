# Genera gli asset del marchio Gifty da marchio/gifty-originale.png, con la sola libreria standard.
# uso: python3 -I scripts/genera_marchio.py marchio/gifty-originale.png public/logo   (poi: cp public/logo/gifty-icona.png app/icon.png)
import struct, sys, zlib
def leggi(percorso):
    d=open(percorso,'rb').read(); assert d[:8]==b'\x89PNG\r\n\x1a\n'
    i=8; idat=b''; info=None; plte=None; trns=None
    while i<len(d):
        n,=struct.unpack('>I',d[i:i+4]); t=d[i+4:i+8]; c=d[i+8:i+8+n]; i+=12+n
        if t==b'IHDR': info=struct.unpack('>IIBBBBB',c)
        elif t==b'IDAT': idat+=c
        elif t==b'PLTE': plte=c
        elif t==b'tRNS': trns=c
    w,h,bd,ct,_,_,il=info; assert bd==8 and il==0, info
    canali={6:4,2:3,0:1,4:2,3:1}[ct]; raw=zlib.decompress(idat); stride=w*canali
    out=bytearray(); prec=bytearray(stride); p=0
    for y in range(h):
        f=raw[p]; p+=1; riga=bytearray(raw[p:p+stride]); p+=stride
        for x in range(stride):
            a=riga[x-canali] if x>=canali else 0; b=prec[x]; c=prec[x-canali] if x>=canali else 0
            if f==1: riga[x]=(riga[x]+a)&255
            elif f==2: riga[x]=(riga[x]+b)&255
            elif f==3: riga[x]=(riga[x]+((a+b)>>1))&255
            elif f==4:
                pp=a+b-c; pa=abs(pp-a); pb=abs(pp-b); pc=abs(pp-c)
                riga[x]=(riga[x]+(a if pa<=pb and pa<=pc else b if pb<=pc else c))&255
        out+=riga; prec=riga
    px=[]
    for k in range(0,len(out),canali):
        if ct==6: px.append(tuple(out[k:k+4]))
        elif ct==2: px.append(tuple(out[k:k+3])+(255,))
        else: raise SystemExit("tipo colore non gestito %d"%ct)
    return w,h,px
def scrivi(percorso,w,h,px):
    raw=bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w): raw+=bytes(px[y*w+x])
    def ch(t,c): return struct.pack('>I',len(c))+t+c+struct.pack('>I',zlib.crc32(t+c)&0xffffffff)
    open(percorso,'wb').write(b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+ch(b'IDAT',zlib.compress(bytes(raw),9))+ch(b'IEND',b''))
from collections import deque
SRC, OUT = sys.argv[1], sys.argv[2]
w,h,px = leggi(SRC)
px = [list(p) for p in px]

# 1. aloni: l'alfa molto bassa ai bordi è rumore del ritaglio
for p in px:
    if p[3] < 40: p[3] = 0
# 2. puntini isolati: componenti connesse piccole (il puntino della «i» è molto più grande)
vis = bytearray(w*h); tolti = 0
for s in range(w*h):
    if vis[s] or px[s][3] == 0: continue
    comp=[s]; vis[s]=1; q=deque([s])
    while q:
        k=q.popleft(); x,y=k%w,k//w
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx,ny=x+dx,y+dy
            if 0<=nx<w and 0<=ny<h:
                n=ny*w+nx
                if not vis[n] and px[n][3]>0: vis[n]=1; q.append(n); comp.append(n)
    if len(comp) < 400:
        for k in comp: px[k][3]=0
        tolti += 1
print("componenti piccole tolte:", tolti)

def bbox(x0,x1):
    xs=[];ys=[]
    for y in range(h):
        for x in range(x0,x1):
            if px[y*w+x][3]>0: xs.append(x); ys.append(y)
    return min(xs),max(xs),min(ys),max(ys)

def ritaglia(x0,x1,y0,y1,margine,quadrato=False):
    W=x1-x0+1+2*margine; H=y1-y0+1+2*margine
    if quadrato: L=max(W,H); ox=(L-W)//2; oy=(L-H)//2; W=H=L
    else: ox=oy=0
    out=[[0,0,0,0] for _ in range(W*H)]
    for y in range(y0,y1+1):
        for x in range(x0,x1+1):
            out[(y-y0+margine+oy)*W+(x-x0+margine+ox)]=px[y*w+x][:]
    return W,H,out

def riduci(W,H,src,nw,nh):
    # media a scatola su alfa premoltiplicato: i bordi non prendono un alone scuro
    out=[]
    for oy in range(nh):
        sy0=oy*H//nh; sy1=max(sy0+1,(oy+1)*H//nh)
        for ox in range(nw):
            sx0=ox*W//nw; sx1=max(sx0+1,(ox+1)*W//nw)
            r=g=b=a=0; n=0
            for y in range(sy0,sy1):
                riga=y*W
                for x in range(sx0,sx1):
                    p=src[riga+x]; al=p[3]
                    r+=p[0]*al; g+=p[1]*al; b+=p[2]*al; a+=al; n+=1
            out.append((r//a,g//a,b//a,a//n) if a else (0,0,0,0))
    return out

def schiarisci_verde(src):
    # il verde diventa chiaro (#E7EFEA), l'arancio resta: per i fondi verde scuro delle anteprime social
    out=[]
    for r,g,b,a in src:
        out.append((0xE7,0xEF,0xEA,a) if a and g>r else (r,g,b,a))
    return out

X0,X1,Y0,Y1 = bbox(0,w)
print("disegno:",X0,X1,Y0,Y1)
# fra l'icona e la «G» c'è una fascia di colonne vuote: l'icona finisce lì
vuote=[x for x in range(X0,X1) if all(px[y*w+x][3]==0 for y in range(Y0,Y1+1))]
taglio=next(x for x in vuote if x>X0+200)
print("l'icona finisce alla colonna", taglio)

# logo completo, alto 120 px (in pagina va a 28-32 px: resta nitido sugli schermi densi)
W,H,lock=ritaglia(X0,X1,Y0,Y1,6)
nh=120; nw=round(W*nh/H)
scrivi(f"{OUT}/gifty.png",nw,nh,riduci(W,H,lock,nw,nh)); print("gifty.png",nw,nh)

# icona quadrata 256
ix0,ix1,iy0,iy1=bbox(X0,taglio)
W,H,ico=ritaglia(ix0,ix1,iy0,iy1,12,quadrato=True)
ico256=riduci(W,H,ico,256,256)
scrivi(f"{OUT}/gifty-icona.png",256,256,ico256)
scrivi(f"{OUT}/gifty-icona-chiara.png",256,256,schiarisci_verde(ico256))
print("icone 256x256")
