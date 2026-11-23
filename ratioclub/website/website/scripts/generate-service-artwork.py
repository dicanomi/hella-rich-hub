"""Group exact supplied service SVG paths for reversible scroll motion.

Path geometry, source attributes and paint order remain unchanged. Index ranges
are mapped to authored layers; update and review these mappings if exports change.
"""
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent.parent
output = root / 'src/motion/services'
output.mkdir(exist_ok=True)
rename = {'stroke-width':'strokeWidth','stroke-opacity':'strokeOpacity','fill-opacity':'fillOpacity','stroke-linecap':'strokeLinecap','stroke-linejoin':'strokeLinejoin','fill-rule':'fillRule','clip-rule':'clipRule','stroke-dasharray':'strokeDasharray','stroke-dashoffset':'strokeDashoffset'}
configs = {
    'gpu': dict(count=187, middle=[(3,34),(121,141),(142,143),(181,184)], lower=[(143,178),(184,187)], connectors=[119,141], labels=[0,1,2,180,183,186], signal=33, shift=[300,620]),
    'inference': dict(count=235, middle=[(3,38),(92,111),(112,113),(229,232)], lower=[(113,226),(232,235)], connectors=[63,70,77,84,91,111], labels=[0,1,2,228,231,234], signal=37, shift=[240,600]),
    'operations': dict(count=232, middle=[(3,106),(157,177),(178,179),(226,229)], lower=[(179,223),(229,232)], connectors=[155,177], labels=[0,1,2,225,228,231], signal=105, shift=[280,565]),
}
# The black lower-layer labels occur before the drawing paths in the export.
label_planes = {0:'upper',1:'middle',2:'lower'}
for variant,cfg in configs.items():
    svg=ET.parse(root/f'src/assets/service-{variant}-diagram.svg').getroot()
    paths=list(svg)
    assert len(paths)==cfg['count'] and all(p.tag.endswith('path') for p in paths)
    groups=[]
    for i,path in enumerate(paths):
        plane=label_planes.get(i,'upper')
        for name in ['middle','lower']:
            if any(a<=i<b for a,b in cfg[name]): plane=name
        if i in cfg['connectors']: plane='connector'
        # Top endpoint markers remain in the top layer; subsequent markers move
        # only with the geometry they belong to, never along a curve.
        attrs={rename.get(k,k):v for k,v in path.attrib.items()}
        # The final nine paths are three original leader/dot/text callouts.
        record=dict(index=i,attrs=attrs,label=i in cfg['labels'],reveal=i in cfg['labels'] or i>=cfg['count']-9,signal=i==cfg['signal'])
        if groups and groups[-1]['plane']==plane and plane!='connector': groups[-1]['paths'].append(record)
        else: groups.append(dict(plane=plane,paths=[record]))
    assert [p['attrs']['d'] for g in groups for p in g['paths']]==[p.attrib['d'] for p in paths]
    # Connector transforms are calculated from immutable source endpoint bounds.
    connectors=[]
    for i in cfg['connectors']:
        commands=re.findall(r'([MLV])([^MLV]+)',paths[i].attrib['d'])
        assert commands and set(re.findall(r'[A-Za-z]',paths[i].attrib['d'])) <= {'M','L','V'}
        values=[float(re.findall(r'-?\d*\.?\d+',numbers)[0 if command=='V' else 1]) for command,numbers in commands]
        y=min(values); height=max(values)-y
        connectors.append(dict(index=i,y=y,height=height,fromPlane='middle' if i==cfg['connectors'][-1] else 'upper',toPlane='lower' if i==cfg['connectors'][-1] else 'middle'))
    data=dict(variant=variant,width=float(svg.attrib['width']),height=float(svg.attrib['height']),viewBox=svg.attrib['viewBox'],shift=cfg['shift'],groups=groups,connectors=connectors)
    (output/f'{variant}Artwork.ts').write_text('// Generated from the exact supplied service SVG; geometry and paint order preserved.\nimport type { ServiceArtwork } from "./types";\nexport const '+variant+'Artwork: ServiceArtwork = '+json.dumps(data,separators=(',',':'))+';\n')
