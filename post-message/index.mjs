import core from "@actions/core";

try {
  const apiKey = core.getInput("api-key");
  const chatId = core.getInput("chat-id");
  const text = core.getInput("text");
  const link = core.getInput("link");
  const jobStatus = core.getInput("job-status");

  const color = jobStatus === "success" ? "good" : "danger"; //

  const body = JSON.stringify({
    chat: chatId,
    color: color,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text
        }
      },
    { "type": "divider" },
    {
      type: "context",
      elements: {
        type: "mrkdwn",
        text: link
      }
    }
    ]
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
    const errorBody = await response.text();
    core.error(`API request failed`);
    core.error(`Status: ${response.status} ${response.statusText}`);
    core.error(`Response body: ${errorBody}`);
    throw new Error(`HTTP ${response.status}`);
  }

  const responseData = await response.json();
  console.log("Response:", responseData);

} catch (error) {
  core.setFailed(error.message);
}