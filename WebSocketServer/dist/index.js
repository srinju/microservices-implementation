"use strict";
//web socket server
//subscribes to pub sub
//gets the status of the problem and show to user
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const redis_1 = require("redis");
const ws_1 = require("ws");
const app = (0, express_1.default)();
const httpSerer = app.listen(8000);
const wss = new ws_1.WebSocketServer({ server: httpSerer });
const client = (0, redis_1.createClient)();
const submissionClients = new Map(); //map to store each ws client with a particular submission id . otherwise all clients connected with the server sees the same shit .
//if no create the map then . supppose i submitted a porblem and saw satus as checked then the other client will also see status checked without even submitting a problem
//main operation >
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //connect to redis
        yield client.connect();
        //subscribe to the pubsub>
        yield client.subscribe("submissionStatus", (message) => {
            console.log(`message received from the pubsub ${message}`);
            //parse the message from the pubsub>
            const { id, status } = JSON.parse(message);
            /*
            console.log("after json.parse(message)");
            console.log("the id is : ",id);
            console.log("the status is : " , status);
            console.log("submissions client map : ",submissionClients);
            */
            //find websocket connection for the specific submisision id >
            const wsClient = submissionClients.get(id);
            if (wsClient && wsClient.readyState === ws_1.WebSocket.OPEN) {
                wsClient.send(JSON.stringify({ id, status })); //send the data to the associated client
                console.log(`Message sent to client for submissionId : ${id}`);
            }
            else {
                console.log(`no active web socket connection for the submissionId : ${id}`);
            }
        });
        console.log('subscribed to redis channel : submissionStatus');
    }
    catch (error) {
        console.error('erorr setting up redis subscription : ', error);
    }
}))();
wss.on('connection', function conncection(socket) {
    return __awaiter(this, void 0, void 0, function* () {
        //on connection with the ws server .. associate the ws client with a submissionId
        console.log("ws connection established!!");
        //handle client message to register submission id
        socket.on('message', (data) => {
            console.log("the data is wihtout converting into string : ", data);
            const messageString = data.toString(); //we are converting the data to string as ts complains as the message received from the redis pubsub channel can be either string arraybuffer buffer 
            console.log("the message string is : ", messageString);
            const { submissionId } = JSON.parse(messageString);
            console.log("submission id is  : ", submissionId);
            if (submissionId) {
                //associate the ws with a the submissionId
                console.log("socket : ", socket);
                submissionClients.set(submissionId, socket);
                console.log(`web socket connection established for the submijssion id ${submissionId}`);
            }
        });
        //handle disconnection of ws client>
        socket.on('close', () => {
            //remove the client from the map when they disconnect>
            for (const [key, client] of submissionClients.entries()) { //for the key value pair in the submissonclient map
                if (client === socket) { //if the client is same as the ws server that is closing then remove the connection
                    submissionClients.delete(key); //delete the submissionId
                    console.log(`websocket connection removed for submissionID : ${key}`);
                    break;
                }
            }
        });
        socket.on('error', (error) => {
            console.error("there was an error in the websocket server : ", error);
        });
    });
});
