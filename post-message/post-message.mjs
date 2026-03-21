import * as core from "@actions/core";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TAGGED_ID_PATTERN =
  /^([A-Za-z])-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function hasNonEmptyInput(value) {
  return value.trim() !== "";
}

export function resolveMode({ text, blocks }) {
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

export function parseV1DestinationFromChatId(chatId) {
  const trimmed = chatId.trim();
  if (UUID_PATTERN.test(trimmed)) {
    return { field: "chatId", value: trimmed };
  }

  const match = TAGGED_ID_PATTERN.exec(trimmed);
  if (!match) {
    throw new Error(
      `Unsupported chat-id for block mode: ${trimmed}. Expected a UUID or tagged ID.`
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
      throw new Error(
        `Unsupported chat-id tag for block mode: ${tag}.`
      );
  }
}

export function buildV0PayloadObject({ chatId, text }) {
  return {
    chat: chatId,
    text,
  };
}

export function buildV1PayloadString({ chatId, blocks, color }) {
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

export function resolveEndpoint(mode) {
  if (mode === "blocks") {
    return "https://api.ro.am/v1/chat.post";
  }
  return "https://api.ro.am/v0/chat.post";
}

export function buildRequest({ apiKey, chatId, text, blocks, color }) {
  const mode = resolveMode({ text, blocks });

  if (mode === "text" && hasNonEmptyInput(color)) {
    throw new Error("color is only supported when sending blocks.");
  }

  const url = resolveEndpoint(mode);
  const body =
    mode === "blocks"
      ? buildV1PayloadString({ chatId, blocks, color })
      : JSON.stringify(buildV0PayloadObject({ chatId, text }));

  return {
    mode,
    url,
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

export async function run({
  coreModule = core,
  fetchImpl = fetch,
  logger = console,
} = {}) {
  try {
    const apiKey = coreModule.getInput("api-key");
    const chatId = coreModule.getInput("chat-id");
    const text = coreModule.getInput("text");
    const blocks = coreModule.getInput("blocks", { trimWhitespace: false });
    const color = coreModule.getInput("color");

    const request = buildRequest({
      apiKey,
      chatId,
      text,
      blocks,
      color,
    });
    const response = await fetchImpl(request.url, request.options);
    const responseBody = await parseResponseBody(response);

    if (!response.ok) {
      const details = responseBody.raw
        ? `: ${responseBody.raw}`
        : "";
      throw new Error(`HTTP error ${response.status}${details}`);
    }

    logger.log("Response:", responseBody.parsed);
    return responseBody.parsed;
  } catch (error) {
    coreModule.setFailed(error.message);
    return undefined;
  }
}
