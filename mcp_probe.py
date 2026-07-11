"""Prove the MCP servers are real MCP, not plain Python wrappers with a suggestive folder
name: spawn each one as its own subprocess and talk actual MCP protocol to it over stdio
with a real client (list_tools, call_tool) -- the same mechanism any MCP client (Claude
Code, another agent) would use, not an internal Python import.

    python mcp_probe.py
"""

from __future__ import annotations

import asyncio
import sys

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

_PYTHON = sys.executable


async def _probe(name: str, module: str, tool_name: str, arguments: dict) -> None:
    print(f"\n{name} ({module})")
    print("-" * 96)
    params = StdioServerParameters(command=_PYTHON, args=["-m", module])
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            print(f"tools exposed over MCP: {[t.name for t in tools.tools]}")

            result = await session.call_tool(tool_name, arguments=arguments)
            text = "".join(b.text for b in result.content if b.type == "text")
            print(f"call_tool({tool_name!r}, {arguments}) -> {text[:400]}")


async def main() -> None:
    await _probe(
        "Federal Register MCP server", "mcp_servers.federal_register.server",
        "list_recent_documents", {"limit": 3},
    )
    await _probe(
        "Notion tracker MCP server", "mcp_servers.notion_tracker.server",
        "search_tracker", {"search_term": "", "limit": 3},
    )
    await _probe(
        "Google Drive MCP server", "mcp_servers.google_drive.server",
        "search_drive_documents", {"query": "policy", "limit": 3},
    )
    print("\nAll three servers answered over real MCP protocol (stdio, list_tools + call_tool) "
          "-- not a Python import.")


if __name__ == "__main__":
    asyncio.run(main())
