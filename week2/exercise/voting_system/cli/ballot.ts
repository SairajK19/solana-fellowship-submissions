import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

import { getProgramId, getKeypair, getPublicKey } from "./utils";

const ballot = async () => {
  const ballotProgramId = getProgramId();
  const userKeypair = getKeypair();
  const connection = new Connection("http://localhost:8899", "confirmed");

  const ballotTran = new TransactionInstruction({
    programId: ballotProgramId,
    keys: [],
    data: Buffer.from("sairaj"),
  });

  const tx = new Transaction().add(ballotTran);

  await connection
    .sendTransaction(tx, [userKeypair], {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    })
};

ballot();