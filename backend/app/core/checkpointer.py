from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver 
import aiosqlite


class _LazyAioSqliteConn:
    """A small helper that lazily opens an aiosqlite connection when awaited and
    provides an `is_alive()` method expected by AsyncSqliteSaver.

    This mirrors the minimal interface AsyncSqliteSaver checks for in its `setup()`
    method: call `is_alive()` to see if the connection is ready; if not, awaiting
    the object should initialize and return an `aiosqlite.Connection`.
    """

    def __init__(self, conn_string: str):
        self._conn_string = conn_string
        self._conn: aiosqlite.Connection | None = None

    def is_alive(self) -> bool:
        return self._conn is not None

    def __await__(self):
        async def _connect():
            if self._conn is None:
                self._conn = await aiosqlite.connect(self._conn_string)
            return self._conn

        return _connect().__await__()

    def __getattr__(self, attr: str):
        # Delegate attribute access to the underlying connection once it's created.
        if self._conn is None:
            raise AttributeError(
                f"Underlying connection not initialized; call `await` the lazy connection first ({attr})"
            )
        return getattr(self._conn, attr)

    async def aclose(self):
        """Close the underlying connection if it was created."""
        if self._conn is not None:
            await self._conn.close()
            self._conn = None


async def get_checkpointer():
    # Return an AsyncSqliteSaver that uses a lazily-initialized connection object
    return AsyncSqliteSaver(_LazyAioSqliteConn("chat-history.db"))