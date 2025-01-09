leetcode like architecture with microservices . the user sends the problem to the primary backend , the primary backend pushesh the probelm to a redis queue , the workers picks up the probelm from the queue processes it and publishes the test cases result to a pub sub and the web socket server subscribes to the pub sub and sends the result to clnt

![alt text](image.png)