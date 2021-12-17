import React, { useEffect } from "react";
import './App.css';
import { ethers } from "ethers";
import { ToastContainer, toast } from 'react-toast'

const App = () => {


  /*
  * Just a state variable we use to store our user's public wallet.
  */
  const [currentAccount, setCurrentAccount] = React.useState("");

  const [totalYos, setTotalYos] = React.useState("");

  const [totalYoObjects, setTotalYoObjects] = React.useState([]);

  const [userMsg, setUserMsg] = React.useState("Thought Of You");

  const contractAddress = "0x9a6bd46D45d933326409cbdA26C5E7262dcb6007";

  const contractABI = [
    {
      "inputs": [],
      "stateMutability": "payable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "message",
          "type": "string"
        }
      ],
      "name": "NewYo",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "newTotalYoCount",
          "type": "uint256"
        }
      ],
      "name": "UpdatYoCount",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "getTotalYoObjects",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "yoInitiator",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "message",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            }
          ],
          "internalType": "struct WavePortal.Yo[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTotalYos",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "lastYoedAt",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_message",
          "type": "string"
        }
      ],
      "name": "sayYo",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  const isWalletConnected  = async () => {
    try {
      const { ethereum } = window;
      
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      
      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
      } else {
        console.log("No authorized account found")
        setTotalYos('Connect metamask to find total Yo\'s')
      }
    } catch (error) {
      console.log(error);
    }
  }


  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
      updateTotalYos();
    } catch (error) {
      console.log(error)
    }
  }

  

  const yo = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {

        const wavePortalContract = getContract();
        
        toast.info('Total Yo\'s will be updated after confirmations on blockchain')
        let count = await wavePortalContract.getTotalYos();
        


        setTotalYos(count.toNumber());
        
        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.sayYo(userMsg,{ gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalYos();
        console.log("Retrieved total yo count...", count.toNumber());
        setTotalYos(count.toNumber());

        getTotalYoObjects();
        toast.success('Total Yo\'s Updated Successfully👋')
      } else {
        console.log("Ethereum object doesn't exist in number of Yo's function!");
      }
    } catch (error) {
      toast.error("You can only Yo at me once every 3mins.");
      console.log('error: ',error);
    }
   }

  const getTotalYoObjects = async () => {
    const { ethereum } = window;

    if(ethereum){
      let yoContract = getContract();
      let tempTotalYoObjects = await yoContract.getTotalYoObjects();

      let finalYoObjs = [];
      tempTotalYoObjects.forEach(yoObject => {
        finalYoObjs.push({
          address : yoObject.yoInitiator,
          timestamp : new Date(yoObject.timestamp * 1000),
          message : yoObject.message
        })
        
      });

      console.log('finalYoObjs: ',finalYoObjs);

      setTotalYoObjects(finalYoObjs);

    

           yoContract.on("NewYo", (from, timestamp, message) => {
          console.log("NewYo =>", from, timestamp, message);

          

          setTotalYoObjects(prevState => [...prevState, {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message
          }]);

          
        });

        yoContract.on("UpdateTotalYos",(newTotalYos)=>{
          console.log("new total yos value: ",newTotalYos);
          setTotalYos(newTotalYos.toNumber());
        });

    }
  }
  
  const getContract = () => {
    let wavePortalContract;

     try {
      const { ethereum } = window;

      if (ethereum) {
       
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        const signer = provider.getSigner();

        wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        
        return wavePortalContract;
      }else {
        return wavePortalContract;
      }
     } catch(error){
       console.log("Error in getting contract: ",error)
       return wavePortalContract;
     }
  }

  const updateTotalYos = async () => {
     const wavePortalContract =  getContract();
     if(!wavePortalContract){
       setTotalYos('You need to have metamask in your browser')
       return;
     }
     setTotalYos('Loading..');
     let count = await wavePortalContract.getTotalYos();
     console.log("current total Yo on initialization: ",count.toNumber());
     setTotalYos(count.toNumber());
  }

  const onHandleMessageUpdate = (event) => {
    setUserMsg(event.target.value);
  }

  useEffect(() => {
    
    isWalletConnected();
    getTotalYoObjects();
    updateTotalYos();
    
    
  },[]);
  
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        👋 Yo!
        </div>

        <div className="bio">
          Hi there, I'm Ace, tell me something,or ask me any question, I might quote your Yo and answer on <a href="https://twitter.com/ace_rbk">twitter.</a> or just click Yo, to send a message :)
          <br/>
          1.Connect Wallet
          <br/>
          2.Click Yo
        </div>

        <button className="button-53" onClick={yo}>
          Yo!
        </button>

    
          {!currentAccount && (
           <button className="button-53" onClick={connectWallet}>
            Connect Wallet
          </button>
          
          )}
          <label>Change Message Below(Optional): </label>
          <input type="text" class="button-53" defaultValue={userMsg} onChange={(event)=> {onHandleMessageUpdate(event)}}></input>
          <div className="header">
           <h3>Total Yo's: </h3>
           <h1>{totalYos||'0'}</h1>
          </div>

       <table class="styled-table">
  <thead>
  
    <tr>
      <th class="header">Message</th>
      <th class="header">Time</th>
      <th class="header">Address</th>
    
    </tr>
  </thead>
  <tbody>
    {totalYoObjects.map((yo, index) => {
          return (
            <tr key={index}>
              <td> {yo.message}</td>
              <td> {yo.timestamp.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric',hour:'numeric',minute:'numeric' })}</td>
              <td> {yo.address}</td>
              
              
            </tr>)
        })}
        Pagination?
  </tbody>
</table>
        
          
        <ToastContainer />
      </div>
    </div>
  );
}
export default App