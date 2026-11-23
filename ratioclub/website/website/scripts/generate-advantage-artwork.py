"""Regenerate motion data from the supplied SVGs without changing path geometry."""
import json
from pathlib import Path
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent.parent
attributes = {
    'stroke-width': 'strokeWidth', 'stroke-opacity': 'strokeOpacity',
    'fill-opacity': 'fillOpacity', 'stroke-linecap': 'strokeLinecap',
    'stroke-linejoin': 'strokeLinejoin', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule',
}
# Contiguous groups retain the original SVG paint order, including overlay details.
groups = [
    ('surface', 0, 35), ('middle', 35, 70), ('lower', 70, 105),
    ('connector', 105, 106), ('curve', 106, 107), ('curve-markers', 107, 110),
    ('middle-details', 110, 125), ('middle-node', 125, 126), ('surface-node', 126, 127),
    ('lower-details', 127, 145), ('lower-node', 145, 146),
    ('surface-label', 146, 147), ('middle-label', 147, 148), ('lower-label', 148, 149),
]
for variant in ['desktop', 'mobile']:
    source = ET.parse(root / f'src/assets/forward-deployed-diagram-{variant}.svg').getroot()
    paths = list(source)
    assert len(paths) == 149, 'Review grouping when the source artwork changes'
    data = [{
        'name': name,
        'paths': [{attributes.get(k, k): v for k, v in path.attrib.items()} for path in paths[start:end]],
    } for name, start, end in groups]
    assert [path['d'] for group in data for path in group['paths']] == [path.attrib['d'] for path in paths]
    (root / f'src/motion/{variant}Artwork.ts').write_text(
        '// Generated from the supplied SVG. Geometry and paint order are preserved.\n'
        'import type { ArtworkGroup } from "./artworkTypes";\n'
        f'export const {variant}Artwork: ArtworkGroup[] = '
        + json.dumps(data, separators=(',', ':')) + ';\n'
    )
