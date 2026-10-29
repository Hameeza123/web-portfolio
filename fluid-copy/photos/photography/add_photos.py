"""Add photos to an album on the Photography page.

    python3 add_photos.py uzbekistan ~/Desktop/one.jpg ~/Desktop/two.heic

Each photo is rotated upright, resized to 2200px on its long edge, saved as the next numbered
JPEG in that album's folder with all metadata (including GPS location) removed, and appended to
the end of the album in albums.js. Move the new lines in albums.js to reorder them.
Works with JPEG, PNG and (on a Mac) HEIC. Run from anywhere.
"""
import os
import re
import subprocess
import sys
import tempfile

from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ALBUMS_JS = os.path.join(HERE, 'albums.js')
LONG_EDGE = 2200


def open_image(path):
    if path.lower().endswith(('.heic', '.heif')):
        # Pillow can't read HEIC; macOS's sips converts it
        tmp = os.path.join(tempfile.mkdtemp(), 'photo.jpg')
        subprocess.run(['sips', '-s', 'format', 'jpeg', path, '--out', tmp], check=True, capture_output=True)
        path = tmp
    return ImageOps.exif_transpose(Image.open(path)).convert('RGB')


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    slug, files = sys.argv[1], sys.argv[2:]
    js = open(ALBUMS_JS).read()

    # the album's photo list ends at the first "    ]," after "  slug: {"
    start = js.find(f'\n  {slug}: {{')
    if start < 0:
        names = re.findall(r'^  (\w+): \{', js, re.M)
        sys.exit(f'No album "{slug}" in albums.js. Albums: {", ".join(names)}')
    end = js.index('\n    ],', start)

    folder = os.path.join(HERE, slug)
    os.makedirs(folder, exist_ok=True)
    taken = [int(f[:-4]) for f in os.listdir(folder) if re.fullmatch(r'\d+\.jpg', f)]
    n = max(taken, default=0)

    lines = []
    for f in files:
        n += 1
        im = open_image(os.path.expanduser(f))
        im.thumbnail((LONG_EDGE, LONG_EDGE), Image.LANCZOS)
        name = f'{n:02d}.jpg'
        im.save(os.path.join(folder, name), 'JPEG', quality=82, optimize=True, progressive=True)
        src = f'photos/photography/{slug}/{name}'
        lines.append(f'      {{ src: "{src}", w: {im.width}, h: {im.height} }},')
        print(f'added {src}  ({im.width}x{im.height})  from {f}')

    js = js[:end] + '\n' + '\n'.join(lines) + js[end:]
    open(ALBUMS_JS, 'w').write(js)


if __name__ == '__main__':
    main()
