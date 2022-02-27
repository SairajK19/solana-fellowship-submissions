import {
  AccountMeta,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  CustomTransactionInstruction,
  MultisigAccount,
  SCHEMA,
  TransactionAccount,
  TransferParams,
} from "./instructions";
import * as borsh from "borsh";
import {
  getKeypair,
  getMultisigKeypair,
  getProgramId,
  Numberu32,
} from "./utils";
import { getCreateMultisigAccountTx } from "./transactions";

const PROGRAM_ID = getProgramId();
const userKeypair = getKeypair();
const owner1 = new Keypair();
const owner2 = new Keypair();
const owner3 = new Keypair();
const connection = new Connection("http://127.0.0.1:8899", "confirmed");

const createMultisig = async () => {
  // gets multisig keypair from cli/multisig_wallet/
  const multisig_account = getMultisigKeypair();

  const [multisigSigner, nonce] = await PublicKey.findProgramAddress(
    [multisig_account.publicKey.toBuffer()],
    PROGRAM_ID
  ); // signer account, will contain the lamports

  const multisig_account_data = new MultisigAccount({
    owners: [
      owner1.publicKey.encode(),
      owner2.publicKey.encode(),
      owner3.publicKey.encode(),
    ],
    nonce: nonce,
    owner_set_seq_no: 0,
    threshold: 3,
  });
  const multisig_account_data_en = borsh.serialize(
    SCHEMA,
    multisig_account_data
  );
  const MULTISIG_ACCOUNT_SIZE = multisig_account_data_en.length;
  const buffers = [
    Buffer.from(Int8Array.from([0])),
    new Numberu32(MULTISIG_ACCOUNT_SIZE).toBuffer(),
    Buffer.from(multisig_account_data_en),
  ];

  const data = Buffer.concat(buffers);

  const createAccountTx = await getCreateMultisigAccountTx(
    userKeypair,
    connection,
    MULTISIG_ACCOUNT_SIZE,
    multisig_account.publicKey
  );

  const createMultisigTx = new TransactionInstruction({
    keys: [
      { pubkey: multisig_account.publicKey, isSigner: false, isWritable: true },
    ],
    programId: PROGRAM_ID,
    data: data,
  });

  const tx = new Transaction().add(createAccountTx, createMultisigTx);

  await connection.sendTransaction(tx, [userKeypair, multisig_account], {
    preflightCommitment: "confirmed",
  });
};

const getProgramAccount = async () => {
  const multisig_en = await connection.getProgramAccounts(PROGRAM_ID);
  const data = borsh.deserialize(
    SCHEMA,
    MultisigAccount,
    multisig_en[0].account.data
  );
  console.log(data);
};

const createTransaction = async () => {
  const transaction = new Keypair();

  const multisig = getMultisigKeypair();

  const [multisigSigner, nonce] = await PublicKey.findProgramAddress(
    [multisig.publicKey.toBuffer()],
    PROGRAM_ID
  ); // signer account, will contain the lamports

  const transaction_data = SystemProgram.transfer({
    fromPubkey: multisigSigner,
    toPubkey: owner1.publicKey,
    lamports: 0.1 * LAMPORTS_PER_SOL,
  });

  const transaction_data2 = SystemProgram.transfer({
    fromPubkey: multisigSigner,
    toPubkey: owner1.publicKey,
    lamports: 0.1 * LAMPORTS_PER_SOL,
  });

  const account = [
    {
      pubkey: multisigSigner,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: owner1.publicKey,
      isWritable: true,
      isSigner: false,
    },
  ];

  console.log(transaction_data);

  const tranferParamKey1 = new TransferParams({
    pubkey: transaction_data.keys[0].pubkey.encode(),
    isSigner: transaction_data.keys[0].isSigner,
    isWritable: transaction_data.keys[0].isWritable,
  });

  const tranferParamKey2 = new TransferParams({
    pubkey: transaction_data.keys[1].pubkey.encode(),
    isSigner: transaction_data.keys[1].isSigner,
    isWritable: transaction_data.keys[1].isWritable,
  });

  const tranferParamKey1_en = borsh.serialize(SCHEMA, tranferParamKey1);
  const tranferParamKey2_en = borsh.serialize(SCHEMA, tranferParamKey2);

  const transactionIns = new CustomTransactionInstruction({
    data: new Uint8Array(Buffer.from(transaction_data.data)),
    keys: [tranferParamKey1_en, tranferParamKey2_en],
    programId: PROGRAM_ID.encode(),
  });

  const data = borsh.serialize(SCHEMA, transactionIns);
  console.log(data);

  // const data2 = borsh.serialize(SCHEMA, transaction_data2);

  const transaction_account_data = new TransactionAccount({
    accounts: [account],
    data: [data, data],
    did_execute: 0,
    multisig: multisig.publicKey.encode(),
    program_ids: [PROGRAM_ID.encode()],
    signers: [multisig.publicKey.encode(), owner1.publicKey.encode()],
  });

  const data3 = borsh.serialize(SCHEMA, transaction_account_data);
  console.log(data3)

  const buffers = [
    Buffer.from(Int8Array.from([1])),
    new Numberu32(data3.length).toBuffer(),
    Buffer.from(data3),
  ];

  const result = Buffer.concat(buffers);

  const creatTransactionAccountTx = SystemProgram.createAccount({
    fromPubkey: userKeypair.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(data3.length),
    newAccountPubkey: transaction.publicKey,
    programId: PROGRAM_ID,
    space: data3.length,
  });

  console.log(data3)

  const createMultisigTx = new TransactionInstruction({
    keys: [
      // { pubkey: multisig.publicKey, isSigner: false, isWritable: true },
      // { pubkey: owner1.publicKey, isSigner: true, isWritable: true },
      { pubkey: transaction.publicKey, isSigner: false, isWritable: true },
    ],
    programId: PROGRAM_ID,
    data: result,
  });

  const tx = new Transaction().add(creatTransactionAccountTx, createMultisigTx);

  await connection.sendTransaction(tx, [userKeypair, transaction], {
    preflightCommitment: "confirmed",
  });
};

// createMultisig();
// getProgramAccount();
createTransaction();
