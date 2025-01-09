import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [socket , setSocket] = useState<null | WebSocket>(null);
  const [submissionId , setSubmissionId] = useState('');
  const [status , setStatus] = useState('');
  const [code,setCode] = useState('');
  const [language,setLanguage] = useState('');

  useEffect(() => { 

    const ws = new WebSocket('ws://localhost:8000'); //connect to the ws server

    ws.onopen = () => { //when the connection opens 
      setSocket(ws); //set the state to the ws connection
      console.log('connected with the ws server!!');
    }

    ws.onmessage = (message) => {
      //whenever there is a message >
      try {
        //console.log("the message is : ",message);
        const data = JSON.parse(message.data); //parse the message from the ws server
        //console.log('message received is : ' , data);
        if(data.id === submissionId){  //check if the submissionId of the data is = to the submissionId that is being submitted>
          setStatus(data.status); //set the status as received from the ws server
        }
      } catch (error) {
        console.error('error receiving/parsing the message from the ws server' , error);
      }
    }

    /*
    //handle ws closure>
    ws.onclose = () => {
      console.log('websocket connecction closed');
    }

    //cleanup on unmount>
    return () => {
      ws.close();
    }
      */

  },[submissionId]);

  const handleSubmit = async () => {
    if(!submissionId || !code || !language){
      alert("please enter all the fields");
    }

    try {
      const response = await fetch('http://localhost:3000/submit',{
        method : 'POST',
        headers : {
          'Content-Type' : 'application/json',
        },
        body : JSON.stringify({
          problemId:submissionId,
          language : language,
          code : code
        })
      });

      if(response.ok){
        console.log("problem submmitteed successfully!");
        //register the submsiion id to the websocket server>
        if(socket && socket.readyState === WebSocket.OPEN){
          socket.send(JSON.stringify({submissionId})); //send the submisiion id to the ws server
          console.log("submission id sent to the ws server");
        } else {
          console.error("websocket is not open!");
        }
      } else {
        console.error("error submitting probelm");
      }

    } catch (error) {
      console.error("there was an error while submitting the problem!!" , error);
    }
  }

  return (
    <div className='bg-slate-700'>
      <div className='flex'>
        <div className='border-black'>
          {/* SELECT SUBMISSION ID */}
          <input
            type="text"
            placeholder="enter the submission id"
            value = {submissionId}
            onChange={(e ) => setSubmissionId(e.target.value)}
          />
        </div>

        <div className='border-black'>
          {/*  SELECT LANGUAGE  */}
          <input
            type="text"
            placeholder="enter the language of the code"
            value={language}
            onChange = {(e) => setLanguage(e.target.value)}
          />
        </div>

        <div className='border-black'>
          {/* TYPE THE CODE */}
          <input
            type="text"
            placeholder="enter the code here"
            value= {code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <div className='border-black'>
          <button
            onClick={handleSubmit}
          >Submit</button>
        </div>

        <div>
          <h1>{status || 'verifying the code'}</h1>
        </div>
      </div>
      
    </div>
  )
}

export default App
