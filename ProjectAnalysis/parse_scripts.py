import pathlib
import datetime
import re
import pandas
import typing
from ProjectAnalysis.extract import ensure_languages


def __common(index, path: pathlib.Path):
    stat = path.stat()
    return (
        index,
        re.escape(str(path)),
        path.name,
        path.suffix,
        stat.st_size,
        # creation time
        datetime.datetime.fromtimestamp(stat.st_ctime),
        # c_time is not that useful for us
        # c_time reports date for any meta change for the file
        # I HONESTLY DON'T KNOW HOW IS IT DIFFERENT FROM BIRTH DATE
        # latest access time
        datetime.datetime.fromtimestamp(stat.st_atime),
        # latest modified time
        datetime.datetime.fromtimestamp(stat.st_mtime),
    )


def __for_dir(stack, root, depth=-1, parent=-1, index=0):
    stack.append((root, depth + 1, index))
    return *__common(index, root), False, 0, 0, 0, 0, 0, depth, parent
    # "true" coz d3.csv can recongize as True value


def __path_string(path: pathlib.Path):
    return re.escape(str(path.resolve()))


@ensure_languages
def extract(
    root: typing.Union[pathlib.Path, str],
    languages: typing.Union[pathlib.Path, str] = None,
):
    raw, folders = [], []
    stack = []
    root = pathlib.Path(root)

    yield "Parsing Directory: %s" % (__path_string(root),)
    folders.append(__for_dir(stack, root))

    while stack:
        sub_root, depth, parent = stack.pop()

        for child in sub_root.iterdir():
            if not (child.is_file() or child.is_dir()):  # not possible
                continue

            if child.is_dir():
                yield "Parsing Directory:  %s" % (__path_string(child),)
                folders.append(__for_dir(stack, child, depth + 1, parent, len(folders)))
                continue

            yield "Reading File: %s" % (__path_string(child),)

            total_spaces, total_tabs = 0, 0
            max_spaces, max_tabs = 0, 0
            lines = 0
            is_utf_8 = False

            try:
                temp = child.read_text(encoding="utf-8")
                _tabs = [len(_) for _ in re.findall(r"[\t]+", temp)]
                _spaces = [len(_) for _ in re.findall(r"[ ]+", temp)]

                None if _spaces else _spaces.append(0)
                None if _tabs else _tabs.append(0)

                total_tabs, max_tabs = sum(_tabs), max(_tabs)
                total_spaces, max_spaces = sum(_spaces), sum(_spaces)

                is_utf_8 = True

                lines = len(re.findall(r"[\n]", temp))

            except Exception as _:
                print(_)
                yield "%s is not a UTF-8 formatted File" % (re.escape(str(child)),)

            raw.append(
                (
                    *__common(len(raw), child),
                    is_utf_8,
                    total_spaces,
                    max_spaces,
                    total_tabs,
                    max_tabs,
                    lines,
                    depth,
                    parent,
                )
            )
    yield raw, folders, languages


def parse(root):
    temp = ""
    for _ in extract(root):
        temp = _
        yield temp

    yield "Cleaning Data"

    cols = [
        "Index",
        "Path",
        "Name",
        "Extension",
        "Size",
        "Birth Time",
        "Recent Access Time",
        "Modified Time",
        "IS_UTF_8",
        "TOTAL_SPACES",
        "MAX_SPACES",
        "TOTAL_TABS",
        "MAX_TABS",
        "Lines",
        "Depth Level",
        "ParentID",
    ]

    # Extracting data from raw
    files = pandas.DataFrame(temp[0], columns=cols)
    folders = pandas.DataFrame(temp[1], columns=cols)
    languages = pandas.read_csv(temp[2])

    # Merging (by inner join) to remove noises

    # files (X) Extensions where common files are extracted out
    files = files.merge(languages["Extension"], how="inner", on="Extension")

    # Language has alot of valid Extensions, so we need only the ones inside the project, we need only the unique values
    languages = languages.merge(files["Extension"], how="inner", on="Extension").drop_duplicates(subset=("Extension", "Type", "Name", ))

    folders["Size"] = folders["Path"].apply(
        lambda path: files.loc[files["Path"].str.startswith(path)]["Size"].sum() / 1000
    )

    # we only need csv strings
    yield files.to_csv(index=False), folders.to_csv(index=False), languages.to_csv(
        index=False
    )


if __name__ == "__main__":
    _root = pathlib.Path(__file__).parent.parent
    print(_root)

    for result in parse(_root):
        print(result)
