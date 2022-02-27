import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import * as fs from "fs";

import BN from "bn.js";

const WALLET_KEYPAIR_PATH = "/home/sairaj-kapdi/.config/solana/id.json";
const PROGRAM_ID = "HBkWBgWkcPZUSWEbHB3LuJ94zeLxXixmLGe7koZELhKp";

export const getPrivateKey = () =>
  Uint8Array.from(
    JSON.parse(fs.readFileSync(WALLET_KEYPAIR_PATH) as unknown as string)
  );

export const getPublicKey = () => getKeypair().publicKey;

export const getKeypair = () => Keypair.fromSecretKey(getPrivateKey());

export const getProgramId = () => new PublicKey(PROGRAM_ID);

export const getMultisigPublicKey = () =>
  new PublicKey(
    JSON.parse(
      fs.readFileSync(
        `./multisig_wallet/pub.json`
      ) as unknown as string
    )
  );

export const getMultisigPrivateKey = () =>
  Uint8Array.from(
    JSON.parse(
      fs.readFileSync(
        `./multisig_wallet/priv.json`
      ) as unknown as string
    )
  );

export const getMultisigKeypair = () =>
  new Keypair({
    publicKey: new Uint8Array(getMultisigPublicKey().toBuffer()),
    secretKey: getMultisigPrivateKey(),
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
