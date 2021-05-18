# ThinWS

This npm package is still under development and may change considerably in the near future. Version 1.0.9 is the current one in the time of writing this readme.

This is a custom websocket server and client wrapper created in mind for horizontal scalability. It uses redis pub/sub for communication between multiple server instances. You can run multiple server apps (which create a thinWS Server object) behind a load balancer like nginx or HAProxy. This package uses npm package [websocket](https://www.npmjs.com/package/websocket) as its underlying websocket server. 

Written in typescript.


## Installation
`npm install thinws`  or   `npm i thinws`

<br/>

## Server

The server works as a standalone (no needed modification), but you can write your own listener functions for events. By default, the server receives messages that contain information about the "room" they are intended for and publishes the message to redis, and then all the servers subscribed to that room (including the one sending the message) receives the message. 


#### Message types (client sends to server)
`connect` - connect to all rooms of an user (specified by connectionID)
`disconnect` - disconnect from all rooms of an user
`subscribe`- subscribe/connect to a new room
`unsubscribe` - unsubscribe/delete an existing room from user
`message` - message that carries payload

#### Message types (server sends to client)
`ack` - acknowledge that server received the message

### Message structure

    {
        messageID: string,
        type: string,
        roomID: string   
        connectionID: string  
        payload: any
    }

Note: if you just use the ThinWSClient you don't need to worry about the parameters, the client side library will handle that for you


`roomID`        - required (for subscribe, unsubscribe and message types) and is there for the server to know which room to send the payload to.

`type`          - required and notes the type of the message (connect, disconnect, subscribe, unsubscribe, ack)

`messageID`     - required and is there if you want to implement the acknowledge functionality

`connectionID`  - required for subscribe and unsubscribe only.

`payload`       - JSON data, whatever you want



<br/>


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
    
    
<br/>
    
## Client

#### Importing the ThinWSClient to your project
`import {ThinWSClient} from 'thinws'`


<br/>
<br/>

## Notes
MIT license. Created by [Clover Studio Ltd.](https://clover.studio/)
