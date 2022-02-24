const {
  Connection,
  SystemProgram,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");
const fs = require("mz/fs");

async function establishConnection() {
  const rpcUrl = "http://localhost:8899";

  const connection = new Connection(rpcUrl, "confirmed");

  const version = await connection.getVersion();

  console.log("Connection to cluster established:", rpcUrl, version);
  return connection;
}

async function createKeypairFromFile() {
  const secretKeyString = await fs.readFile(
    "/home/sairaj-kapdi/.config/solana/id.json",
    {
      encoding: "utf8",
    }
  );

  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));

  return Keypair.fromSecretKey(secretKey);
}

async function createAccount() {
  const connection = new Connection("http://localhost:8899", "confirmed");

  const signer = await createKeypairFromFile();

  const newAccountPubkey = await PublicKey.createWithSeed(
    signer.publicKey,
    "campaign1",
    new PublicKey("J9iUgxytByjcsXwxMN47J3MDwGfNQFnDirxWnabTQWLY")
  );

  const lamports = (await connection).getMinimumBalanceForRentExemption(1024);

  const instruction = SystemProgram.createAccountWithSeed({
    fromPubkey: signer.publicKey,
    basePubkey: signer.publicKey,
    seed: "campaign1",
    newAccountPubkey,
    lamports,
    space: 1024,

    programId: new PublicKey("J9iUgxytByjcsXwxMN47J3MDwGfNQFnDirxWnabTQWLY"),
  });

  const transaction = new Transaction().add(instruction);

  await connection.sendTransaction(transaction, [signer]);
}

createAccount();
