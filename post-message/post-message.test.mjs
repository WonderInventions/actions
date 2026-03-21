import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRequest,
  parseV1DestinationFromChatId,
  resolveMode,
} from "./post-message.mjs";

test("text mode routes to v0 with chat payload", () => {
  const request = buildRequest({
    apiKey: "secret",
    chatId: "G-11111111-1111-1111-1111-111111111111",
    text: "hello",
    blocks: "",
    color: "",
  });

  assert.equal(request.mode, "text");
  assert.equal(request.url, "https://api.ro.am/v0/chat.post");
  assert.equal(
    request.options.body,
    JSON.stringify({
      chat: "G-11111111-1111-1111-1111-111111111111",
      text: "hello",
    })
  );
});

test("resolveMode rejects both text and blocks", () => {
  assert.throws(
    () => resolveMode({ text: "hello", blocks: "[]" }),
    /either text or blocks, not both/i
  );
});

test("resolveMode rejects empty text and blocks", () => {
  assert.throws(
    () => resolveMode({ text: " ", blocks: "\n" }),
    /either text or blocks/i
  );
});

test("block mode routes to v1", () => {
  const request = buildRequest({
    apiKey: "secret",
    chatId: "11111111-1111-1111-1111-111111111111",
    text: "",
    blocks: '[{"type":"section"}]',
    color: "",
  });

  assert.equal(request.mode, "blocks");
  assert.equal(request.url, "https://api.ro.am/v1/chat.post");
});

test("raw UUID maps to chatId", () => {
  assert.deepEqual(
    parseV1DestinationFromChatId("11111111-1111-1111-1111-111111111111"),
    {
      field: "chatId",
      value: "11111111-1111-1111-1111-111111111111",
    }
  );
});

test("chat-tagged IDs map to chatId", () => {
  for (const tag of ["C", "D", "P", "T"]) {
    assert.deepEqual(
      parseV1DestinationFromChatId(
        `${tag}-11111111-1111-1111-1111-111111111111`
      ),
      {
        field: "chatId",
        value: "11111111-1111-1111-1111-111111111111",
      }
    );
  }
});

test("group-tagged IDs map to groupId", () => {
  for (const tag of ["G", "M"]) {
    assert.deepEqual(
      parseV1DestinationFromChatId(
        `${tag}-11111111-1111-1111-1111-111111111111`
      ),
      {
        field: "groupId",
        value: "11111111-1111-1111-1111-111111111111",
      }
    );
  }
});

test("user-tagged IDs map to userIds", () => {
  for (const tag of ["U", "B"]) {
    assert.deepEqual(
      parseV1DestinationFromChatId(
        `${tag}-11111111-1111-1111-1111-111111111111`
      ),
      {
        field: "userIds",
        value: ["11111111-1111-1111-1111-111111111111"],
      }
    );
  }
});

test("unsupported tagged IDs fail in block mode", () => {
  assert.throws(
    () =>
      parseV1DestinationFromChatId(
        "R-11111111-1111-1111-1111-111111111111"
      ),
    /unsupported chat-id tag/i
  );
});

test("block mode appends color only when present", () => {
  const withColor = buildRequest({
    apiKey: "secret",
    chatId: "11111111-1111-1111-1111-111111111111",
    text: "",
    blocks: '[{"type":"section"}]',
    color: "good",
  });
  assert.match(withColor.options.body, /"color":"good"/);

  const withoutColor = buildRequest({
    apiKey: "secret",
    chatId: "11111111-1111-1111-1111-111111111111",
    text: "",
    blocks: '[{"type":"section"}]',
    color: "",
  });
  assert.doesNotMatch(withoutColor.options.body, /"color":/);
});

test("color without blocks fails", () => {
  assert.throws(
    () =>
      buildRequest({
        apiKey: "secret",
        chatId: "G-11111111-1111-1111-1111-111111111111",
        text: "hello",
        blocks: "",
        color: "good",
      }),
    /color is only supported when sending blocks/i
  );
});

test("block mode preserves raw blocks verbatim", () => {
  const rawBlocks =
    '[{"type":"section","text":{"type":"mrkdwn","text":"hi"}},{"type":"divider"}]';
  const request = buildRequest({
    apiKey: "secret",
    chatId: "11111111-1111-1111-1111-111111111111",
    text: "",
    blocks: rawBlocks,
    color: "",
  });

  assert.match(
    request.options.body,
    new RegExp(`"blocks":${rawBlocks.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
  );
});

test("malformed blocks are still embedded without parsing", () => {
  const malformedBlocks = '[{"type":"section"}';
  const request = buildRequest({
    apiKey: "secret",
    chatId: "11111111-1111-1111-1111-111111111111",
    text: "",
    blocks: malformedBlocks,
    color: "",
  });

  assert.match(request.options.body, /"blocks":\[\{"type":"section"\}/);
});
