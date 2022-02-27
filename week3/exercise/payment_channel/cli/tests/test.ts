import { assert, expect } from "chai";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import * as borsh from "borsh";
import { SCHEMA, MultisigAccount } from "../instructions";
import { getCreateMultisigAccountTx } from "../transactions";
import { createMultisig } from "@solana/spl-token";
import {
  getKeypair,
  getProgramId,
  getMultisigKeypair,
  Numberu32,
} from "../utils";
import * as mocha from "mocha";

const connection = new Connection("http://127.0.0.1:8899", "confirmed");
const myLocalKeypair = getKeypair();
const owner1 = myLocalKeypair;
const owner2 = new Keypair();
const owner3 = new Keypair();
const PROGRAM_ID = getProgramId();

describe("Multi-sig", () => {
  it("Should create a multi-sig", async () => {
    // gets multisig keypair from cli/multisig_wallet/
    // const multisig_account = getMultisigKeypair();
    const multisig_account = new Keypair();

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
      myLocalKeypair,
      connection,
      MULTISIG_ACCOUNT_SIZE,
      multisig_account.publicKey
    );

    const createMultisigTx = new TransactionInstruction({
      keys: [
        {
          pubkey: multisig_account.publicKey,
          isSigner: false,
          isWritable: true,
        },
      ],
      programId: PROGRAM_ID,
      data: data,
    });

    const tx = new Transaction().add(createAccountTx, createMultisigTx);

    await connection.sendTransaction(tx, [myLocalKeypair, multisig_account], {
      preflightCommitment: "confirmed",
    });

    await delay(1000); // wait for data to be written

    const multisig_en = await connection.getProgramAccounts(PROGRAM_ID);
    const multisig_data = borsh.deserialize(
      SCHEMA,
      MultisigAccount,
      multisig_en[0].account.data
    );

    expect(multisig_data.nonce).to.equal(nonce);
    expect(multisig_data.owner_set_seq_no).to.equal(0);
    expect(Number(multisig_data.threshold)).to.equal(3);
    console.log(multisig_data.owners);
  });
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
