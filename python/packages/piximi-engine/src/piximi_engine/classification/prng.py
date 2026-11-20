"""The frontend's seeded random source (``utils/numberUtils.ts``), so a
shuffle seeded the same way orders the same items on both sides.

mulberry32 is written in JavaScript's 32-bit integer operations; the
helpers below reproduce ``ToInt32``/``ToUint32`` and ``Math.imul`` on
Python's unbounded ints. The seed itself grows without wrapping, as the
JavaScript double does for any practical number of draws.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from typing import TypeVar

T = TypeVar("T")


def _u32(x: int) -> int:
    return x & 0xFFFFFFFF


def _i32(x: int) -> int:
    x &= 0xFFFFFFFF
    return x - 0x100000000 if x & 0x80000000 else x


def _imul(a: int, b: int) -> int:
    return _i32(_i32(a) * _i32(b))


def mulberry32(seed: int) -> Callable[[], float]:
    """A generator of floats in ``[0, 1)``, matching ``mulberry32(seed)()``."""
    state = seed

    def rng() -> float:
        nonlocal state
        state += 0x6D2B79F5
        t = state
        t = _imul(t ^ (_u32(t) >> 15), t | 1)
        t = _i32(t ^ (t + _imul(t ^ (_u32(t) >> 7), t | 61)))
        return _u32(t ^ (_u32(t) >> 14)) / 4294967296

    return rng


def seeded_shuffle(items: Sequence[T], seed: int) -> list[T]:
    """A Fisher-Yates shuffle driven by ``mulberry32``, as ``seededShuffle``."""
    rng = mulberry32(seed)
    out = list(items)
    for i in range(len(out) - 1, 0, -1):
        j = int(rng() * (i + 1))
        out[i], out[j] = out[j], out[i]
    return out
