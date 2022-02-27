import { Connection, Keypair, SystemProgram, PublicKey } from "@solana/web3.js";
import { getProgramId } from "../utils";

// Account Creation transactions

/**
 * Creates the multi-sig account
 * @param userKeypair
 */
export const getCreateMultisigAccountTx = async (
  userKeypair: Keypair,
  connection: Connection,
  MULTISIG_ACCOUNT_SIZE: number,
  multisig_account: PublicKey
) =>
  SystemProgram.createAccount({
    fromPubkey: userKeypair.publicKey,
    lamports: await connection.getMinimumBalanceForRentExemption(
      MULTISIG_ACCOUNT_SIZE
    ),
    newAccountPubkey: multisig_account,
    programId: getProgramId(),
    space: MULTISIG_ACCOUNT_SIZE,
  });
