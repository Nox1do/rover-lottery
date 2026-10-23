"""Fetch a pinned official CRX for QA; never commit/distribute its contents."""
import hashlib
import io
import json
from pathlib import Path
import struct
import urllib.parse
import urllib.request
import zipfile

TARGET = Path("test-results/tampermonkey/extension")
URL = "https://www.tampermonkey.net/crx/tampermonkey_stable.crx"
EXPECTED_SHA256 = "a124e3189ecc0981ce79ef182dd3897a75fe22fc7bf0828e9d293ad7122d3d4d"

with urllib.request.urlopen(URL, timeout=60) as response:
    final_url = response.url
    assert urllib.parse.urlparse(final_url).hostname in {
        "www.tampermonkey.net", "data.tampermonkey.net"
    }, "Unexpected download host"
    data = response.read(8 * 1024 * 1024)
digest = hashlib.sha256(data).hexdigest()
assert digest == EXPECTED_SHA256, "Official CRX changed; review the new package before updating the pin"
assert data[:4] == b"Cr24" and struct.unpack_from("<I", data, 4)[0] == 3
offset = 12 + struct.unpack_from("<I", data, 8)[0]
archive = zipfile.ZipFile(io.BytesIO(data[offset:]))
manifest = json.loads(archive.read("manifest.json"))
assert manifest["version"] == "5.4.1" and manifest["manifest_version"] == 3
assert sum(item.file_size for item in archive.infolist()) < 30 * 1024 * 1024
for name in archive.namelist():
    relative = Path(name)
    assert not relative.is_absolute() and ".." not in relative.parts
TARGET.mkdir(parents=True, exist_ok=True)
archive.extractall(TARGET)
provenance = {"source": URL, "finalUrl": final_url, "sha256": digest,
              "version": manifest["version"], "manifestVersion": manifest["manifest_version"]}
(TARGET.parent / "extension-provenance.json").write_text(json.dumps(provenance, indent=2) + "\n")
print("Official Tampermonkey verified:", manifest["version"], digest)
