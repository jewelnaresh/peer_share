# Peer Share
An anonymouse way to transfer files over the internet peer to peer.

This uses webRTC to transfer files and a go websocket server as the webRTC signalling server.

## Benefits
- Transfer files without creating any account.
- Completely anonymouse noting is stored on the server and temporary data for signalling is stored in memory and deleted after use.
- No need to upload data to a third party website.
## Todo
 - Only texts are transferred, need to add support for binary data.
 - Make the signalling process easier by generating a url and sending the data via websockets
## Notes
TURN servers will not be supported as they defeat the goal of transferring files peer to peer without relaying the data to a centralized server.
