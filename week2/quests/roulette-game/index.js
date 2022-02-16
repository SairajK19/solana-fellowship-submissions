const { getUser, getAirdrop, getWalletBalance } = require("./airdrop.js");
const readline = require("readline-sync");
const {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} = require("@solana/web3.js");

let stakeValue;
let stakeRatio;
let randNum;
let userGuess;

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const transferSOL = async (
  connection,
  treasureKeyPair,
  from,
  to,
  fromKeyPair,
  amount
) => {
  await getAirdrop(treasureKeyPair, treasureKeyPair._keypair.secretKey);

  let transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [
    fromKeyPair,
  ]);
  return signature;
};

const startGame = async () => {
  const connection = new Connection(clusterApiUrl("devnet"));
  const userWallet = await getUser();
  const treasureKeyPair = new Keypair();
  if (
    (await connection.getBalance(
      new PublicKey(userWallet._keypair.publicKey)
    )) <= 2
  ) {
    console.log("You dont have enough SOL in your acc, air dropping some...");
    await getAirdrop(userWallet, userWallet._keypair.secretKey);
  }

  const treasurePublicKey = treasureKeyPair._keypair.publicKey;
  const userWalletPublicKey = userWallet._keypair.publicKey;

  console.log("-- Welcome to SOL Stake --");
  console.log("-- Max bidding amount is 2SOL --\n");
  while (true) {
    console.log("Enter the amount of sol you want to stake. (max 2 SOL)");
    stakeValue = Number(readline.question());

    if (stakeValue <= 2) {
      break;
    }
  }
  console.log("Enter the ratio of staking (format => x:y)");
  stakeRatio = String(readline.question()).split(":");

  console.log(`\nYou will have to pay ${stakeValue} SOL`);
  let reward = stakeValue * parseInt(stakeRatio[1]).toFixed(2);
  console.log(`\n### You will get ${reward} SOL if you guess correct ###\n`);

  randNum = getRandomNumber(1, 5);
  console.log("Enter a number between 1 to 5, (1 and 5 are included)");
  userGuess = Number(readline.question());

  try {
    const gameSignature = await transferSOL(
      connection,
      treasureKeyPair,
      userWallet.publicKey,
      treasureKeyPair.publicKey,
      userWallet,
      stakeValue
    );
    console.log(`\nSignature of staking is ${gameSignature}\n`);
  } catch (err) {
    console.log("Not enough SOL in wallet!");
    console.log("Exiting...");
    console.log(err);
    return;
  }

  if (userGuess === randNum) {
    console.log(`You guessed it right!!\n`);
    console.log(
      `${reward} SOL will be transfered to your wallet => ${userWallet.publicKey.toString()}`
    );
    const signature = await transferSOL(
      connection,
      treasureKeyPair,
      treasureKeyPair.publicKey,
      userWallet.publicKey,
      treasureKeyPair,
      reward
    );
    console.log(`\nSignature of winning is ${signature}`);
  } else {
    console.log(`Sorry...You guessed wrong, ${randNum} is the correct number`);
  }
};

startGame();
