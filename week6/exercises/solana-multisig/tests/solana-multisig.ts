import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaMultisig } from "../target/types/solana_multisig";
import { expect } from "chai";

describe("solana-multisig", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.SolanaMultisig as Program<SolanaMultisig>;

  const multisig = anchor.web3.Keypair.generate();
  const [multisigSigner, nonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [multisig.publicKey.toBuffer()],
      program.programId
    );

  const owner1 = anchor.web3.Keypair.generate();
  const owner2 = anchor.web3.Keypair.generate();
  const owner3 = anchor.web3.Keypair.generate();
  let transaction: anchor.web3.Keypair;

  it("Is created a multisig!", async () => {
    await program.rpc.createMultisig(
      [owner1.publicKey, owner2.publicKey, owner3.publicKey],
      2,
      1,
      nonce,
      {
        accounts: {
          multisig: multisig.publicKey,
        },
        signers: [multisig],
        preInstructions: [
          await program.account.multisig.createInstruction(multisig, 900),
        ],
      }
    );

    const multisig_acc = await program.account.multisig.fetch(
      multisig.publicKey
    );

    expect(multisig_acc.seqNo).to.equal(1);
    expect(multisig_acc.threshold).to.equal(2);
  });

  it("Created a transaction", async () => {
    transaction = anchor.web3.Keypair.generate();

    // Transfer some lamports to the multisig signer
    await anchor.getProvider().send(
      new anchor.web3.Transaction().add(
        anchor.web3.SystemProgram.transfer({
          fromPubkey: anchor.getProvider().wallet.publicKey,
          toPubkey: multisigSigner,
          lamports: 2 * anchor.web3.LAMPORTS_PER_SOL,
        }),
        anchor.web3.SystemProgram.createAccount({
          fromPubkey: anchor.getProvider().wallet.publicKey,
          lamports: await anchor
            .getProvider()
            .connection.getMinimumBalanceForRentExemption(1000),
          newAccountPubkey: transaction.publicKey,
          programId: program.programId,
          space: 1000,
        })
      ),
      [transaction]
    );

    const accounts = [
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

    const pid = anchor.web3.SystemProgram.programId;

    const data = anchor.web3.SystemProgram.transfer({
      fromPubkey: multisigSigner,
      toPubkey: owner1.publicKey,
      lamports: 2 * anchor.web3.LAMPORTS_PER_SOL,
    }).data;

    await program.rpc.createTransaction([accounts], pid, [data], 1, {
      accounts: {
        creator: owner1.publicKey,
        transaction: transaction.publicKey,
        multisig: multisig.publicKey,
      },
      signers: [owner1],
    });

    let tx = await program.account.transaction.fetch(transaction.publicKey);
    expect(false).to.equal(tx.executed);
  });

  it("Approves a transaction", async () => {
    // Approve by owner 1
    await program.rpc.approveTransaction({
      accounts: {
        approver: owner1.publicKey,
        multisig: multisig.publicKey,
        transaction: transaction.publicKey,
      },
      signers: [owner1],
    });

    // Approved by owner 2
    await program.rpc.approveTransaction({
      accounts: {
        approver: owner2.publicKey,
        multisig: multisig.publicKey,
        transaction: transaction.publicKey,
      },
      signers: [owner2],
    });

    let tx = await program.account.transaction.fetch(transaction.publicKey);
    expect([true, true, false]).to.eql(tx.signedBy);
  });

  it("Executes transaction", async () => {
    let multisigBalanace = await anchor
      .getProvider()
      .connection.getBalance(multisigSigner);
    expect(multisigBalanace).to.equal(2 * anchor.web3.LAMPORTS_PER_SOL);

    await program.rpc.executeTransaction({
      accounts: {
        multisig: multisig.publicKey,
        owner: owner1.publicKey,
        transaction: transaction.publicKey,
      },
      signers: [owner1],
      remainingAccounts: [
        {
          pubkey: multisigSigner,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: owner1.publicKey,
          isWritable: true,
          isSigner: false,
        },
        {
          pubkey: anchor.web3.SystemProgram.programId,
          isWritable: false,
          isSigner: false,
        },
      ],
    });

    multisigBalanace = await anchor
      .getProvider()
      .connection.getBalance(multisigSigner);

    expect(multisigBalanace).to.equal(0 * anchor.web3.LAMPORTS_PER_SOL);
  });
});
