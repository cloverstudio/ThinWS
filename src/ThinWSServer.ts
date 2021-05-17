import http from "http";
import ws from "websocket";
import redis, { RedisClient } from "redis";
import { connection } from "websocket";
import EventEmitter from "events";
import { v4 as uuid } from "uuid";

interface ConnectionWrapper {
  connection: connection;
  _id: string;
  [key: string]: any;
  //closedGracefully: boolean
} //end connectionWrapper


interface Message {
  messageID: string,
  type: string,
  roomID?: string,
  connectionID?: string
  payload: any
}


class CustomWebsocketServer extends EventEmitter {
  subscriber: RedisClient;
  publisher: RedisClient;
  dataStore: RedisClient;
  channelsToConnectionMap: { [key: string]: Set<ConnectionWrapper> };
  websocketServer: ws.server;
  serverReady: boolean = false;
  subscriberReady: boolean = false;
  publisherReady: boolean = false;
  dataStoreReady: boolean = false;

  constructor(config: any, httpServer: http.Server) {
    super();

    this.channelsToConnectionMap = {};
    this.subscriber = redis.createClient(config);
    this.publisher = redis.createClient(config);
    this.dataStore = redis.createClient(config);

    this.setupRedisHandling();
    
    this.websocketServer = new ws.server({
      httpServer: httpServer,
    });

    this.subscriber.on("message", (roomID, message) => {
      try {
        this.channelsToConnectionMap[roomID].forEach(
          (con: ConnectionWrapper) => {
            con.connection.send(message);
          }
        );
      } catch (error) {
        console.log(error);
        // TODO error handling
      }
    });

    this.websocketServer.on("request", (request) =>
      this.setupConnection(request)
    );
  } //end constructor


  setupRedisHandling() {
    this.subscriber.on("end", ()=>{
      this.subscriberReady = false;
      this.serverReady = false;
    });
    this.publisher.on("end", ()=>{
      this.publisherReady = false;
      this.serverReady = false;
    });
    this.dataStore.on("end", ()=>{
      this.dataStoreReady = false;
      this.serverReady = false;
    });


    this.subscriber.on("ready",()=>{
      console.log("Subscriber ready");
      this.subscriberReady = true;
      if(this.subscriberReady && this.publisherReady && this.dataStoreReady) this.serverReady = true;
    });
    this.publisher.on("ready",()=>{
      console.log("Publisher ready");
      this.publisherReady = true;
      if(this.subscriberReady && this.publisherReady && this.dataStoreReady) this.serverReady = true;
    });
    this.dataStore.on("ready",()=> {
      console.log("DataStore ready");
      this.dataStoreReady = true;
      if(this.subscriberReady && this.publisherReady && this.dataStoreReady) this.serverReady = true;
    });



  }

  setupConnection = (request: ws.request): void => {
    
    const con = request.accept(undefined, request.origin);
    let cWrapper: ConnectionWrapper = { connection: con, _id: uuid() };

    cWrapper.connection.on("close", () => {
      if (!cWrapper.closedGracefully) {
        Object.keys(this.channelsToConnectionMap).forEach((key: any) => {
          if (this.channelsToConnectionMap[key]) {
            this.channelsToConnectionMap[key].delete(cWrapper);
            if (this.channelsToConnectionMap[key].size <= 0) {
              //console.log("No more connections for this channel!");
              //console.log("Unsubscribing redis!");
              this.subscriber.unsubscribe(key);
            }
          }
        });
        this.emit("disconnect");
      }

    });

    cWrapper.connection.on("message", (payload) => {
      this.handlePayload(payload, cWrapper);
    });
  }; //end setupConnection

  handlePayload = (payload: ws.IMessage, connection: ConnectionWrapper) => {
    if (payload.type == "utf8") {
      if(!this.serverReady){
        const serverErrorMessage = {
          type: "error",
          message: "Internal server error"
        }
        connection.connection.send(JSON.stringify(serverErrorMessage));
        return;
      }
      try {
        const message = JSON.parse(payload.utf8Data!);
        //console.log(message);

        if (message.type == "connect") {
          this.connect(message, connection);
        } else if (message.type == "subscribe") {
          this.subscribe(message, connection);
        } else if (message.type == "unsubscribe") {
          this.unsubscribe(message, connection);
        } else if (message.type == "disconnect") {
          this.disconnect(message, connection);
        } else if (message.type == "message") {
          this.handleMessage(message, connection);
        }

        //acknowledge the message was received
        const ackMessage = {
          type: "ack",
          messageID: message.messageID
        }
        connection.connection.send(JSON.stringify(ackMessage));

      } catch (err) {
        console.log(err);
        console.log("Invalid message received!");
      }
    } //TODO for binary data?
    else {
      console.log("Invalid message received!");
    }
  }; //end handlePayload

  join = (roomID: string, connection: ConnectionWrapper) => {
    if (!this.channelsToConnectionMap[roomID]) {
      this.channelsToConnectionMap[roomID] = new Set();
    }
    this.channelsToConnectionMap[roomID].add(connection);
    this.subscriber.subscribe(roomID);
  }; //end join

  connect = (message: Message, connection: ConnectionWrapper) => {
    // get all user's channels and join them
    if(message.connectionID)
      connection._id = message.connectionID;
    else
      return;
    if (!message.roomID) {
      return;
    }
    this.dataStore.smembers(connection._id, (err, reply) => {
      //console.log(reply);
      reply.forEach((c) => {
        this.join(c, connection);
      });
    });

    this.emit("connect");
  }; //end connect

  subscribe = (message: Message, connection: ConnectionWrapper) => {
    if (!message.roomID) {
      return;
    }
    const roomID = message.roomID;
    this.join(roomID, connection);
    //add to redis
    this.dataStore.sadd(connection._id, roomID);

    this.emit("subscribe");
  }; //end subscribe

  unsubscribe = (message: Message, connection: ConnectionWrapper) => {
    if(!message.roomID){
      return;
    }
    const roomID = message.roomID;
    this.channelsToConnectionMap[roomID].delete(connection);
    this.dataStore.srem(connection._id, roomID);

    this.emit("unsubscribe");
  }; //end unsubscribe

  disconnect = (message: Message, connection: ConnectionWrapper) => {
    
    this.dataStore.smembers(connection._id, (err, reply) => {
      reply.forEach((c) => {
        if (this.channelsToConnectionMap[c]) {
          this.channelsToConnectionMap[c].delete(connection);
          //console.log(this.channelsToConnectionMap[c]);
          if (this.channelsToConnectionMap[c].size <= 0) {
            //console.log("No more connections for this channel!");
            //console.log("Unsubscribing redis!");
            this.subscriber.unsubscribe(c);
          }
        }
      });
    });
    connection.closedGracefully = true;

    this.emit("disconnect");
  }; //end disconnect

  //sendToUser = () => {};

  //sendToRoom = () => {};

  handleMessage = (message: Message, connection: ConnectionWrapper) => {
    if (!message.roomID) {
      return;
    }
    let {messageID,...sendMessage} = message;
    
   
    this.publisher.publish(message.roomID, JSON.stringify(sendMessage));
    this.emit("message", message);
  }; //end handleMessage


  isServerReady = ()=>{
    return this.serverReady;
  }
 

} //end CustomWebSocketServer

export default CustomWebsocketServer;
