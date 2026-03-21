# Roam GitHub Actions

## Post a chat message
```yml
      - uses: WonderInventions/actions/post-message@master
        with:
          api-key: ${{ secrets.ROAM_API_KEY }}
          chat-id: ${{ vars.DEVOPS_CHAT_ID }}
          text: Chat messsage here.
```

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

The action always sends to `https://api.ro.am/v1/chat.post`.

Notes:
- `text` and `blocks` are mutually exclusive.
- `blocks` is forwarded raw without action-side parsing or validation.
- `chat-id` must be a tagged ID.
- Tagged `chat-id` values are mapped to the matching v1 destination field: `chatId`, `groupId`, or `userIds`.
