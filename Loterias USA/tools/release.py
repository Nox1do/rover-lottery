#!/usr/bin/env python3
"""Publica los archivos locales de una versión de Rovs, antes de hacer commit."""
import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'Rovs-Loterias-USA.user.js'
META = ROOT / 'Rovs-Loterias-USA.meta.js'
BASE_URL = 'https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Loterias%20USA/'


def prepare(source, version):
    if not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise ValueError('Usa una versión con formato X.Y.Z')
    text = source.read_text(encoding='utf-8')
    header, separator, body = text.partition('// ==/UserScript==')
    if not separator or not header.startswith('// ==UserScript=='):
        raise ValueError('Falta la cabecera UserScript')
    if SCRIPT.exists():
        current = re.search(r'^// @version\s+(\S+)', SCRIPT.read_text(encoding='utf-8'), re.M)
        if not current or tuple(map(int, version.split('.'))) <= tuple(map(int, current[1].split('.'))):
            raise ValueError('La nueva versión debe ser mayor que la publicada')
    archive = ROOT / 'versions' / f'Rovs-Loterias-USA-v{version}.user.js'
    if archive.exists():
        raise ValueError('Esta versión ya existe; crea una versión nueva')
    updates = {
        'version': version,
        'updateURL': BASE_URL + 'Rovs-Loterias-USA.meta.js',
        'downloadURL': BASE_URL + 'Rovs-Loterias-USA.user.js',
        'homepageURL': 'https://github.com/Nox1do/rover-lottery/tree/main/Loterias%20USA',
        'supportURL': 'https://github.com/Nox1do/rover-lottery/issues',
    }
    for key, value in updates.items():
        line = f'// @{key:<13}{value}'
        pattern = rf'^// @{key}\s+.*$'
        header = re.sub(pattern, lambda _: line, header, flags=re.M) if re.search(pattern, header, re.M) else header + line + '\n'
    # Conservar nombre y namespace: Tampermonkey identifica así el script instalado.
    metadata = header + separator + '\n'
    release = header + separator + body
    archive.parent.mkdir(parents=True, exist_ok=True)
    archive.write_text(release, encoding='utf-8')
    SCRIPT.write_text(release, encoding='utf-8')
    META.write_text(metadata, encoding='utf-8')
    print(f'Preparada v{version}: script estable, metadatos y archivo histórico')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('version')
    args = parser.parse_args()
    prepare(args.source, args.version)
