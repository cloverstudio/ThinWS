# ThinWS

This npm package is still under development and may change considerably in the near future. Version 1.0.9 is the current one in the time of writing this readme.

This is a custom websocket server and client wrapper created in mind for horizontal scalability. It uses redis pub/sub for communication between multiple server instances. You can run multiple server apps (which create a thinWS Server object) behind a load balancer like nginx or HAProxy. This package uses npm package [websocket](https://www.npmjs.com/package/websocket) as its underlying websocket server. 

Written in typescript.

The client library (ThinWSClient) has no extra dependencies (no need to install any extra packages) so it can be simply used in client side. You can use it with webpack/browserify or even just copy paste it as plain javascript and add it to your html

## Installation
`npm install thinws`  or   `npm i thinws`

### How it works

The server and client work together like a WebSocket wrapper so you don't have to worry about the implementation details. The client library exposes methods for sending your custom messages and thats it. 

<br/>


## How to use
- install the package
- instantiate ThinWSServer object in your server (node) app
- instantiate ThinWSClient object in your client (js) app
- use the ThinWSClient methods to send whatever messages you like


Advanced: you could implement your own client library if you're not working with javascript or want to change something to your liking
<br/>

<br/>

### What to do after creating the client

From the perspective of the client application, this is all you have to do to get this working. Details of every method (names, parameters...) can be found below in "Client" section

Intended flow of messages:

1 ) client app creates the ThinWSClient instance - the instance will send the `connect` message to the server to inititate the connection and connect to client's existing rooms (if there are any)

2A ) client app initiates `subscribe` (via the ThinWSClient method with the same name) - sends `subscribe` message and subscribes the client to the new room

2B ) client app initiates `message` (via the ThinWSClient method) with payload to one of the connected rooms - sends `message` message to the room

optional ) client app sends `unsubscribe` - unsubscribe from the room

optional ) client app sends `disconnect` - this is not needed, but is welcome as it uses less resources than the force quit method, this can be called `onwindowunload`


<br/>


## Server

The server works as a standalone (no needed modification), but you can write your own listener functions for events. By default, the server can receive a message that contains information about the "room" they are intended for and publishes the message to redis, and then all the servers subscribed to that room (including the one sending the message) will receive the message. 







<br/>




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

### Events
connect,
disconnect,
subscribe,
unsubscribe,
message
    
<br/>
<br/>

## Client

#### Importing the ThinWSClient to your project
`import {ThinWSClient} from 'thinws'`


<br/>
<br/>


## Informational
### Internal message structure - this is only informational

    {
        messageID: string,
        type: string,
        roomID: string   
        connectionID: string  
        payload: any
    }

`roomID`        - required and is there for the server to know which room is the message for.

Note: you don't need to worry about the rest of the parameters, the library will handle that for you. This is here for informational purposes.


`type`          - required and notes the type of the message (connect, disconnect, subscribe, unsubscribe, ack)

`messageID`     - required and is there if you want to implement the acknowledge functionality

`connectionID`  - required for subscribe and unsubscribe only

`payload`       - JSON data, whatever you want


<br/>



#### Message types (client sends to server)

`connect` - connect to all rooms of an user (specified by connectionID)

`disconnect` - disconnect from all rooms of an user

`subscribe`- subscribe/connect to a new room

`unsubscribe` - unsubscribe/delete an existing room from user

`message` - message that carries payload


#### Message types (server sends to client)

`ack` - acknowledge that server received the message


<br/>
<br/>

## Notes
MIT license. Created by [Clover Studio Ltd.](https://clover.studio/)
