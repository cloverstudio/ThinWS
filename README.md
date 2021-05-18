# ThinWS

This is a custom websocket server and client wrapper created in mind for horizontal scalability. It uses redis pub/sub for communication between multiple server instances. You can run multiple server apps (which create a thinWS Server object) behind a load balancer like nginx or HAProxy and this will still work. This package uses npm package "websocket" as its underlying websocket protocol. `https://www.npmjs.com/package/websocket`



## Installation
`npm install thinws` or  `npm i thinws`

## Server

## Client



## Notes
MIT license. Created by Clover Studio Ltd. `https://clover.studio/`