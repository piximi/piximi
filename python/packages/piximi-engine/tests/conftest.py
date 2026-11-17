from pathlib import Path

import pytest

from piximi_engine import ReferenceEngine
from piximi_engine.models.threshold import ThresholdSegmenter
from piximi_engine.testing.fixtures import write_fixture_images


@pytest.fixture
def images_dir(tmp_path: Path) -> Path:
    folder = tmp_path / "images"
    write_fixture_images(folder)
    return folder


@pytest.fixture
def engine(images_dir: Path) -> ReferenceEngine:
    engine = ReferenceEngine(images_dir / ".piximi", models={"threshold": ThresholdSegmenter()})
    engine.ingest_folder(images_dir)
    return engine
