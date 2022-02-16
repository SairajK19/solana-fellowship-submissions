import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import * as fs from "fs";

const WALLET_KEYPAIR_PATH = "/home/sairaj-kapdi/.config/solana/id.json";
const PROGRAM_ID = "EyofVC36fv2JoMnBmEbsu2YviT2Uhk1EybeUpsBMYCnx";

export const getPrivateKey = () =>
  Uint8Array.from(
    JSON.parse(fs.readFileSync(WALLET_KEYPAIR_PATH) as unknown as string)
  );

export const getPublicKey = () => getKeypair().publicKey;

export const getKeypair = () => Keypair.fromSecretKey(getPrivateKey());

export const getProgramId = () => new PublicKey(PROGRAM_ID);
