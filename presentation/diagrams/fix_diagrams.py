import os, matplotlib; matplotlib.use("Agg")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets"); FONTS = os.path.join(ROOT, "fonts")
os.makedirs(ASSETS, exist_ok=True)
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyArrowPatch
from matplotlib import font_manager as fm
for f in [os.path.join(FONTS,"Inter.ttf"), os.path.join(FONTS,"SourceSerif4.ttf")]: fm.fontManager.addfont(f)
plt.rcParams["font.family"]="Inter"
ABYSS="#0A1628"; TEAL="#00C9B1"; AMBER="#F59E0B"; BONE="#FAF7F2"
SLATE="#5B6B7C"; MIST="#D9E1E7"; WHITE="#FFFFFF"; MIDNAVY="#16324B"

def newfig():
    fig=plt.figure(figsize=(16,9),dpi=180)
    ax=fig.add_axes([0,0,1,1]); ax.set_xlim(0,16); ax.set_ylim(0,9); ax.axis("off")
    fig.patch.set_facecolor(WHITE); ax.set_facecolor(WHITE)
    return fig,ax

def mk(ax,B,L):
    def box(x,y,w,h,fc,ec,lines,tc,fs=9.5,lw=1.2,dashed=False):
        ax.add_patch(Rectangle((x,y),w,h,facecolor=fc,edgecolor=ec,linewidth=lw,
                     linestyle=(0,(3,2)) if dashed else "solid"))
        B.append((lines[0],x,y,w,h)); n=len(lines); top=y+h/2+(n-1)*0.19
        for i,ln in enumerate(lines):
            t=ax.text(x+w/2,top-i*0.38,ln,ha="center",va="center",color=tc,
                      fontsize=fs if i==0 else fs-1.6,fontweight="bold" if i==0 else "normal")
            L.append((lines[0],ln,t,x,w))
    def arrow(x1,y1,x2,y2,color=SLATE,lw=1.6,ls="-"):
        ax.add_patch(FancyArrowPatch((x1,y1),(x2,y2),arrowstyle="-|>",mutation_scale=12,
                     color=color,lw=lw,linestyle=ls,shrinkA=0,shrinkB=0))
    return box,arrow

def qa(fig,ax,B,L,name):
    def ov(a,b):
        _,x1,y1,w1,h1=a; _,x2,y2,w2,h2=b
        return not (x1+w1<=x2 or x2+w2<=x1 or y1+h1<=y2 or y2+h2<=y1)
    col=[f"{a[0]!r}x{b[0]!r}" for i,a in enumerate(B) for b in B[i+1:] if ov(a,b)]
    fig.canvas.draw(); r=fig.canvas.get_renderer(); inv=ax.transData.inverted()
    sp=[]
    for nm,ln,t,bx,bw in L:
        e=t.get_window_extent(r); (a0,_),(a1,_)=inv.transform([(e.x0,e.y0),(e.x1,e.y1)])
        if a0<bx+0.03 or a1>bx+bw-0.03: sp.append(f"{nm}:{ln!r}")
    print(f"{name}: collisions={col or 'none'} spills={sp or 'none'}")

# ---------------- TECHNICAL ----------------
fig,ax=newfig(); B=[];L=[]; box,arrow=mk(ax,B,L)
ax.add_patch(Rectangle((0.4,8.2),15.2,0.55,facecolor=BONE,edgecolor=MIST,lw=1.0))
ax.text(8.0,8.47,"main.py orchestration   ·   per-document isolation   ·   spend cap   ·   structured logs",
        ha="center",va="center",color=ABYSS,fontsize=11.5)
box(0.6,5.9,1.9,1.5,WHITE,TEAL,["Federal Register","public API","CMS · FDA"],ABYSS,fs=9.5)
box(2.95,5.9,2.1,1.5,ABYSS,ABYSS,["1  CLASSIFY","Haiku 4.5","priority + routing"],WHITE,fs=9.5)
box(5.5,5.9,3.0,1.5,MIDNAVY,MIDNAVY,["2  ANALYZE","Materiality · Process Impact · Gap","Sonnet 5 ×3 · sequential"],WHITE,fs=9.5)
box(8.95,5.9,2.6,1.5,ABYSS,ABYSS,["3  EVALUATE","Opus 4.8 · Agent SDK","scores · confidence · flags"],WHITE,fs=9.5)
box(11.95,5.9,2.1,1.5,ABYSS,ABYSS,["4  SYNTHESIZE","Sonnet 5","briefing JSON"],WHITE,fs=9.5)
box(14.45,6.05,1.0,1.2,WHITE,MIST,["DOCX","PPTX","always"],ABYSS,fs=8)
box(5.5,4.35,3.0,1.0,BONE,MIST,["Cached document context","one write · reads at 1/10 price"],SLATE,fs=8.5)
ax.plot([0.6,15.45],[3.95,3.95],color=MIST,lw=1.0)
ax.text(0.6,3.62,"AUTONOMY DECISION AND GATING",color=SLATE,fontsize=9.5,fontweight="bold")
box(8.95,1.75,2.6,1.5,WHITE,AMBER,["compute_tier()","deterministic code","tier 3 checked first"],ABYSS,fs=9)
box(11.95,1.75,2.1,1.5,AMBER,AMBER,["HUMAN KEY","RIA_EVALUATOR_","APPROVED=1"],ABYSS,fs=8.5)   # was WHITE: 1.98:1
box(14.45,2.5,1.0,0.75,WHITE,MIST,["Notion"],ABYSS,fs=8)
box(14.45,1.6,1.0,0.75,WHITE,MIST,["Gmail"],ABYSS,fs=8)
arrow(2.5,6.65,2.95,6.65); arrow(5.05,6.65,5.5,6.65); arrow(8.5,6.65,8.95,6.65)
arrow(11.55,6.65,11.95,6.65); arrow(14.05,6.65,14.45,6.65); arrow(7.0,5.35,7.0,5.9)
arrow(10.25,5.9,10.25,3.25,ABYSS); arrow(11.55,2.5,11.95,2.5,AMBER)
arrow(13.0,5.9,13.0,3.25,AMBER,ls=(0,(4,3)))
arrow(14.05,2.65,14.45,2.8,AMBER); arrow(14.05,2.35,14.45,2.15,AMBER)
lx=0.6
for c,ec,lbl in [(ABYSS,ABYSS,"model judgment"),(WHITE,MIST,"deterministic code / artifacts"),
                 (AMBER,AMBER,"human gate"),(WHITE,TEAL,"external service")]:
    ax.add_patch(Rectangle((lx,0.75),0.3,0.3,facecolor=c,edgecolor=ec,lw=1.2))
    ax.text(lx+0.42,0.9,lbl,va="center",color=SLATE,fontsize=9.5); lx+=0.42+len(lbl)*0.115+0.75
ax.text(0.6,0.25,"Models write opinions. Code applies the rules. A human holds the key.",color=SLATE,fontsize=10,style="italic")
qa(fig,ax,B,L,"technical"); fig.savefig(os.path.join(ASSETS,"ria_arch_brand.png"),dpi=180,facecolor=WHITE); plt.close(fig)

# ---------------- LOGICAL ----------------
fig,ax=newfig(); B=[];L=[]; box,arrow=mk(ax,B,L); T=[]
def band(y,t): ax.text(0.5,y,t,color=SLATE,fontsize=9,fontweight="bold"); T.append(t)
lx=0.5
for fc,ec,lbl in [(ABYSS,ABYSS,"judgment capability"),(WHITE,MIST,"deterministic capability"),
                  (WHITE,AMBER,"control point"),(AMBER,AMBER,"human authority"),(WHITE,TEAL,"port (an interface, not a product)")]:
    ax.add_patch(Rectangle((lx,8.62),0.26,0.26,facecolor=fc,edgecolor=ec,lw=1.1))
    ax.text(lx+0.36,8.75,lbl,va="center",color=SLATE,fontsize=8.5); T.append(lbl)
    lx+=0.36+len(lbl)*0.098+0.55
band(8.45,"INBOUND PORTS")
for x,name,sub in [(0.5,"Regulatory Source Port","publication feed"),(4.25,"Policy Context Port","internal policy corpus"),
                   (8.0,"Reasoning Port","structured judgment"),(11.75,"Precedent Port","prior dispositions, read-only")]:
    box(x,7.05,3.4,1.05,WHITE,TEAL,[name,sub],ABYSS,fs=9.5); T+=[name,sub]
band(6.85,"ANALYSIS CAPABILITIES")
for a in [(0.5,2.2,WHITE,MIST,["Source","Monitoring"],ABYSS,9),(2.95,1.9,ABYSS,ABYSS,["Triage"],WHITE,9.5)]:
    box(a[0],5.35,a[1],1.1,a[2],a[3],a[4],a[5],fs=a[6]); T+=a[4]
for y,lbl in [(5.95,"Materiality Assessment"),(5.35,"Process Mapping"),(4.75,"Gap Analysis")]:
    box(5.1,y,3.3,0.5,ABYSS,ABYSS,[lbl],WHITE,fs=8.5); T.append(lbl)
box(8.65,5.35,2.3,1.1,ABYSS,ABYSS,["Quality","Evaluation"],WHITE,fs=9); T+=["Quality","Evaluation"]
box(11.2,5.35,2.0,1.1,ABYSS,ABYSS,["Synthesis"],WHITE,fs=9.5); T.append("Synthesis")
box(13.45,5.35,1.7,1.1,WHITE,MIST,["Internal","artifacts"],ABYSS,fs=8.5); T+=["Internal","artifacts"]
ax.plot([3.9,12.2],[6.75,6.75],color=TEAL,lw=1.1,linestyle=(0,(4,3)),alpha=0.9)
arrow(9.7,7.05,9.7,6.78,TEAL,1.3,(0,(3,2)))
for tx in [3.9,6.75,9.8,12.2]: arrow(tx,6.75,tx,6.47,TEAL,1.1,(0,(2,2)))
ax.plot([4.97,4.97],[4.9,6.3],color=SLATE,lw=1.0)
for cy in [6.2,5.6,5.0]: arrow(4.97,cy,5.1,cy)
ax.plot([8.52,8.52],[4.9,6.3],color=SLATE,lw=1.0)
for cy in [6.2,5.6,5.0]: arrow(8.4,cy,8.52,cy)
arrow(8.52,5.9,8.65,5.9); arrow(2.7,5.9,2.95,5.9); arrow(4.85,5.9,4.97,5.9)
arrow(10.95,5.9,11.2,5.9); arrow(13.2,5.9,13.45,5.9)
arrow(2.2,7.05,1.6,6.45); arrow(5.95,7.05,6.75,6.45); arrow(13.45,7.05,10.3,6.45,SLATE,1.3,(0,(3,2)))
band(4.62,"AUTHORIZATION")
box(8.65,3.05,2.3,1.25,WHITE,AMBER,["Autonomy","Decision"],ABYSS,fs=9); T+=["Autonomy","Decision"]
box(11.2,3.05,2.0,1.25,WHITE,AMBER,["Gated","Execution"],ABYSS,fs=9); T+=["Gated","Execution"]
box(13.45,3.75,1.7,0.55,WHITE,TEAL,["Work Item Port"],ABYSS,fs=8); T.append("Work Item Port")
box(13.45,3.05,1.7,0.55,WHITE,TEAL,["Notification Port"],ABYSS,fs=8); T.append("Notification Port")
arrow(9.8,5.35,9.8,4.3,ABYSS); arrow(10.95,3.68,11.2,3.68,AMBER)
arrow(12.2,5.35,12.2,4.3,AMBER,1.5,(0,(4,3)))
arrow(13.2,4.05,13.45,4.03,AMBER); arrow(13.2,3.35,13.45,3.33,AMBER)
band(2.62,"CROSS-CUTTING CAPABILITIES")
box(0.5,1.25,3.0,1.05,WHITE,MIST,["Audit & Observability","every decision, with inputs"],ABYSS,fs=9); T+=["Audit & Observability","every decision, with inputs"]
box(3.75,1.25,2.2,1.05,WHITE,TEAL,["Audit Sink Port"],ABYSS,fs=8.5); T.append("Audit Sink Port")
box(6.3,1.25,2.6,1.05,WHITE,MIST,["Cost Governance","meter + ceiling"],ABYSS,fs=9); T+=["Cost Governance","meter + ceiling"]
box(11.2,1.25,2.0,1.05,AMBER,AMBER,["Human","Authority"],ABYSS,fs=9); T+=["Human","Authority"]   # was WHITE: 1.98:1
arrow(3.5,1.78,3.75,1.78); arrow(12.2,2.3,12.2,3.05,AMBER)
ax.text(0.5,0.62,"Audit & Observability records every band. No vendor, product, or model name appears in this layer: those live in the technical architecture.",
        color=SLATE,fontsize=9,style="italic")
qa(fig,ax,B,L,"logical")
BAN=["claude","haiku","sonnet","opus","anthropic","notion","gmail","google","drive","sharepoint",
     "servicenow","jira","outlook","python","bedrock","vertex","federal register","cms","fda"]
blob=" ".join(T).lower(); hits=[b for b in BAN if b in blob]
print("logical vendor gate:", "FAIL "+str(hits) if hits else "PASS")
fig.savefig(os.path.join(ASSETS,"ria_logical.png"),dpi=180,facecolor=WHITE); plt.close(fig)
