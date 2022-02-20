import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { getCandidatePublicKey, getProgramId } from "../utils";

const BALLOT_PROGRAM_ID = getProgramId();

/**
 * Transaction for creating a proposal in the ballot program
 * @param userKeypair payer of the transaction
 * @param proposalAccount state account which will store porposal state
 * @param ballotAccount state account which will store ballot state
 * @param candidateKeypair keypair of the candidate
 * @param data instruction buffer
 */
export const getCreateProposalTx = (
  userKeypair: Keypair,
  proposalAccount: PublicKey,
  ballotAccount: PublicKey,
  candidateKeypair: Keypair,
  data: Buffer
) => {
  return new TransactionInstruction({
    programId: BALLOT_PROGRAM_ID,
    keys: [
      { pubkey: userKeypair.publicKey, isSigner: true, isWritable: false },
      { pubkey: proposalAccount, isSigner: false, isWritable: true },
      { pubkey: ballotAccount, isSigner: false, isWritable: true },
    ],
    data: data,
  });
};

/**
 * Transaction for calling instruction for voting on the ballot program
 * @param vote_account public key of the state account of voter
 * @param name name of the candidate to vote to
 * @param data instruction buffer
 */
export const getCreateVoteTx = async (
  vote_account: PublicKey,
  name: string,
  data: Buffer
) => {
  return new TransactionInstruction({
    programId: BALLOT_PROGRAM_ID,
    keys: [
      {
        // voter account
        pubkey: vote_account,
        isSigner: false,
        isWritable: true,
      },
      {
        // proposals proposal account
        pubkey: await PublicKey.createWithSeed(
          getCandidatePublicKey(name),
          "candidate",
          BALLOT_PROGRAM_ID
        ),
        isWritable: true,
        isSigner: false,
      },
    ],
    data,
  });
};

export const getSubscribeForVotingTx = async (
  vote_account: PublicKey,
  data
) => {
  return new TransactionInstruction({
    programId: BALLOT_PROGRAM_ID,
    keys: [{ pubkey: vote_account, isSigner: false, isWritable: true }],
    data: data,
  });
};

export const getGiveRightToVotingTx = async (
  vote_account: PublicKey,
  ballot_account: PublicKey,
  userKeypair: Keypair,
  data: Buffer
) => {
  return new TransactionInstruction({
    programId: BALLOT_PROGRAM_ID,
    keys: [
      { pubkey: userKeypair.publicKey, isSigner: true, isWritable: false },
      { pubkey: ballot_account, isSigner: false, isWritable: true },
      { pubkey: vote_account, isSigner: false, isWritable: true },
    ],
    data: data,
  });
};

/**
 * Transaction for creating the proposal account
 * @param PROPOSAL_ACC_SIZE size that the state account will have
 * @param connection connection to the RPC
 * @param userKeypair keypair of the payer
 * @param proposalAccount proposal account public key
 * @param candidateKeypair candidate keypair from which the account was created
 */
export const getCreateProposalAccountTx = async (
  PROPOSAL_ACC_SIZE: number,
  connection: Connection,
  userKeypair: Keypair,
  proposalAccount: PublicKey,
  candidateKeypair: Keypair
) => {
  const proposaAccountTx = SystemProgram.createAccountWithSeed({
    space: PROPOSAL_ACC_SIZE,
    lamports: await connection.getMinimumBalanceForRentExemption(
      PROPOSAL_ACC_SIZE
    ),
    fromPubkey: userKeypair.publicKey,
    newAccountPubkey: proposalAccount,
    programId: BALLOT_PROGRAM_ID,
    seed: "candidate",
    basePubkey: candidateKeypair.publicKey,
  });

  return proposaAccountTx;
};

export const getCreateVoterAccountTx = async (
  VOTE_ACCOUNT_SIZE: number,
  userKeypair: Keypair,
  vote_account: PublicKey,
  connection: Connection
) => {
  const voteAccountTx = SystemProgram.createAccountWithSeed({
    fromPubkey: userKeypair.publicKey,
    basePubkey: userKeypair.publicKey,
    newAccountPubkey: vote_account,
    lamports: await connection.getMinimumBalanceForRentExemption(
      VOTE_ACCOUNT_SIZE
    ),
    space: VOTE_ACCOUNT_SIZE,
    programId: BALLOT_PROGRAM_ID,
    seed: "voter",
  });

  return voteAccountTx;
};
