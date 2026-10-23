"""Run the whole pipeline: python data/pipeline/run.py [--force-download]"""
import sys

import build
import download
import employment
import exposure
import tasks_aliases
import validate

if __name__ == "__main__":
    download.main(force="--force-download" in sys.argv)
    period = employment.main()
    exposure.main()
    tasks_aliases.main()
    build.main(period)
    validate.main()
