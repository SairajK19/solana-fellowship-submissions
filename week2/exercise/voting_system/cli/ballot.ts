import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { serialize, deserialize } from "borsh";
import { Buffer } from "buffer";
import {
  getProgramId,
  getKeypair,
  getCandidateKeypair,
  getCandidatePublicKey,
  getEmptyAddressBuffer,
} from "./utils";
import {
  BallotAccount,
  ProposalAccount,
  SCHEMA,
  VoteAccount,
} from "./instructions/schema";
import { Numberu32 } from "./utils";
import {
  getCreateProposalAccountTx,
  getCreateProposalTx,
  getCreateVoterAccountTx,
  getCreateVoteTx,
  getGiveRightToVotingTx,
  getSubscribeForVotingTx,
} from "./transactions";

const ballotProgramId = getProgramId();
const userKeypair = getKeypair();
const connection = new Connection("http://localhost:8899", "confirmed");

const candidates = ["Satoshi", "Anatoly", "Vitalik"];

const initBallot = async () => {
  const ballot_data = new BallotAccount({
    total_proposals: 0,
    winner_address: getEmptyAddressBuffer(),
    chairperson: getEmptyAddressBuffer(),
    initialized: 0,
  });
  const BALLOT_ACCOUNT_SIZE = serialize(SCHEMA, ballot_data).length;
  const buffers = [Buffer.from(Int8Array.from([3]))];
  const data = Buffer.concat(buffers);

  const ballotAccount = await PublicKey.createWithSeed(
    userKeypair.publicKey,
    "ballot",
    ballotProgramId
  );

  // creates the ballot state account
  const createBallotAccountTx = SystemProgram.createAccountWithSeed({
    basePubkey: userKeypair.publicKey,
    fromPubkey: userKeypair.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(
      BALLOT_ACCOUNT_SIZE
    ),
    newAccountPubkey: ballotAccount,
    programId: ballotProgramId,
    seed: "ballot",
    space: BALLOT_ACCOUNT_SIZE,
  });

  const initBallotTx = new TransactionInstruction({
    keys: [
      { pubkey: userKeypair.publicKey, isSigner: true, isWritable: false },
      { pubkey: ballotAccount, isSigner: false, isWritable: true },
    ],
    programId: ballotProgramId,
    data: data,
  });

  try {
    const tx = new Transaction().add(createBallotAccountTx, initBallotTx);
    await connection.sendTransaction(tx, [userKeypair]);
  } catch (err) {
    console.log(err.logs);
    console.error("Make sure you have deployed the program.");
    console.error("OR");
    console.error("You have already created the ballot!");
  }
};

/**
 * Creates a proposal account and sends to the program.
 */
const generateProposal = async (name: string) => {
  console.log(`Creating proposal of ${name}`);
  const proposal_data = new ProposalAccount({
    name: name,
    total_votes: 0,
  });
  const input = serialize(SCHEMA, proposal_data);
  const PROPOSAL_ACC_SIZE = input.length;
  const buffers = [
    Buffer.from(Int8Array.from([0])),
    new Numberu32(input.length).toBuffer(),
    Buffer.from(input),
  ];
  const data = Buffer.concat(buffers);
  const candidateKeypair = getCandidateKeypair(name);

  // creates an account for candidate to store propsal data.
  const proposalAccount = await PublicKey.createWithSeed(
    candidateKeypair.publicKey,
    "candidate",
    ballotProgramId
  );

  const ballotAccount = await PublicKey.createWithSeed(
    userKeypair.publicKey,
    "ballot",
    ballotProgramId
  );

  // creates a transaction for creating proposal account to store state.
  const createProposaAccountTx = await getCreateProposalAccountTx(
    PROPOSAL_ACC_SIZE,
    connection,
    userKeypair,
    proposalAccount,
    candidateKeypair
  );

  // transaction for program instruction to save proposal account state.
  const proposalTx = getCreateProposalTx(
    userKeypair,
    proposalAccount,
    ballotAccount,
    candidateKeypair,
    data
  );

  try {
    const tx = new Transaction().add(createProposaAccountTx, proposalTx);

    await connection.sendTransaction(tx, [userKeypair, candidateKeypair], {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
  } catch (err) {
    console.log(err.logs);
    console.error("You have already created the proposals!");
  }
};

const subscribeForVoting = async () => {
  console.log("Creating vote account and initializing...");
  const vote_data = new VoteAccount({
    weight: 1,
    delegate: getEmptyAddressBuffer(),
    vote: getEmptyAddressBuffer(),
    voted: 0,
  });
  const input = serialize(SCHEMA, vote_data);
  const VOTE_ACCOUNT_SIZE = input.length;
  const buffers = [
    Buffer.from(Uint8Array.from([4])),
    new Numberu32(VOTE_ACCOUNT_SIZE).toBuffer(),
    Buffer.from(input),
  ];

  // creates an account for storing voters data.
  const vote_account = await PublicKey.createWithSeed(
    userKeypair.publicKey,
    "voter",
    ballotProgramId
  );

  // transaction for creating voters account to store state.
  const createVoteAccountTx = await getCreateVoterAccountTx(
    VOTE_ACCOUNT_SIZE,
    userKeypair,
    vote_account,
    connection
  );

  const subscribeForVotingTx = await getSubscribeForVotingTx(
    vote_account,
    Buffer.concat(buffers)
  );

  try {
    const tx = new Transaction().add(createVoteAccountTx, subscribeForVotingTx);

    await connection.sendTransaction(tx, [userKeypair], {
      preflightCommitment: "confirmed",
    });
  } catch (err) {
    console.error("You have already created the account!");
  }
};

const giveRightToVote = async () => {
  console.log("Giving right to vote.");

  const buffers = [Buffer.from(Uint8Array.from([5]))];
  const data = Buffer.concat(buffers);

  const vote_account = await PublicKey.createWithSeed(
    userKeypair.publicKey,
    "voter",
    ballotProgramId
  );

  const ballot_account = await PublicKey.createWithSeed(
    userKeypair.publicKey,
    "ballot",
    ballotProgramId
  );

  const giveRightToVoteTx = await getGiveRightToVotingTx(
    vote_account,
    ballot_account,
    userKeypair,
    data
  );

  const tx = new Transaction().add(giveRightToVoteTx);

  await connection.sendTransaction(tx, [userKeypair], {
    preflightCommitment: "confirmed",
  });
};

/**
 * Creates a vote account and votes a particular candidate.
 * @param name vote -> to
 */
const vote = async (name: string) => {
  console.log("Voting");
  const buffers = [Buffer.from(Uint8Array.from([1]))];
  const data = Buffer.concat(buffers);

  // creates an account for storing voters data.
  const vote_account = await PublicKey.createWithSeed(
    userKeypair.publicKey,
    "voter",
    ballotProgramId
  );

  // transaction for calling instruction on program to store
  // voters state.
  const voteInstructionTx = await getCreateVoteTx(vote_account, name, data);

  try {
    const tx = new Transaction().add(voteInstructionTx);

    await connection.sendTransaction(tx, [userKeypair], {
      preflightCommitment: "confirmed",
    });
  } catch (err) {
    console.log(err.logs);
  }
};

const generateCandidates = async () => {
  candidates.map((candidate) => {
    generateProposal(candidate);
  });
};

const getCandidates = async (candidatePubkey: PublicKey) => {
  const programAccounts = await connection.getAccountInfo(candidatePubkey);
  const decodedData = deserialize(
    SCHEMA,
    ProposalAccount,
    programAccounts.data
  );

  console.log({ name: decodedData.name, total_votes: decodedData.total_votes });
};

const getCandidateInfos = async () => {
  candidates.map(async (candidate) => {
    var pubKey = getCandidatePublicKey(candidate);
    var candidateAccount = await PublicKey.createWithSeed(
      pubKey,
      "candidate",
      ballotProgramId
    );
    getCandidates(candidateAccount);
  });
  console.log(" ");
};

const getVoterInfo = async () => {
  var voterAccountPubkey = await PublicKey.createWithSeed(
    userKeypair.publicKey,
    "voter",
    ballotProgramId
  );
  const voterAccountDataEncoded = await connection.getAccountInfo(
    voterAccountPubkey
  );

  const decodedData = deserialize(
    SCHEMA,
    VoteAccount,
    voterAccountDataEncoded.data
  );

  console.log({
    weight: decodedData.weight,
    voted: decodedData.voted,
    delegate: new PublicKey(decodedData.delegate).toString(),
    vote: new PublicKey(decodedData.vote).toString(),
  });
};

const getWinner = async () => {
  console.log(" ");
  const buffers = [Buffer.from(Int8Array.from([2]))];

  const data = Buffer.concat(buffers);

  const winnerInstructionTx = new TransactionInstruction({
    keys: [
      {
        pubkey: await PublicKey.createWithSeed(
          getCandidatePublicKey("Satoshi"),
          "candidate",
          ballotProgramId
        ),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: await PublicKey.createWithSeed(
          getCandidatePublicKey("Anatoly"),
          "candidate",
          ballotProgramId
        ),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: await PublicKey.createWithSeed(
          getCandidatePublicKey("Vitalik"),
          "candidate",
          ballotProgramId
        ),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: await PublicKey.createWithSeed(
          userKeypair.publicKey,
          "ballot",
          ballotProgramId
        ),
        isSigner: false,
        isWritable: true,
      },
    ],
    programId: ballotProgramId,
    data,
  });

  const tx = new Transaction().add(winnerInstructionTx);

  await connection.sendTransaction(tx, [userKeypair], {
    preflightCommitment: "confirmed",
  });
};

const declareWinner = async () => {
  const ballotAccount = await PublicKey.createWithSeed(
    userKeypair.publicKey,
    "ballot",
    ballotProgramId
  );

  const encodedData = await connection.getAccountInfo(ballotAccount);
  const decodedData = deserialize(SCHEMA, BallotAccount, encodedData.data);

  const winner = new PublicKey(decodedData.winner_address);

  const encodedCandidateAccount = await connection.getAccountInfo(winner);
  const decodedCandidateAccount = deserialize(
    SCHEMA,
    ProposalAccount,
    encodedCandidateAccount.data
  );

  console.log(
    `Winner is ${decodedCandidateAccount.name}, address: ${winner.toString()}`
  );
  console.log(`With ${decodedCandidateAccount.total_votes} vote`);

  console.log(" ");
};

const main = async () => {
  initBallot(); // create ballot account
  await delay(5000);
  subscribeForVoting(); // creates vote account
  await delay(5000);
  getVoterInfo(); // gets the voters info
  await delay(5000);
  generateCandidates(); // creates 3 proposals
  await delay(5000);
  getCandidateInfos(); // gets the proposal account data
  await delay(5000);
  giveRightToVote(); // give right to vote
  await delay(5000);
  vote(candidates[1]); // votes a random candidate
  await delay(5000);
  getCandidateInfos(); // gets the proposal account data
  getWinner(); // gets the winner
  await delay(5000);
  declareWinner(); // gets ballot account data
};

main();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
