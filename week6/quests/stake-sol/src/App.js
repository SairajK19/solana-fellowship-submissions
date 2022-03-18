import logo from "./logo.svg";
import "./App.css";
import { useWallet, WalletProvider } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { stakeSOL } from "./utils/stakeSOL";

function App() {
  const { publicKey, connected, signTransaction } = useWallet();
  const [stakeSOLDetails, setStakeSOLDetails] = useState();

  const stakeSOLHandler = async () => {
    try {
      const totalSolToStake = 1 * LAMPORTS_PER_SOL;
      const provider = { isConnected: connected, publicKey, signTransaction };
      const connection = new Connection(clusterApiUrl("devnet"));
      const result = await stakeSOL(totalSolToStake, provider, connection);
      setStakeSOLDetails(result);
    } catch (err) {
      console.log("Err: ", err);
    }
  };

  useEffect(() => {}, [connected]);

  return (
    <div className="App">
      <header className="App-header">
        <WalletMultiButton />
        <button onClick={stakeSOLHandler}>
          {" "}
          {stakeSOLDetails && stakeSOLDetails.newStakingAccountPubKey
            ? `Staked SOL acccount: ${stakeSOLDetails.newStakingAccountPubKey}`
            : `Stake SOL`}{" "}
        </button>
      </header>
    </div>
  );
}

export default App;
