import * as core from "@actions/core";

const TAGGED_ID_PATTERN =
  /^([A-Za-z])-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

function hasNonEmptyInput(value) {
  return value.trim() !== "";
}

function resolveMode({ text, blocks }) {
  const hasText = hasNonEmptyInput(text);
  const hasBlocks = hasNonEmptyInput(blocks);

  if (hasText && hasBlocks) {
    throw new Error("Provide either text or blocks, not both.");
  }
  if (!hasText && !hasBlocks) {
    throw new Error("Provide either text or blocks.");
  }

  return hasBlocks ? "blocks" : "text";
}

function parseV1DestinationFromChatId(chatId) {
  const trimmed = chatId.trim();
  const match = TAGGED_ID_PATTERN.exec(trimmed);
  if (!match) {
    throw new Error(
      `Unsupported chat-id: ${trimmed}. Expected a tagged ID.`
    );
  }

  const [, rawTag, id] = match;
  const tag = rawTag.toUpperCase();
  switch (tag) {
    case "C":
    case "D":
    case "P":
    case "T":
      return { field: "chatId", value: id };
    case "G":
    case "M":
      return { field: "groupId", value: id };
    case "U":
    case "B":
      return { field: "userIds", value: [id] };
    default:
      throw new Error(`Unsupported chat-id tag: ${tag}.`);
  }
}

function buildV1TextPayloadObject({ chatId, text }) {
  const destination = parseV1DestinationFromChatId(chatId);
  return {
    [destination.field]: destination.value,
    text,
  };
}

function buildV1PayloadString({ chatId, blocks, color }) {
  const destination = parseV1DestinationFromChatId(chatId);
  const fragments = [
    `${JSON.stringify(destination.field)}:${JSON.stringify(destination.value)}`,
    `${JSON.stringify("blocks")}:${blocks}`,
  ];

  if (hasNonEmptyInput(color)) {
    fragments.push(`${JSON.stringify("color")}:${JSON.stringify(color)}`);
  }

  return `{${fragments.join(",")}}`;
}

function buildRequest({ apiKey, chatId, text, blocks, color }) {
  const mode = resolveMode({ text, blocks });

  if (mode === "text" && hasNonEmptyInput(color)) {
    throw new Error("color is only supported when sending blocks.");
  }

  const body =
    mode === "blocks"
      ? buildV1PayloadString({ chatId, blocks, color })
      : JSON.stringify(buildV1TextPayloadObject({ chatId, text }));

  return {
    url: "https://api.ro.am/v1/chat.post",
    options: {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
    },
  };
}

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) {
    return { raw: "", parsed: "" };
  }

  try {
    return {
      raw: text,
      parsed: JSON.parse(text),
    };
  } catch {
    return {
      raw: text,
      parsed: text,
    };
  }
}

async function run() {
  try {
    const apiKey = core.getInput("api-key");
    const chatId = core.getInput("chat-id");
    const text = core.getInput("text");
    const blocks = core.getInput("blocks", { trimWhitespace: false });
    const color = core.getInput("color");

    const request = buildRequest({
      apiKey,
      chatId,
      text,
      blocks,
      color,
    });
    const response = await fetch(request.url, request.options);
    const responseBody = await parseResponseBody(response);

    if (!response.ok) {
      const details = responseBody.raw ? `: ${responseBody.raw}` : "";
      throw new Error(`HTTP error ${response.status}${details}`);
    }

    console.log("Response:", responseBody.parsed);
  } catch (error) {
    core.setFailed(error.message);
  }
}

await run();
