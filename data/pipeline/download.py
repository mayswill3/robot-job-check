"""Step 0: download every source file and record a manifest with checksums."""
import hashlib
import json
from datetime import datetime, timezone

import requests

from paths import RAW
from sources import SOURCES

UA = "Mozilla/5.0 (compatible; robot-job-check data pipeline; +https://github.com)"


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main(force=False):
    RAW.mkdir(exist_ok=True)
    manifest = {}
    for key, src in SOURCES.items():
        dest = RAW / src["file"]
        if force or not dest.exists():
            print(f"downloading {key} ...")
            r = requests.get(src["url"], headers={"User-Agent": UA}, timeout=120)
            r.raise_for_status()
            dest.write_bytes(r.content)
        manifest[key] = {
            "file": src["file"],
            "url": src["url"],
            "landing": src["landing"],
            "title": src["title"],
            "publisher": src["publisher"],
            "licence": src["licence"],
            "bytes": dest.stat().st_size,
            "sha256": sha256(dest),
            "downloaded_at": datetime.fromtimestamp(dest.stat().st_mtime, tz=timezone.utc).isoformat(timespec="seconds"),
        }
        print(f"  {key}: {manifest[key]['bytes']:,} bytes  sha256 {manifest[key]['sha256'][:12]}")
    (RAW / "MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    import sys
    main(force="--force" in sys.argv)
