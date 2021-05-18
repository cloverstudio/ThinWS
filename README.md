# ThinWS

This is a custom websocket server and client wrapper created in mind for horizontal scalability. It uses redis pub/sub for communication between multiple server instances. You can run multiple server apps (which create a thinWS Server object) behind a load balancer like nginx or HAProxy. This package uses npm package [websocket](https://www.npmjs.com/package/websocket) as its underlying websocket server. 



## Installation
`npm install thinws` or  `npm i thinws`

## Server

### Importing the ThinWSServer to your project
`import {ThinWSServer} from 'thinws'`


## Client

### Importing the ThinWSClient to your project
`import {ThinWSClient} from 'thinws'`


## Notes
MIT license. Created by [Clover Studio Ltd.](https://clover.studio/)
