"""Compare every current build file at canonical public URLs, without query busting."""
import concurrent.futures
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
import sys
import urllib.request


def main():
    base, output = sys.argv[1:3]
    if not base.startswith("https://") or not base.endswith("/") or "?" in base:
        raise ValueError("Use a canonical HTTPS base with a trailing slash.")
    root = Path(__file__).resolve().parents[1] / "dist"

    def fetch(relative):
        url = base + relative
        expected = (root / relative).read_bytes()
        try:
            with urllib.request.urlopen(url, timeout=45) as response:
                data = response.read()
                actual = hashlib.sha256(data).hexdigest()
                return {"file": relative, "url": url, "bytes": len(data),
                        "expected_sha256": hashlib.sha256(expected).hexdigest(),
                        "actual_sha256": actual, "matches": data == expected,
                        "last_modified": response.headers.get("Last-Modified"),
                        "etag": response.headers.get("ETag")}
        except Exception as error:
            return {"file": relative, "url": url, "matches": False, "error": str(error)}

    with urllib.request.urlopen(base, timeout=45) as response:
        index_before = response.read()
    names = sorted(p.relative_to(root).as_posix() for p in root.rglob("*") if p.is_file())
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        files = list(pool.map(fetch, names))
    with urllib.request.urlopen(base, timeout=45) as response:
        index_after = response.read()
    expected_index = (root / "index.html").read_bytes()
    report = {"checked_at": datetime.now(timezone.utc).isoformat(), "base": base,
              "scope": "All current build files, canonical HTTPS URLs without query cache busting. Older hashed assets retained on Pages are outside this current inventory.",
              "directory_index_matches_before_and_after": index_before == index_after == expected_index,
              "current_files": len(files), "matching_files": sum(x["matches"] for x in files), "files": files}
    Path(output).write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "files"}, indent=2))
    if not report["directory_index_matches_before_and_after"] or not all(x["matches"] for x in files):
        raise SystemExit("The canonical public files do not yet match the reviewed edition.")


if __name__ == "__main__":
    main()
