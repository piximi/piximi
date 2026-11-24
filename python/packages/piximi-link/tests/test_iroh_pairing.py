"""Tickets, keys and the allowlist: no iroh needed."""

import stat
from pathlib import Path

import pytest

from piximi_link.iroh.pairing import Allowlist, Ticket, load_or_create_key, looks_like_ticket


def test_a_ticket_round_trips_with_and_without_its_secret():
    paired = Ticket("endpointabc", b"\x00\x01secret-bytes!!")
    text = str(paired)
    assert looks_like_ticket(text) and text.startswith("piximi1.endpointabc.")
    assert Ticket.parse(text) == paired
    assert Ticket.parse("piximi1.endpointabc") == Ticket("endpointabc")
    for bad in ["endpointabc", "piximi1.", "piximi2.endpointabc", "piximi1.a.b.c"]:
        with pytest.raises(ValueError):
            Ticket.parse(bad)


def test_a_key_is_made_once_and_kept_private(tmp_path: Path):
    path = tmp_path / "iroh" / "key"
    key = load_or_create_key(path)
    assert len(key) == 32 and load_or_create_key(path) == key
    assert stat.S_IMODE(path.stat().st_mode) == 0o600
    path.write_bytes(b"short")
    with pytest.raises(ValueError):
        load_or_create_key(path)


def test_the_allowlist_is_a_file_people_can_edit(tmp_path: Path):
    allowlist = Allowlist(tmp_path / "authorized.json")
    assert "abc" not in allowlist
    allowlist.add("abc", "laptop")
    assert "abc" in allowlist and allowlist.entries()["abc"]["label"] == "laptop"
    (tmp_path / "authorized.json").write_text("{}")
    assert "abc" not in allowlist, "an edit counts on the next check"
