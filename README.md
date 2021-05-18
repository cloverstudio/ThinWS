# ThinWS

This is a custom websocket server and client wrapper created in mind for horizontal scalability. It uses redis pub/sub for communication between multiple server instances. You can run multiple server apps (which create a thinWS Server object) behind a load balancer like nginx or HAProxy. This package uses npm package [websocket](https://www.npmjs.com/package/websocket) as its underlying websocket server. 

Written in typescript.


## Installation
`npm install thinws`  or   `npm i thinws`

## Server

The server works as a standalone (no needed modification), but you can write your own listener functions for events. By default, the server receives messages that contain information about the "room" they are intended for and publishes the message to redis, and then all the servers subscribed to that room (including the one sending the message) receives the message. 


#### Message types


### Message structure

    {
        messageID: string,
        type: string,
        roomID: string   
        connectionID: string  
        payload: any
    }

roomID parameter is required (for subscribe, unsubscribe and message types)and is there for the server to know which room to send the payload to.

type parameter is required and notes the type of the message (connect, disconnect, subscribe, unsubscribe, ack)

messageID is required and is there if you want to implement the acknowledge functionality

connectionID is required for subscribe and unsubscribe only.

payload: JSON data, whatever you want






### Events
connect,
disconnect,
subscribe,
unsubscribe,
message

#### Importing the ThinWSServer to your project
`import {ThinWSServer} from 'thinws'`

#### Creating a new ThinWSServer instance
    
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

httpServer creation: 
    
    import http from 'http';
    const httpServer = http.createServer();
    
httpServer object can normally still use express and other options.
    
## Client

#### Importing the ThinWSClient to your project
`import {ThinWSClient} from 'thinws'`


## Notes
MIT license. Created by [Clover Studio Ltd.](https://clover.studio/)
