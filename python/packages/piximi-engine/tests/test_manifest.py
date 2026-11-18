"""Plugin manifests: what they must say, and what the engine makes of them."""

from pathlib import Path

import pytest

from piximi_engine.models.manifest import MANIFEST_NAME, ManifestError, load_manifest
from piximi_schema.segmentation import ModelStatus

PLUGINS = Path(__file__).parent / "plugins"


def test_fixture_manifest_describes_its_model():
    manifest = load_manifest(PLUGINS / "numpy-one")
    assert manifest.plugin.id == "numpy-one" and manifest.plugin.env.requirements == ["numpy<2"]
    assert manifest.entry_module == ("model", (PLUGINS / "numpy-one").resolve())
    (spec,) = manifest.models
    descriptor = manifest.describe(spec, status=ModelStatus.UNAVAILABLE, status_message="not built")
    assert descriptor.name == "threshold-numpy-one" and descriptor.model_loaded is False
    assert descriptor.framework == "numpy" and descriptor.version == "1.0"
    assert descriptor.output_policy.mode == "classes" and descriptor.channel_policy.mode == "passthrough"
    assert [field.key for field in descriptor.option_schema.groups[0].fields] == ["threshold", "delay"]
    assert descriptor.to_wire()["tasks"] == ["segmentation"]


def test_manifest_file_or_directory(tmp_path: Path):
    assert load_manifest(PLUGINS / "numpy-one" / MANIFEST_NAME).path == load_manifest(PLUGINS / "numpy-one").path
    with pytest.raises(ManifestError, match="No piximi-model.toml"):
        load_manifest(tmp_path)


def test_errors_name_the_problem():
    with pytest.raises(ManifestError) as info:
        load_manifest(PLUGINS / "broken")
    message = str(info.value)
    assert "options" in message and "colour" in message


def write(tmp_path: Path, body: str, entry: bool = True) -> Path:
    (tmp_path / MANIFEST_NAME).write_text(body)
    if entry:
        (tmp_path / "model.py").write_text("MODEL = None\n")
    return tmp_path


BASE = """
[plugin]
id = "p"
name = "P"
framework = "f"
[plugin.env]
{env}
[[models]]
id = "m"
display_name = "M"
output = {{ mode = "single", default_kind_name = "Object" }}
channels = {{ mode = "fixed", count = 3 }}
"""


def test_environment_needs_exactly_one_source(tmp_path: Path):
    with pytest.raises(ManifestError, match="requirements.*or.*file"):
        load_manifest(write(tmp_path, BASE.format(env="python = '3.12'")))
    with pytest.raises(ManifestError, match="not both"):
        load_manifest(write(tmp_path, BASE.format(env="requirements = ['numpy']\nfile = 'requirements.txt'")))
    with pytest.raises(ManifestError, match="does not exist"):
        load_manifest(write(tmp_path, BASE.format(env="file = 'requirements.txt'")))
    (tmp_path / "requirements.txt").write_text("numpy\n")
    manifest = load_manifest(tmp_path)
    assert manifest.env_file == (tmp_path / "requirements.txt").resolve()
    assert manifest.plugin.env.python == "3.12"


def test_entry_must_exist_and_ids_be_distinct(tmp_path: Path):
    with pytest.raises(ManifestError, match="entry model.py does not exist"):
        load_manifest(write(tmp_path, BASE.format(env="requirements = ['numpy']"), entry=False))
    twice = BASE.format(env="requirements = ['numpy']") + """
[[models]]
id = "m"
display_name = "M again"
output = { mode = "single", default_kind_name = "Object" }
channels = { mode = "passthrough", max_channels = 1 }
"""
    with pytest.raises(ManifestError, match="distinct"):
        load_manifest(write(tmp_path, twice))


def test_unknown_keys_are_rejected(tmp_path: Path):
    with pytest.raises(ManifestError, match="colour"):
        load_manifest(write(tmp_path, BASE.format(env="requirements = ['numpy']") + "colour = 'red'\n"))
