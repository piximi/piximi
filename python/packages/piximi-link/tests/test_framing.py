import pytest

from piximi_link.framing import FRAME_VERSION, HEADER_BYTES, FramingError, Reassembler, frame_message


def pattern(length: int) -> bytes:
    return bytes((i * 7 + 3) % 256 for i in range(length))


def round_trip(payload: bytes, max_frame_bytes: int):
    reassembler = Reassembler()
    frames = list(frame_message(payload, 42, max_frame_bytes))
    result = None
    for frame in frames:
        assert result is None
        result = reassembler.push(frame)
    return frames, result


def test_small_message_is_one_fin_frame():
    frames, result = round_trip(pattern(5), 64)
    assert len(frames) == 1
    assert len(frames[0]) == HEADER_BYTES + 5
    assert frames[0][0] == FRAME_VERSION
    assert result == pattern(5)


def test_empty_message_is_one_frame():
    frames, result = round_trip(b"", 64)
    assert len(frames) == 1
    assert result == b""


def test_chunks_at_frame_limit_and_reassembles():
    payload = pattern(1000)
    frames, result = round_trip(payload, 64 + HEADER_BYTES)
    assert len(frames) == -(-1000 // 64)
    assert all(len(f) <= 64 + HEADER_BYTES for f in frames)
    assert result == payload


def test_interleaved_messages_stay_apart():
    reassembler = Reassembler()
    a = list(frame_message(pattern(100), 1, 40 + HEADER_BYTES))
    b = list(frame_message(pattern(90), 2, 40 + HEADER_BYTES))
    results = []
    for i in range(max(len(a), len(b))):
        for frames in (a, b):
            if i < len(frames):
                done = reassembler.push(frames[i])
                if done is not None:
                    results.append(done)
    assert results == [pattern(100), pattern(90)]


def test_rejects_unknown_version():
    (frame,) = frame_message(pattern(3), 1, 64)
    with pytest.raises(FramingError, match="version 9"):
        Reassembler().push(bytes([9]) + frame[1:])


def test_rejects_out_of_order_chunk():
    _, second = list(frame_message(pattern(100), 1, 40 + HEADER_BYTES))[:2]
    with pytest.raises(FramingError, match="out of order"):
        Reassembler().push(second)
