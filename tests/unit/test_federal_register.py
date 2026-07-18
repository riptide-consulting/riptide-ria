"""Offline unit tests for mcp_servers/federal_register/client.py's pure logic (no network)."""

from mcp_servers.federal_register.client import _strip_markup


def test_strip_markup_removes_tags_and_collapses_spaces():
    xml = "<RULE><PREAMB>  <AGENCY>FDA</AGENCY> requires  </PREAMB><P>immediate action</P></RULE>"
    cleaned = _strip_markup(xml)
    assert "<" not in cleaned and ">" not in cleaned
    assert "FDA" in cleaned and "immediate action" in cleaned
    assert "  " not in cleaned.replace("\n", " ")


def test_strip_markup_leaves_plain_text_untouched():
    plain = "This abstract has a < inequality > nowhere near the start."
    assert _strip_markup(plain) == plain
