import { Keypair, PublicKey } from "@solana/web3.js";
import * as base58 from "bs58";
("base58");

const key = new Keypair();

console.log(key);

Keypair.fromSecretKey

console.log(
  Keypair.fromSecretKey(
    new Uint8Array(
      base58.decode(
        "4ci1JhaTpvxqiqLktg7ucS944TT3f1oYDet21kKfxQURZ7Pyqky1oEyMtoawyz7xexEu642AqwvwCq8bWwJWS584"
      )
    )
  )
);
