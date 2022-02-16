const {
    Connection,
    PublicKey,
    clusterApiUrl,
    Keypair,
    LAMPORTS_PER_SOL,
} = require("@solana/web3.js");

/*
 * First we created a keypair and got a
 * public key and a private key/secret key
 */
const newPair = new Keypair();
const publicKey = new PublicKey(newPair._keypair.publicKey).toString();
console.log(`Working for address => ${publicKey}`);
const secretKey = newPair._keypair.secretKey;

const getWalletBalance = async () => {
    try {
        /** Got a connection to devnet **/
        const connection = new Connection(clusterApiUrl("devnet", "confirm"));
        /** Created a wallet using the secret key  **/
        const myWallet = Keypair.fromSecretKey(secretKey);
        /** The get the balance using base58 value of publickey **/
        const walletBalance = await connection.getBalance(myWallet.publicKey);

        console.log(`Balance is ${parseInt(walletBalance)/LAMPORTS_PER_SOL}, Airdropping 2SOL`);
    } catch (error) {
        console.log(`Error while getting the balanace...\n${error}`);
    }
}

const getAirdrop = async () => {
    try {
        const connection = new Connection(clusterApiUrl("devnet", "confirm"));
        /** Get the wallet using the private key **/
        const walletKeyPair = Keypair.fromSecretKey(secretKey);

        console.log("\n-- Airdropping 2 SOL --")
        /** Create a transaction to receive airdrop of worth 2SOL using the wallet public key (base58) **/
        const formAirDropSignature = await connection.requestAirdrop(walletKeyPair.publicKey, 2 * LAMPORTS_PER_SOL);
        /** Sign the transaction **/
        await connection.confirmTransaction(formAirDropSignature);
    } catch(err) {
        console.log(`Error while getting error...\n${err}`);
    }
}

const driverFunction = async () => {
    await getWalletBalance();
    await getAirdrop();
    await getWalletBalance();
}

driverFunction();
