"""The metadata store: layout versioning, stable order, masks and indexes."""

import sqlite3
from pathlib import Path

import pytest
from piximi_schema.entities import AnnotationHeader, AnnotationObject, ImageObject, Partition, Shape

from piximi_engine.store import Clause, IncompatibleStoreError, MetaStore, random_key
from piximi_engine.store.meta import SCHEMA_VERSION


def image(id: str, name: str, partition: Partition = Partition.UNASSIGNED, confidence: float | None = None) -> ImageObject:
    return ImageObject(
        id=id,
        name=name,
        series_id="s",
        shape=Shape(planes=1, height=2, width=2, channels=1),
        category_id="cat",
        active_plane_id=f"{id}-p",
        timepoint=0,
        bit_depth=8,
        partition=partition,
        prediction_confidence=confidence,
    )


def test_refuses_a_store_with_another_layout(tmp_path: Path):
    path = tmp_path / "meta.sqlite"
    db = sqlite3.connect(path)
    db.execute("CREATE TABLE entities (kind TEXT, id TEXT)")
    db.execute("PRAGMA user_version = 1")
    db.commit()
    db.close()
    with pytest.raises(IncompatibleStoreError, match="older engine"):
        MetaStore(path)
    assert sqlite3.connect(path).execute("PRAGMA user_version").fetchone()[0] == 1  # untouched


def test_new_store_is_stamped_and_reopens(tmp_path: Path):
    path = tmp_path / "meta.sqlite"
    MetaStore(path).close()
    assert sqlite3.connect(path).execute("PRAGMA user_version").fetchone()[0] == SCHEMA_VERSION
    MetaStore(path).close()


def test_updates_keep_insertion_order(tmp_path: Path):
    store = MetaStore(tmp_path / "meta.sqlite")
    store.put("image", image("a", "first"), parent="s")
    store.put("image", image("b", "second"), parent="s")
    store.put("image", image("a", "first again"), parent="s")
    assert store.ids("image") == ["a", "b"]
    assert store.get("image", "a", ImageObject).name == "first again"


def test_masks_live_in_their_own_column(tmp_path: Path):
    store = MetaStore(tmp_path / "meta.sqlite")
    annotation = AnnotationObject(
        id="ann",
        plane_id="p",
        image_id="i",
        volume_id="v",
        partition=Partition.UNASSIGNED,
        shape=Shape(planes=1, height=2, width=2, channels=1),
        bounding_box=(0, 0, 2, 2),
        encoded_mask=[1, 3],
    )
    store.put("annotation", annotation, parent="i", index={"kind_id": "k", "category_id": "c"})
    row = store._db.execute("SELECT data, mask, kind_id, category_id FROM entities WHERE id = 'ann'").fetchone()
    assert "encodedMask" not in row[0] and row[1] == "[1, 3]" and row[2:] == ("k", "c")
    assert store.get("annotation", "ann", AnnotationObject).encoded_mask == [1, 3]
    header = store.get("annotation", "ann", AnnotationHeader)
    assert not hasattr(header, "encoded_mask")
    assert store.get_many("annotation", ["ann", "nope"], AnnotationObject)["ann"].encoded_mask == [1, 3]


def test_indexed_columns_filter_count_and_sort(tmp_path: Path):
    store = MetaStore(tmp_path / "meta.sqlite")
    store.put_many(
        "image",
        [
            (image("a", "beta", Partition.TRAINING, 0.9), "s"),
            (image("b", "Alpha", Partition.INFERENCE, 0.4), "s"),
            (image("c", "gamma", Partition.TRAINING), "s"),
        ],
    )
    training = [MetaStore.in_clause("partition", ["Training"])]
    assert store.select_ids("image", where=training) == ["a", "c"]
    assert store.count("image", where=training) == 2
    assert store.count_by("image", "partition") == {"Training": 2, "Inference": 1}
    assert store.count_by("image", "confidence") == {0.9: 1, 0.4: 1}
    assert store.select_ids("image", order="e.name COLLATE NOCASE") == ["b", "a", "c"]
    assert store.select_ids("image", order="e.rowid", offset=1, limit=1) == ["b"]
    shuffled = store.select_ids("image", order=Clause("piximi_rand(?, e.id)", (7,)))
    assert sorted(shuffled) == ["a", "b", "c"] and shuffled == sorted(shuffled, key=lambda id: random_key(7, id))
    assert store.select_ids("image", where=[MetaStore.in_clause("id", [])]) == []


def test_random_key_is_fnv1a_over_seed_and_id():
    # FNV-1a 32 of "0:a"; the frontend's query vectors pin the same value.
    assert random_key(0, "a") == 0x98B2BCAA == _fnv1a(b"0:a")
    assert random_key(7, "x") != random_key(8, "x")


def _fnv1a(data: bytes) -> int:
    h = 0x811C9DC5
    for b in data:
        h = ((h ^ b) * 0x01000193) & 0xFFFFFFFF
    return h


def test_revisions_come_from_one_persisted_counter(tmp_path: Path):
    store = MetaStore(tmp_path / "meta.sqlite")
    assert [store.next_rev(), store.next_rev()] == [1, 2]
    store.close()
    assert MetaStore(tmp_path / "meta.sqlite").next_rev() == 3


def test_transaction_rolls_back_every_write_on_failure(tmp_path: Path):
    store = MetaStore(tmp_path / "meta.sqlite")
    store.put("image", image("keep", "keep"))
    with pytest.raises(RuntimeError):
        with store.transaction():
            store.put("image", image("gone", "gone"))
            store.delete("image", ["keep"])
            with store.transaction():  # nested joins the outer one
                store.put("image", image("also-gone", "also-gone"))
            raise RuntimeError("boom")
    assert store.ids("image") == ["keep"]
    with store.transaction():
        store.put("image", image("new", "new"))
    assert store.ids("image") == ["keep", "new"]
