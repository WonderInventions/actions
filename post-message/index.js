const core = require("@actions/core");

try {
  const apiKey = core.getInput("api-key");
  const chatId = core.getInput("chat-id");
  const text = core.getInput("text");

  const data = {
    chat: chatId,
    text: text,
  };

  const response = await fetch("https://api.ro.am/v0/chat.post", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseData = await response.json();
  console.log("Response:", responseData);
} catch (error) {
  core.setFailed(error.message);
}
