from pathlib import Path

DATA = Path(__file__).resolve().parents[1]
RAW = DATA / "raw"
INTERIM = DATA / "interim"
CURATED = DATA / "curated"
PUBLIC = DATA.parent / "public" / "data"
