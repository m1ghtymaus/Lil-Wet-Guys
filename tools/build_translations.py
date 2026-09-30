"""Write translations/en.json from strings.json, resolving [%key:...%] references.

Home Assistant only resolves those references for core integrations, so a
custom integration has to ship them expanded.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "custom_components" / "lil_wet_guys"
PREFIX = "component::lil_wet_guys::"
REF = re.compile(r"^\[%key:([^%]+)%\]$")


def main() -> None:
    """Resolve references and write en.json."""
    strings = json.loads((ROOT / "strings.json").read_text())

    def lookup(path: str) -> str:
        if not path.startswith(PREFIX):
            raise ValueError(f"Only local references are supported: {path}")
        node = strings
        for part in path[len(PREFIX):].split("::"):
            node = node[part]
        return resolve(node)

    def resolve(node):
        if isinstance(node, dict):
            return {k: resolve(v) for k, v in node.items()}
        if isinstance(node, str) and (m := REF.match(node)):
            return lookup(m.group(1))
        return node

    out = ROOT / "translations" / "en.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(resolve(strings), indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
