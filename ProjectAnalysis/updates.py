import urllib.request
import json
import pprint
from distutils.version import LooseVersion
import configparser
import pathlib
from collections import namedtuple


Release = namedtuple("Release", ["version", "URL", "released", "prerelease", "body"])


def latest_release(current_version):
    with urllib.request.urlopen(
        "https://api.github.com/repos/RahulARanger/ProjectAnalysis/releases/latest"
    ) as request:
        raw = json.loads(request.read().decode())

        parser = configparser.ConfigParser()

        meta_file = parser.read(pathlib.Path(__file__).parent.parent / "meta.ini")

        current_version = LooseVersion(
            meta_file["META"]["Version"] if meta_file.exists() else "0.1.0"
        )
        latest_release = LooseVersion(raw["tag_name"])

        return Release(
            latest_release.version,
            raw["zipball_url"],
            raw["published_at"],
            raw["prerelease"],
            raw["body"],
        ) if latest_release > current_version else False


def ask_for_limit():
    with urllib.request.urlopen("https://api.github.com/rate_limit") as limit:
        pprint.pprint(json.loads(limit.read().decode()), indent=4)


# ask_for_limit()
latest_release()
