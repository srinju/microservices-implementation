"use strict";
//the worker picks up the porblem cheks the probelm and puts the status to the pubsub
//then the pub sub stores in db that the probelm was checked and ws server subscribes with the pubsub and returns the status of the probelm to the user
//we are just simulating a compiler here
//this mother fucker 
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
const redis_1 = require("redis");
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const client = (0, redis_1.createClient)();
const prisma = new client_1.PrismaClient();
function runWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.connect(); //connect to the redis client
        while (true) {
            const response = yield client.brPop("submissions", 0); //brpop 0 from the queue
            if (!response) {
                console.log('no response');
                return;
            }
            console.log("the unarsed response is : ", response);
            const parsedResponse = JSON.parse(response.element);
            console.log("parsed response id is : ", parsedResponse.problemId);
            console.log("parsed resonse payload : ", parsedResponse);
            try {
                //simulate the code check >
                const updatedSubmission = yield prisma.problem.update({
                    where: {
                        id: parsedResponse.problemId
                    },
                    data: {
                        status: "passed all test cases"
                    }
                });
                console.log('status of the problem updated');
                //publish to the pubsub>
                yield client.publish("submissionStatus", JSON.stringify(updatedSubmission));
                console.log('publised to the pubsub');
            }
            catch (error) {
                console.error("there was error in the worker", error);
            }
        }
    });
}
runWorker();
