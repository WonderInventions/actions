# Roam GitHub Actions

## Post a chat message
```yml
      - uses: WonderInventions/actions/post-message@master
        with:
          api-key: ${{ secrets.ROAM_API_KEY }}
          chat-id: ${{ vars.DEVOPS_CHAT_ID }}
          text: Chat messsage here.
```

Text mode is backward compatible and sends to `https://api.ro.am/v0/chat.post`.

## Post a block message
```yml
      - uses: WonderInventions/actions/post-message@master
        with:
          api-key: ${{ secrets.ROAM_API_KEY }}
          chat-id: ${{ vars.DEVOPS_CHAT_ID }}
          color: good
          blocks: |
            [{"type":"section","text":{"type":"mrkdwn","text":"*Deploy finished*"}}]
```

Block mode sends to `https://api.ro.am/v1/chat.post`.

Notes:
- `text` and `blocks` are mutually exclusive.
- `blocks` is forwarded raw without action-side parsing or validation.
- In block mode, `chat-id` is mapped into the matching v1 destination field: `chatId`, `groupId`, or `userIds`.
