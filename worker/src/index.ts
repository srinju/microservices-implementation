

//the worker picks up the porblem cheks the probelm and puts the status to the pubsub
//then the pub sub stores in db that the probelm was checked and ws server subscribes with the pubsub and returns the status of the probelm to the user
//we are just simulating a compiler here
//this mother fucker 

import { createClient } from "redis";
import express from 'express';
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(express.json());
const client = createClient();
const prisma = new PrismaClient();

async function runWorker() {
    
    await client.connect(); //connect to the redis client
    while(true){
        const response = await client.brPop("submissions" , 0); //brpop 0 from the queue
        if(!response){
            console.log('no response');
            return;
        }
        console.log("the unarsed response is : ",response);
        const parsedResponse = JSON.parse(response.element);
        console.log("parsed response id is : " , parsedResponse.problemId);
        console.log("parsed resonse payload : ",parsedResponse);
        try {
            //simulate the code check >
            const updatedSubmission = await prisma.problem.update({
                where:{
                    id : parsedResponse.problemId
                },
                data : {
                    status : "passed all test cases"
                }
            });
            console.log('status of the problem updated');
            //publish to the pubsub>
            await client.publish("submissionStatus" , JSON.stringify(updatedSubmission)); 
            console.log('publised to the pubsub');
        } catch (error) {
            console.error("there was error in the worker",error);
        }
    }
}

runWorker();