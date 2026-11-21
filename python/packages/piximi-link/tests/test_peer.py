import asyncio

import pytest
from piximi_schema.rpc import INTERNAL_ERROR, METHOD_NOT_FOUND

from piximi_link import BackendError, Peer, RequestCancelled, RpcClosedError, RpcRemoteError
from piximi_link.transports import loopback_pair


@pytest.fixture
async def peers():
    a, b = loopback_pair()
    client, server = Peer(a), Peer(b)
    client.start()
    server.start()
    yield client, server
    await client.close()
    await server.close()


async def test_answers_requests_from_either_side(peers):
    client, server = peers

    async def echo(params, _ctx):
        return params

    async def double(params, _ctx):
        return params * 2

    server.on_request("echo", echo)
    client.on_request("double", double)
    assert await client.request("echo", {"a": 1}) == {"a": 1}
    assert await server.request("double", 21) == 42


async def test_delivers_notifications(peers):
    client, server = peers
    seen = []
    server.on_notification("hello", seen.append)
    client.notify("hello", {"from": "client"})
    await asyncio.sleep(0.01)
    assert seen == [{"from": "client"}]


async def test_binary_larger_than_a_frame_survives(peers):
    client, server = peers
    blob = bytes(i % 251 for i in range(5 * 1024 * 1024))

    async def size(params, _ctx):
        return {"length": len(params["data"]), "data": params["data"]}

    server.on_request("size", size)
    result = await client.request("size", {"data": blob})
    assert result["length"] == len(blob)
    assert result["data"] == blob


async def test_unknown_method(peers):
    client, _ = peers
    with pytest.raises(RpcRemoteError) as info:
        await client.request("nope")
    assert info.value.code == METHOD_NOT_FOUND


async def test_backend_error_round_trips(peers):
    client, server = peers

    async def fail(_params, _ctx):
        raise BackendError("MODEL_NOT_FOUND", 'No model "x"')

    server.on_request("fail", fail)
    with pytest.raises(BackendError) as info:
        await client.request("fail")
    assert info.value.code == "MODEL_NOT_FOUND"
    assert info.value.message == 'No model "x"'


async def test_unexpected_failure_is_internal_error(peers):
    client, server = peers

    async def boom(_params, _ctx):
        raise TypeError("bad")

    server.on_request("boom", boom)
    with pytest.raises(RpcRemoteError) as info:
        await client.request("boom")
    assert info.value.code == INTERNAL_ERROR
    assert info.value.message == "bad"


async def test_progress_arrives_before_result(peers):
    client, server = peers

    async def work(params, ctx):
        assert "progressToken" in params
        for percent in (10, 50, 100):
            ctx.progress({"percent": percent, "message": "…"})
        return "done"

    server.on_request("work", work)
    seen = []
    result = await client.request("work", {"n": 1}, on_progress=seen.append)
    assert result == "done"
    assert [v["percent"] for v in seen] == [10, 50, 100]


async def test_cancel_reaches_the_handler(peers):
    client, server = peers

    async def slow(_params, ctx):
        await ctx.wait_cancelled()
        raise RequestCancelled()

    server.on_request("slow", slow)
    cancel = asyncio.Event()
    task = asyncio.create_task(client.request("slow", cancel=cancel))
    await asyncio.sleep(0.01)
    cancel.set()
    with pytest.raises(RequestCancelled):
        await task


async def test_cancelled_handler_may_answer_with_partial_result(peers):
    client, server = peers

    async def slow(_params, ctx):
        await ctx.wait_cancelled()
        return {"cancelled": True, "added": 2}

    server.on_request("slow", slow)
    cancel = asyncio.Event()
    task = asyncio.create_task(client.request("slow", cancel=cancel))
    await asyncio.sleep(0.01)
    cancel.set()
    assert await task == {"cancelled": True, "added": 2}


async def test_closing_rejects_pending_requests(peers):
    client, server = peers

    async def forever(_params, ctx):
        await ctx.wait_cancelled()
        return None

    server.on_request("forever", forever)
    task = asyncio.create_task(client.request("forever"))
    await asyncio.sleep(0.01)
    await server.close()
    with pytest.raises(RpcClosedError):
        await task
    await asyncio.sleep(0.01)
    assert client.closed


async def test_writer_stops_when_the_other_side_closes(peers):
    a, b = peers
    await a.close()
    await b.wait_closed()
    for _ in range(5):
        await asyncio.sleep(0)
    assert b.closed and b._writer is not None and b._writer.done()
