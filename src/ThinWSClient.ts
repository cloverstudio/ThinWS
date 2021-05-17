
interface Message {
    messageID: string,
    type: string,
    roomID?: string,
    connectionID?: string
    payload: any
  }

export class MyWebSocket{

    ws?: WebSocket;
    connectionID: string;
    url: string;
    userDefinedOnMessage?: (message:any)=>void;
    userDefinedOnOpen?: ()=>void;
    timeout?: number = 3 * 1000; //time (seconds) after connection error to try and reconnect
    messageIndex: number;
    
    constructor(url: string, connectionID: string, userDefinedMessage?: (message:any)=>any, userDefinedOnOpen?:()=>any, timeout?:number){
        this.messageIndex = Math.floor(Math.random()*(Number.MAX_SAFE_INTEGER));
        this.url = url;
        this.timeout = timeout;
        if(!connectionID){
            throw Error("connectionID is required");
        }
        this.connectionID = this.hashCode(connectionID);
        this.userDefinedOnMessage = userDefinedMessage;
        this.userDefinedOnOpen = userDefinedOnOpen;
        this.startup(this.url, connectionID);
    }

    startup = (url:string, connectionID: string)=>{
        this.ws = new WebSocket(url);
        
        this.ws.onclose=()=>{
            //console.log("Unexpectedly closed connection!");
            setTimeout(()=>this.startup(url, connectionID), this.timeout);
        }

        this.ws.onopen=()=>{
            try{
                this.connect();
                //console.log("Connected!")
                if(this.userDefinedOnOpen){
                    this.userDefinedOnOpen();
                }
            }catch(err){
                console.log(err);
                this.connect();
            }
        }

        this.ws.onmessage =(message: any)=>{
            //console.log(message.data);
            if(this.userDefinedOnMessage){
                this.userDefinedOnMessage(message.data);
            }
        } 
    }


    connect = ()=>{
        this.ws?.send(JSON.stringify({
            messageID: this.messageIndex++,
            type: "connect",
            connectionID: this.connectionID
        }));
    }


    subscribe = (roomID: string)=>{
        if(!roomID){
            throw Error("roomID is required!");
        }
        this.ws?.send(JSON.stringify({
            messageID: this.messageIndex++,
            type: "subscribe",
            roomID: roomID
        }));
    }


    unsubscribe = (roomID: string)=>{
        if(!roomID){
            throw Error("roomID is required!");
        }
        this.ws?.send(JSON.stringify( {
            messageID: this.messageIndex++,
            type: "unsubscribe",
            roomID: roomID,
        }))
    }


    disconnect = ()=>{
        this.ws?.send(JSON.stringify({
            messageID: this.messageIndex++,
            type: "disconnect",
        }));
    }


    send = ( message: string, roomID:string)=>{
        if(!roomID){
            throw Error("roomID is required!");
        }
        
        let msg = {
            messageID: this.messageIndex++,
            type: "message",
            message: message,
            roomID: roomID
        }
        
        this.ws?.send(JSON.stringify(msg));

        return msg.messageID;
    }


    getReadyState = ()=>{
        return this.ws?.readyState;
    }


    hashCode = (str: string) : string=> {
        var hash = 0, i, chr;
        if (str.length === 0) return hash.toString();
        for (i = 0; i < str.length; i++) {
          chr   = str.charCodeAt(i);
          hash  = ((hash << 5) - hash) + chr;
          hash |= 0; // Convert to 32bit integer
        }
        return hash.toString();
      };
    
};
