"""The notebook helper: a kernel serves a folder and gets the Python API."""

from pathlib import Path

import pytest

from piximi_app.notebook import serve
from piximi_engine.testing.fixtures import write_fixture_images


@pytest.fixture
def images_dir(tmp_path: Path) -> Path:
    folder = tmp_path / "images"
    write_fixture_images(folder)
    return folder


async def test_notebook_session_renders_and_serves(images_dir: Path):
    session = await serve(images_dir, token="t0k")
    try:
        assert session.url.endswith("token=t0k") or "token=t0k" in session.url
        assert "t0k" in session._repr_html_()
        assert session.project.engine.meta.count("image") == 5
        assert session.port > 0
    finally:
        await session.stop()
