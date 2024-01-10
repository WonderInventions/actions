# Roam GitHub Actions

## Post a chat message
```yml
      - uses: WonderInventions/actions/post-message@master
        with:
          api-key: ${{ secrets.ROAM_API_KEY }}
          chat-id: ${{ vars.DEVOPS_CHAT_ID }}
          text: Chat messsage here.
```
