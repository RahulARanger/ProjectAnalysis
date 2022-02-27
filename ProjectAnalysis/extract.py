import urllib.request
import re
import csv
import pathlib


# IMPORTING DATA and CLEANING IT

def languages():
    return pathlib.Path(__file__).parent / "Data" / "languages.csv"


def ensure_languages(and_then):
    def download_files():

        with urllib.request.urlopen(
                "https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml") as file:
            yield "Extracting"
            result = re.findall(r"(?=^\w)([^:]+)|(?=^\s{2})^\s{2}(type|color):\s(.+)|\s{2}- \"(.+)\"",
                                file.read().decode(),
                                re.MULTILINE)

        cols = ["Name", "Type", "Color", "Extension"]

        yield "Saving Results locally"

        with languages().open("w", newline="") as LANGUAGES:
            writer = csv.writer(LANGUAGES, delimiter=",")
            writer.writerow(cols)

            temp = []
            for lang in result:
                if lang[0]:
                    temp.clear()
                    temp.append(lang[0])
                    continue

                if lang[-1]:
                    if len(temp) == 3:
                        writer.writerow((*temp, lang[-1]))
                    continue

                temp.append(lang[2] if lang[1] == "type" else lang[2][1: -1])

    def ensure(*args, **kwargs):
        path = languages()

        if not path.exists():
            yield "Downloading Languages DataSet"
            yield from download_files()

        yield from and_then(*args, languages=path, **kwargs)

    return ensure
