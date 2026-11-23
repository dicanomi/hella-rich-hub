"""Create the hero MP4 renditions with an installed FFmpeg executable."""
import argparse
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('--ffmpeg', default='ffmpeg')
args = parser.parse_args()
destination = Path(__file__).resolve().parent.parent / 'src' / 'assets'
for name, width, bitrate in [('desktop', 1600, 2900), ('mobile', 1000, 1250)]:
    subprocess.run([
        args.ffmpeg, '-hide_banner', '-y', '-i', str(args.source), '-an',
        '-vf', f'scale={width}:-2:flags=lanczos', '-c:v', 'libx264',
        '-preset', 'slow', '-b:v', f'{bitrate}k', '-g', '60', '-keyint_min', '60',
        '-sc_threshold', '0', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', str(destination / f'hero-spiral-{name}.mp4'),
    ], check=True)
