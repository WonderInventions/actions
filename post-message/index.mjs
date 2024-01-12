import core from "@actions/core";

try {
  const apiKey = core.getInput("api-key");
  const chatId = core.getInput("chat-id");
  const text = core.getInput("text");

  const body = JSON.stringify({
    chat: chatId,
    text,
  });
  const response = await fetch("https://api.ro.am/v0/chat.post", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseData = await response.json();
  console.log("Response:", responseData);
} catch (error) {
  core.setFailed(error.message);
}
