import re,sys
def replace(path, idx, code):
    s=open(path).read()
    blocks=list(re.finditer(r'```mermaid\n(.*?)```', s, re.S))
    b=blocks[idx]
    s=s[:b.start(1)]+code.strip('\n')+'\n'+s[b.end(1):]
    open(path,'w').write(s)
