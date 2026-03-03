import core from "@actions/core";

try {
  const apiKey = core.getInput("api-key");
  const chatId = core.getInput("chat-id");
  const payloadInput = core.getInput("payload");
  const jobStatus = core.getInput("job-status");

  let payload = JSON.parse(payloadInput);
  const { title, text, link } = payload;

  const color = jobStatus ? (jobStatus === "success" ? "good" : "danger") : "warning";

  const body = JSON.stringify({
    chat: chatId,
    color: color,
    blocks: [
      {
        type: "header",
        text: {
          type: "mrkdwn",
          text: title
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text
        }
      },
      { type: "divider" },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: link
          }
        ]
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