"use strict";
//primary backend gets the problem from the user and stores it in the database with the status unchecked
//push the problem to the redis queue for the workers to pickup the program and run the program on the worker
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
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const redis_1 = require("redis");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = 3000;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const client = (0, redis_1.createClient)();
const prisma = new client_1.PrismaClient();
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield client.connect(); //connnect to redis client once
        console.log("redis client connected!!");
    }
    catch (error) {
        console.error("error occured connecting to redis : ", error);
    }
}))();
app.post('/submit', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { problemId, language, code } = req.body;
    console.log("body is", problemId, language, code);
    try {
        console.log("control reached route /submit");
        //store the probelm in the database as the status as unchecked
        const problem = yield prisma.problem.create({
            data: {
                id: problemId,
                language: language,
                code: code,
                status: "unchecked"
            }
        });
        //now push the problem to the redis queue>
        yield client.lPush("submissions", JSON.stringify({ problemId, language, status: "unchecked", code })); //push the body to the queue
        res.status(200).json({
            message: "submission done successfully"
        });
    }
    catch (error) {
        console.error("there was an error while submitting the problem");
        res.status(500).json({
            message: "internal server error"
        });
    }
}));
app.listen(PORT, () => {
    console.log(`primary backend is running on port ${PORT}`);
});
