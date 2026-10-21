"""Retrieve the pinned, original Firefox package published by Jan Biniok on AMO."""
import hashlib
import io
import json
from pathlib import Path
import urllib.request
import urllib.parse
import zipfile

URL = "https://addons.mozilla.org/firefox/downloads/file/4797143/tampermonkey-5.5.0.xpi"
SHA256 = "190031c78dbc5696114835601f2c8e6b855ad1e134df5df278f8fc158c065908"
TARGET = Path("test-results/tampermonkey-firefox")
with urllib.request.urlopen(URL, timeout=60) as response:
    final_url = response.url
    assert urllib.parse.urlparse(final_url).hostname in {"addons.mozilla.org", "addons.cdn.mozilla.net"}
    data = response.read(8 * 1024 * 1024)
assert hashlib.sha256(data).hexdigest() == SHA256, "AMO package changed; review before updating pin"
archive = zipfile.ZipFile(io.BytesIO(data))
manifest = json.loads(archive.read("manifest.json"))
assert manifest["version"] == "5.5.0"
assert manifest["browser_specific_settings"]["gecko"]["id"] == "firefox@tampermonkey.net"
assert {"META-INF/mozilla.rsa", "META-INF/cose.sig"}.issubset(archive.namelist())
TARGET.mkdir(parents=True, exist_ok=True)
(TARGET / "tampermonkey.xpi").write_bytes(data)
(TARGET / "extension-provenance.json").write_text(json.dumps({
    "source": URL, "finalUrl": final_url, "publisher": "Jan Biniok (derjanb), Mozilla Add-ons",
    "sha256": SHA256, "version": manifest["version"], "manifestVersion": manifest["manifest_version"],
    "addonId": "firefox@tampermonkey.net", "signatureFilesPresent": True
}, indent=2) + "\n")
print("Firefox Tampermonkey package verified:", manifest["version"], SHA256)
