import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import * as fs from "fs";

import BN from "bn.js";

const WALLET_KEYPAIR_PATH = "/home/sairaj-kapdi/.config/solana/id.json";
const PROGRAM_ID = "2EVVPjyH1jkxVjAeb2WzqmMrrEi3HmRyw7BWjgxBqnAU";

export const getPrivateKey = () =>
  Uint8Array.from(
    JSON.parse(fs.readFileSync(WALLET_KEYPAIR_PATH) as unknown as string)
  );

export const getPublicKey = () => getKeypair().publicKey;

export const getKeypair = () => Keypair.fromSecretKey(getPrivateKey());

export const getProgramId = () => new PublicKey(PROGRAM_ID);

export const getCandidatePublicKey = (name: string) =>
  new PublicKey(
    JSON.parse(
      fs.readFileSync(
        `./cli/keys/candidates/${name}_pub.json`
      ) as unknown as string
    )
  );

export const getCandidatePrivateKey = (name: string) =>
  Uint8Array.from(
    JSON.parse(
      fs.readFileSync(
        `./cli/keys/candidates/${name}_priv.json`
      ) as unknown as string
    )
  );

export const getCandidateKeypair = (name: string) =>
  new Keypair({
    publicKey: getCandidatePublicKey(name).toBuffer(),
    secretKey: getCandidatePrivateKey(name),
  });

export const getEmptyAddressBuffer = (): Buffer =>
  Buffer.from(
    new Uint8Array([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0,
    ])
  );

export class Numberu32 extends BN {
  toBuffer(): Buffer {
    const a = super.toArray().reverse();
    const b = Buffer.from(a);
    if (b.length === 4) {
      return b;
    }

    const zeroPad = Buffer.alloc(4);
    b.copy(zeroPad);
    return zeroPad;
  }
}
