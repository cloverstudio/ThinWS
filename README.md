# ThinWS

This is a custom websocket server and client wrapper created in mind for horizontal scalability. It uses redis pub/sub for communication between multiple server instances. You can run multiple server apps (which create a thinWS Server object) behind a load balancer like nginx or HAProxy. This package uses npm package [websocket](https://www.npmjs.com/package/websocket) as its underlying websocket server. 



## Installation
`npm install thinws`  or   `npm i thinws`

## Server

### Importing the ThinWSServer to your project
`import {ThinWSServer} from 'thinws'`

### Creating a new ThinWSServer instance
    
    const server = new ThinWSServer(redisConfig, httpServer);

As you can see, the constructor takes two objects, the first is the redis configuration options and the second is the httpServer.
Redis configuration example:

    redisConfig = {
      host: 'localhost',
      port: 6379,
      retry_strategy: ()=>{
          const n = 2;
          return n * 1000; // retry connection after n seconds
      },
      connectTimeout: 60*60*1000
    }

## Client

### Importing the ThinWSClient to your project
`import {ThinWSClient} from 'thinws'`


## Notes
MIT license. Created by [Clover Studio Ltd.](https://clover.studio/)
