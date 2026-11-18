"""Registering models and plugins, and what the engine lists before any
plugin environment exists (no Appose needed for any of this)."""

from pathlib import Path

import pytest

from piximi_engine import ReferenceEngine
from piximi_engine.models import ModelRegistry
from piximi_engine.models import plugin as plugin_module
from piximi_engine.models import registry as registry_module
from piximi_engine.models.threshold import ThresholdSegmenter
from piximi_link.errors import BackendError
from piximi_link.peer import HandlerContext
from piximi_schema.segmentation import ModelStatus

PLUGINS = Path(__file__).parent / "plugins"


@pytest.fixture
def no_appose(monkeypatch):
    monkeypatch.setattr(registry_module, "appose_available", lambda: False)
    monkeypatch.setattr(plugin_module, "appose_available", lambda: False)


def test_discovering_a_directory_skips_the_broken_plugin(no_appose, caplog):
    changes = []
    registry = ModelRegistry(on_change=lambda: changes.append(len(registry.models)))
    added = registry.discover_dir(PLUGINS)
    assert added == ["threshold-numpy-one", "threshold-numpy-two"]
    assert set(registry.plugins) == {"numpy-one", "numpy-two"}
    assert any("broken" in record.message for record in caplog.records)
    assert changes == [1, 2]

    descriptors = {d.name: d for d in registry.describe_all()}
    one = descriptors["threshold-numpy-one"]
    assert one.status == ModelStatus.UNAVAILABLE and "piximi-engine[appose]" in one.status_message
    assert one.framework == "numpy" and one.model_loaded is False


def test_in_process_models_win_over_a_plugin_with_the_same_id(no_appose, caplog):
    registry = ModelRegistry()
    clash = ThresholdSegmenter()
    clash.id = "threshold-numpy-one"
    registry.add(clash)
    assert registry.register(PLUGINS / "numpy-one") == []
    assert registry.get("threshold-numpy-one") is clash
    assert "already registered" in caplog.text


def test_registering_again_replaces_the_plugin(no_appose):
    registry = ModelRegistry()
    registry.register(PLUGINS / "numpy-one")
    first = registry.get("threshold-numpy-one")
    registry.register(PLUGINS / "numpy-one")
    assert registry.get("threshold-numpy-one") is not first
    assert list(registry.models) == ["threshold-numpy-one"]


async def test_engine_lists_plugins_and_refuses_to_load_them_without_appose(no_appose, images_dir: Path):
    engine = ReferenceEngine(images_dir / ".piximi", models_dirs=[PLUGINS])
    events = []
    engine.subscribe(events.append)
    names = [d.name for d in await engine.segmentation_list_models()]
    assert names[0] == "threshold" and "threshold-numpy-two" in names

    with pytest.raises(BackendError) as info:
        await engine.segmentation_load_model("threshold-numpy-one", HandlerContext(None))
    assert info.value.code == "NOT_SUPPORTED"
    assert (await engine.jobs_list())[-1].status == "failed"

    added = engine.models.register(PLUGINS / "numpy-two")
    assert added == [] or added == ["threshold-numpy-two"]
    assert events and events[-1].type == "models/didChange"
    assert {d.name for d in events[-1].models} >= {"threshold", "threshold-numpy-two"}
    await engine.close()
