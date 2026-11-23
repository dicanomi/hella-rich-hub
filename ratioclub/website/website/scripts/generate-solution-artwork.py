"""Expose original solution SVG paths for motion, retaining attributes and paint order."""
from pathlib import Path
import xml.etree.ElementTree as ET
import json
root = Path(__file__).resolve().parent.parent
rename = {'stroke-width':'strokeWidth','stroke-opacity':'strokeOpacity','fill-opacity':'fillOpacity','stroke-linecap':'strokeLinecap','stroke-linejoin':'strokeLinejoin','fill-rule':'fillRule','clip-rule':'clipRule'}
configs = [
 ('gpu','05',381,292,48,[49,50,51,52,53],313.484,71.1785,2.5),
 ('inference','06',382,280,47,[48],244.004,79.6245,3.7),
 ('operations','07',382,301,34,[36],245.909,118.343,2.8),
]
text='// Generated from supplied SVGs; original geometry, paint attributes and order retained.\nimport type { SVGProps } from "react";\nexport type GraphVariant = "gpu" | "inference" | "operations";\nexport type GraphArtwork = { width: number; height: number; signal: number; markers: number[]; target: [number, number]; radius: number; paths: SVGProps<SVGPathElement>[] };\nexport const solutionArtwork: Record<GraphVariant, GraphArtwork> = {\n'
for name,n,width,height,signal,markers,x,y,radius in configs:
 source=ET.parse(root/f'src/assets/illustration-{n}.svg').getroot()
 paths=[{rename.get(k,k):v for k,v in path.attrib.items()}for path in source]
 assert all(path.tag.endswith('path')for path in source)
 text+=name+':'+json.dumps(dict(width=width,height=height,signal=signal,markers=markers,target=[x,y],radius=radius,paths=paths),separators=(',',':'))+',\n'
text+='};\n'
(root/'src/motion/solutions/solutionArtwork.ts').write_text(text)
