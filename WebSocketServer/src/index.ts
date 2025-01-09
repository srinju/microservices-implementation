//web socket server
//subscribes to pub sub
//gets the status of the problem and show to user

import express from 'express';
import { createClient } from 'redis';
import { WebSocketServer , WebSocket } from 'ws';

const app = express();
const httpSerer = app.listen(8000);

const wss = new WebSocketServer({server : httpSerer});

const client = createClient();
const submissionClients = new Map(); //map to store each ws client with a particular submission id . otherwise all clients connected with the server sees the same shit .
//if no create the map then . supppose i submitted a porblem and saw satus as checked then the other client will also see status checked without even submitting a problem

//main operation >
(async () => { //when the server starts it subscribes to the pubsub
    try{
        //connect to redis
        await client.connect();
        //subscribe to the pubsub>
        await client.subscribe("submissionStatus" , (message) => {
            console.log(`message received from the pubsub ${message}`);
            //parse the message from the pubsub>
            const {id , status} = JSON.parse(message);
            /*
            console.log("after json.parse(message)");
            console.log("the id is : ",id);
            console.log("the status is : " , status);
            console.log("submissions client map : ",submissionClients);
            */
            //find websocket connection for the specific submisision id >
            const wsClient = submissionClients.get(id);
            if(wsClient && wsClient.readyState === WebSocket.OPEN){
                wsClient.send(JSON.stringify({id,status})); //send the data to the associated client
                console.log(`Message sent to client for submissionId : ${id}`);
            } else {
                console.log(`no active web socket connection for the submissionId : ${id}`);
            }
        });
        console.log('subscribed to redis channel : submissionStatus');
    } catch (error) {
        console.error('erorr setting up redis subscription : ' , error);
    }
})();


wss.on('connection' ,async function conncection(socket){

   //on connection with the ws server .. associate the ws client with a submissionId
   console.log("ws connection established!!");

   //handle client message to register submission id
   socket.on('message' , (data) => {
    //console.log("the data is wihtout converting into string : ",data);
    const messageString = data.toString(); //we are converting the data to string as ts complains as the message received from the redis pubsub channel can be either string arraybuffer buffer 
    //console.log("the message string is : ",messageString);
    const {submissionId} = JSON.parse(messageString); 
    //console.log("submission id is  : ",submissionId);
    if(submissionId){
        //associate the ws with a the submissionId
        //console.log("socket : " , socket);
        submissionClients.set(submissionId,socket); //setting the submissionId with a socket connection
        console.log(`web socket connection established for the submijssion id ${submissionId}`);
    }
   });

   //handle disconnection of ws client>
   socket.on('close' , () => {
    //remove the client from the map when they disconnect>
    for(const [key,client] of submissionClients.entries()){ //for the key value pair in the submissonclient map
        if(client ===socket){ //if the client is same as the ws server that is closing then remove the connection
            submissionClients.delete(key); //delete the submissionId
            console.log(`websocket connection removed for submissionID : ${key}`);
            break;
        }
    }
   });

   socket.on('error' , (error) => {
    console.error("there was an error in the websocket server : " , error);
   });

});

