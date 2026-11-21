"""Files on the engine's own machine, under the roots it was started with.

A client may browse those folders, look at TIFFs before adding them (the
frame count and whatever the metadata says about the layout, so the same
dimension dialog serves server files) and add files or whole folders.
Anything outside the roots is refused, including through symlinks: every
path is resolved before the check.
"""

from __future__ import annotations

import os
from collections.abc import Iterable
from pathlib import Path

import tifffile
from piximi_link.errors import BackendError
from piximi_schema.ingest import (
    DimensionHint,
    DimensionOrder,
    DirectoryEntry,
    DirectoryListing,
    EntryType,
    PathInspection,
)

from .decode import SUPPORTED_SUFFIXES, TIFF_SUFFIXES

ROOTS_ENV = "PIXIMI_ROOTS"
"""Extra roots for ``piximi serve``, separated like PATH."""

# Folders the engine keeps for itself, never listed.
HIDDEN_DIRS = {".piximi"}


def roots_from_env(env: dict[str, str] | None = None) -> list[Path]:
    value = (env if env is not None else os.environ).get(ROOTS_ENV, "")
    return [Path(part) for part in value.split(os.pathsep) if part.strip()]


class PathPolicy:
    def __init__(self, roots: Iterable[Path | str]) -> None:
        resolved: list[Path] = []
        for root in roots:
            path = Path(root).expanduser().resolve()
            if path not in resolved:
                resolved.append(path)
        self.roots = resolved

    @property
    def enabled(self) -> bool:
        return bool(self.roots)

    def resolve(self, path: str | Path) -> Path:
        """The real path, if it lies under a root."""
        target = Path(path).expanduser().resolve()
        if not any(target == root or target.is_relative_to(root) for root in self.roots):
            raise BackendError("UNAUTHORIZED", f"{path} is outside the folders this engine may read")
        return target

    # ── Browse ───────────────────────────────────────────────────────────────

    def browse(self, path: str | None) -> DirectoryListing:
        if path is None or path == "":
            if len(self.roots) == 1:
                return self._listing(self.roots[0])
            return DirectoryListing(
                path="",
                parent=None,
                roots=[str(root) for root in self.roots],
                entries=[
                    DirectoryEntry(name=root.name or str(root), path=str(root), type=EntryType.DIRECTORY)
                    for root in self.roots
                ],
            )
        return self._listing(self.resolve(path))

    def _listing(self, directory: Path) -> DirectoryListing:
        if not directory.is_dir():
            raise BackendError("NOT_FOUND", f"{directory} is not a folder")
        try:
            children = list(directory.iterdir())
        except OSError as error:
            raise BackendError("NOT_FOUND", f"Cannot list {directory}: {error}") from error
        entries: list[DirectoryEntry] = []
        for child in children:
            if child.name.startswith(".") or child.name in HIDDEN_DIRS:
                continue
            try:
                if child.is_dir():
                    entries.append(DirectoryEntry(name=child.name, path=str(child), type=EntryType.DIRECTORY))
                elif child.is_file():
                    entries.append(
                        DirectoryEntry(
                            name=child.name,
                            path=str(child),
                            type=EntryType.FILE,
                            size=child.stat().st_size,
                            supported=child.suffix.lower() in SUPPORTED_SUFFIXES,
                        )
                    )
            except OSError:
                continue
        entries.sort(key=lambda entry: (entry.type != EntryType.DIRECTORY, entry.name.lower()))
        at_root = directory in self.roots
        if at_root:
            parent = None if len(self.roots) == 1 else ""
        else:
            parent = str(directory.parent)
        return DirectoryListing(path=str(directory), parent=parent, roots=[str(root) for root in self.roots], entries=entries)

    # ── Inspect ──────────────────────────────────────────────────────────────

    def inspect(self, paths: Iterable[str]) -> list[PathInspection]:
        return [self._inspect(path) for path in paths]

    def _inspect(self, path: str) -> PathInspection:
        name = Path(path).name
        try:
            target = self.resolve(path)
            if not target.is_file():
                raise FileNotFoundError(f"{path} is not a file")
            if target.suffix.lower() not in TIFF_SUFFIXES:
                return PathInspection(path=str(target), name=name, frame_count=1, is_multi_frame=False)
            with tifffile.TiffFile(target) as tif:
                frames = sum(page.samplesperpixel - len(page.extrasamples) for page in tif.pages)
                hint = dimension_hint(tif)
            return PathInspection(
                path=str(target), name=name, frame_count=frames, is_multi_frame=frames > 1, dimensions=hint
            )
        except BackendError:
            raise
        except Exception as error:
            return PathInspection(path=path, name=name, frame_count=0, is_multi_frame=False, error=str(error))

    # ── Expand ───────────────────────────────────────────────────────────────

    def expand(self, paths: Iterable[str], recursive: bool) -> list[Path]:
        """The supported files the paths name: files as given, folders by
        their supported files (and their subfolders' when recursive), in
        order and without repeats."""
        files: list[Path] = []
        seen: set[Path] = set()

        def add(file: Path) -> None:
            if file not in seen:
                seen.add(file)
                files.append(file)

        def walk(directory: Path) -> None:
            try:
                children = sorted(directory.iterdir(), key=lambda child: child.name.lower())
            except OSError as error:
                raise BackendError("NOT_FOUND", f"Cannot list {directory}: {error}") from error
            for child in children:
                if child.name.startswith(".") or child.name in HIDDEN_DIRS:
                    continue
                if child.is_dir():
                    if recursive:
                        walk(child)
                elif child.is_file() and child.suffix.lower() in SUPPORTED_SUFFIXES:
                    add(child)

        for path in paths:
            target = self.resolve(path)
            if target.is_dir():
                walk(target)
            elif target.is_file():
                add(target)
            else:
                raise BackendError("NOT_FOUND", f"{path} does not exist")
        return files


def dimension_hint(tif: tifffile.TiffFile) -> DimensionHint | None:
    """What tifffile makes of the file's axes (OME, ImageJ, shaped), as the
    frame layout the decoder will see: pages are read in file order and a
    page's samples count as channels, so the page axes reversed (slowest
    last) and samples first give the order, first-listed fastest. A file
    whose axes tifffile cannot name (a plain stack) gets no hint."""
    series = tif.series[0]
    axes, shape = series.axes, series.shape
    if any(axis not in "TZCYXS" for axis in axes):
        return None
    sizes = dict(zip(axes, shape))
    if "C" in sizes and "S" in sizes:
        return None
    fast_to_slow: list[str] = []
    if "S" in sizes:
        fast_to_slow.append("c")
    for axis in reversed([axis for axis in axes if axis in "TZC"]):
        fast_to_slow.append(axis.lower())
    for axis in "czt":
        if axis not in fast_to_slow:
            fast_to_slow.append(axis)
    channels = sizes.get("C")
    if channels is None and "S" in sizes:
        channels = sizes["S"] - len(tif.pages[0].extrasamples)
    return DimensionHint(
        dimension_order=DimensionOrder("xy" + "".join(fast_to_slow)),
        channels=channels or 1,
        slices=sizes.get("Z", 1),
        frames=sizes.get("T", 1),
    )
