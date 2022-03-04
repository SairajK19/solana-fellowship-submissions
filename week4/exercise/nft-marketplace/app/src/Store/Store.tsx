import React from "react";
import { useCallback } from "react";

// web3 stuff
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import { actions, utils, programs, NodeWallet, Wallet } from "@metaplex/js";

// Wallet stuff
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";

function Store() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction, signAllTransactions } =
    useWallet();

  return <main></main>;
}

export default Store;
