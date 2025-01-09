//primary backend gets the problem from the user and stores it in the database with the status unchecked
//push the problem to the redis queue for the workers to pickup the program and run the program on the worker

import { PrismaClient } from '@prisma/client';
import express from 'express';
import { createClient } from 'redis';
import cors from 'cors';

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors());

const client = createClient();

const prisma = new PrismaClient();

(async () => { //when the backend starts the redis connection is done not like whenevr the request is made to /submit it connects
    try {
        await client.connect(); //connnect to redis client once
        console.log("redis client connected!!")    
    } catch (error) {
        console.error("error occured connecting to redis : " , error);
    }
})(); //if we connect the redis to the /submit that is when each request comes then after the first request the message will be not
//uploaded to the redis queue as the conncection will be disconnected

app.post('/submit' , async (req , res) => {
    const {problemId , language ,  code } = req.body;
    //console.log("body is" , problemId,language,code);
    try {
        //console.log("control reached route /submit");
        //store the probelm in the database as the status as unchecked
        await prisma.problem.create({
            data : {
                id : problemId,
                language : language,
                code : code,
                status : "unchecked"
            }
        });
        //now push the problem to the redis queue>
        await client.lPush("submissions" , JSON.stringify({problemId,language,status : "unchecked",code})); //push the body to the queue
        
        res.status(200).json({
            message : "submission done successfully"
        })
    } catch (error) {
        console.error("there was an error while submitting the problem");
        res.status(500).json({
            message : "internal server error"
        });
    }
});

app.listen(PORT , () => {
    console.log(`primary backend is running on port ${PORT}` );
});