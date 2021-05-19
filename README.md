# ThinWS

This npm package is still under development and may change considerably in the near future. Version 1.0.9 is the current one at the time of writing this readme.

This is a custom websocket server and client wrapper created in mind for horizontal scalability. It uses redis pub/sub for communication between multiple server instances. You can run multiple server node apps (which create a thinWSServer object) behind a load balancer like nginx or HAProxy. This package uses npm package [websocket](https://www.npmjs.com/package/websocket) as its underlying websocket server. 

Written in typescript.

The client library (ThinWSClient) has no extra dependencies (no need to install any extra packages) so it can be simply used in client side. You can use it with webpack/browserify or even just copy paste it as plain javascript and add it to your html.

You can also use only the server library if you want to implement your own client library (for eg. your client app is not a javascript based application).

## Installation
`npm install thinws`  or   `npm i thinws`

### How it works

The server and client work together like a WebSocket wrapper so you don't have to worry about the implementation details. The client library exposes methods for sending your custom messages and thats it. 

<br/>


## How to use
- npm install the package
- instantiate ThinWSServer object in your server (node) app
- instantiate ThinWSClient object in your client (js) app
- use the ThinWSClient methods to subscribe to rooms and send messages to them


<br/>

<br/>




## ThinWSServer - Server side wrapper

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
    
httpServer object can normally still use express and other options. If you want to use express, create the app and then pass the app to the createServer method. Like this:

    const httpServer = http.createServer(app);

### What next? 

Set the httpServer to listen on wanted port and the ThinWSServer object that you created will do everything for you.
Now your server is set up. You can handle the events if you want to. 

### Events - optional

All lowercase!
Subscribe to server events with custom listener functions (if you want to). The server extends the EventEmitter class so you can use .on functionality. Like this: 
    
    wsServer.on("message", ()=> { ... } );
    wsServer.on("connect", myCustomPredefinedFunction);
<br/>

#### Connect 
    connect
Happens when a new connection is accepted (client connects).
<br/>

#### Disconnect
    disconnect
Happens when a client disconnects.
<br/>

#### Subscribe
    subscribe
Happens when a client subscribes to a room.
<br/>

#### Unsubscribe
    unsubscribe
Happens when a client unsubscribes from a room.
<br/>

#### Message
    message
Happens when a server receives a message.
    
<br/>
<br/>

## ThinWSClient - Client side wrapper

#### Importing the ThinWSClient to your project

`import {ThinWSClient} from 'thinws'`

or if you're using vanilla javascript (doesn't support imports) we suggest using a bundler (allows to use npm package in browser). You can even copy paste the ThinWSClient.js code to your script if you don't want to use bundlers.  

### Creating the client - constructor explained

    const customWSClient = new ThinWSClient(url, connectionID, onMessage, onOpen);
    
`url` is your websocket server url (eg. ws://localhost:8080)

`connectionID` is your client app identifier - this has to be the same every time so the server knows what rooms to join on connection (YOU DECIDE WHAT THIS ID IS)

`onMessage` is your custom message handler function - it gets a `message` object (param), then you can use that message to do whatever you want (show to screen, store to db...)

`onOpen` (optional) this is where you can add custom code to trigger when the connections is done connecting
    
So an example of creation would look like this:
    
    const wsURL = "ws://localhost:8080";
    const connectionID = clientID;              //string
    const onMessage = (message)=> { console.log(message);  ... };      //message is JSON
    const onOpen = ()=> { ... };
    
    const wsClient = new ThinWSClient(wsURL, connectionID, onMessage, onOpen);

## Client methods

All lowercase! Call them like this:
    
    wsClient.send(message, roomID);

### Connect 

This method is called from the constructor so you don't have to worry about it. It connects the client to all his previously subscribed rooms.

    connect()
    

### Subscribe

    subscribe(roomID)

Subscribes the client to get message from the room, and the client is able to send messages to the room.


### Send

    send(payload, roomID)
    
Sends the given payload to a room. Payload can be any JSON object. roomID is string.

### Unsubscribe

    unsubscribe(roomID)

Unsubscribes the client from the room, permanently. Client can no longer send or receive messages from/to the room

### Disconnect

    disconnect()

This method is not neccessary to call but helps the server to close the connection gracefully. This can be called when the user closes the browser tab or something like that. If the client disconnects without calling this, the server will still disconnect without problem, it will just use a bit more resources.


    
### What to do after creating the client

From the perspective of the client application, this is all you have to do. 

Intended flow of messages:

<br/>

1 ) client app creates the ThinWSClient instance - the instance will send the `connect` message to the server to inititate the connection and connect to client's existing rooms (if there are any)

    const wsClient = new ThinWSClient(url, connectionID, onMessage, onOpen);
   


<br/>


2A ) client app initiates `subscribe` (via the ThinWSClient method with the same name) - sends `subscribe` message and subscribes the client to the new room

<br/>

2B ) client app initiates `message` (via the ThinWSClient method) with payload to one of the connected rooms - sends `message` message to the room

<br/>

optional ) client app sends `unsubscribe` - unsubscribe from the room

<br/>

optional ) client app sends `disconnect` - this is not needed, but is welcome as it uses less resources than the force quit method, this can be called `onwindowunload`

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
