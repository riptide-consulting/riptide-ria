import re
exec_src = open('build_deck.js').read()
tech_src = open('build_tech_deck.js').read()

def blocks(src):
    parts = re.split(r"\n(?=// \S+ ── )", src)
    return {m.group(1): p for p in parts if (m := re.match(r"// (\S+) ── ", p))}
EX, TE = blocks(exec_src), blocks(tech_src)
for k in ['2','3','4','5','6','7','8','9','10','11','12']: assert k in EX, f"EX missing {k}"
for k in ['2','3','4','5','6','6b','7','8','9','10','11','12','13']: assert k in TE, f"TE missing {k}"

def prep(block, source, number=True):
    b = re.sub(r"\blet\s+s\s*=\s*p\.addSlide\(\)", "s=p.addSlide()", block)
    if source == "exec": b = b.replace("titleBar(", "titleBarX(")
    def add_num(m):
        bg = m.group(1); color = '"7FA6BC"' if bg=="DARK_BG" else "MUTE"
        return (f"s=p.addSlide(); s.background={bg};"
                + (f' s.slideNumber={{x:12.82,y:7.1,w:0.42,h:0.3,fontFace:BODY_F,fontSize:9,color:{color}}};' if number else ""))
    b = re.sub(r"s\s*=\s*p\.addSlide\(\);\s*\n?\s*s\.background\s*=\s*(DARK_BG|LIGHT_BG);", add_num, b)
    b = re.sub(r"p\.writeFile\([\s\S]*$", "", b)
    return b.rstrip() + "\n"

header = tech_src.split("// 1 ── TITLE")[0]
header += "\n" + re.search(r"function num\(s[\s\S]*?\n}\n", exec_src).group(0)
header += "\n" + re.search(r"function titleBar\(s[\s\S]*?\n}\n", exec_src).group(0).replace("function titleBar(","function titleBarX(") + "\n"

NEW = {}
NEW['M1'] = open('slide_M1.js').read()
NEW['M2'] = open('slide_M2.js').read()
NEW['M9'] = open('slide_M9.js').read()
NEW['M10'] = open('slide_M10.js').read()
NEW['M11'] = open('slide_M11.js').read()
NEW['M12'] = open('slide_M12.js').read()
NEW['M14'] = open('slide_M14.js').read()
NEW['M16'] = open('slide_M16.js').read()
NEW['M19'] = open('slide_M19.js').read()

close = prep(EX['12'], "exec")
anchor = 's.addShape("line", { x: 0.72, y: 5.5, w: 4.2, h: 0, line: { color: TEAL, width: 1.5 } });'
assert anchor in close, "close anchor missing"
close = close.replace(anchor,
 's.addText("github.com/riptide-consulting/riptide-ria   ·   docs/ENTERPRISE-FAQ.md   ·   docs/ARCHITECTURE.md",{x:0.72,y:5.05,w:11.9,h:0.4,fontFace:MONO_F,fontSize:12,color:"BFD9E8",margin:0});\n '+anchor.replace("y: 5.5","y: 5.62"))

order = [NEW['M1'], NEW['M2'],
    prep(EX['2'],"exec"),prep(EX['3'],"exec"),prep(EX['4'],"exec"),
    prep(EX['5'],"exec"),prep(EX['6'],"exec"),prep(EX['7'],"exec"),
    NEW['M9'],NEW['M10'],NEW['M11'],NEW['M12'],
    prep(EX['10'],"exec"),NEW['M14'],prep(EX['9'],"exec"),NEW['M16'],
    prep(EX['8'],"exec"),prep(EX['11'],"exec"),
    NEW['M19'],
    prep(TE['2'],"tech"),prep(TE['3'],"tech"),prep(TE['4'],"tech"),
    prep(TE['5'],"tech"),prep(TE['6'],"tech"),prep(TE['6b'],"tech"),
    prep(TE['7'],"tech"),prep(TE['8'],"tech"),prep(TE['9'],"tech"),
    prep(TE['10'],"tech"),prep(TE['11'],"tech"),prep(TE['12'],"tech"),
    prep(TE['13'],"tech"),close]

footer='\np.writeFile({fileName:"/home/claude/Riptide-RIA-Master-Deck.pptx"}).then(()=>console.log("master written: "+p.slides.length+" slides"));\n'
master = header+"\n"+"\n".join(order)+footer
assert master.count("let s=p.addSlide()")==1, f"let-s={master.count(chr(108)+'et s=p.addSlide()')}"
assert master.count("function titleBar(") == 1, "titleBar def missing/dup"
assert master.count("function titleBarX(") == 1, "titleBarX def missing/dup"
assert "titleBarX(s," in master, "titleBarX never called (exec rename failed)"
open('build_master_deck.js','w').write(master)
print(f"OK: {len(order)} blocks assembled")
