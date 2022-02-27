import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SystemProgram, PublicKey, Keypair } from "@solana/web3.js";
import { PaymentChannel } from "../target/types/payment_channel";
import { expect } from "chai";

async function transferSOL(
  to: PublicKey,
  from: PublicKey,
  fromWallet: Keypair,
  amount: number
) {
  var tx = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: Number(new anchor.BN(amount)),
    })
  );

  await anchor.getProvider().send(tx, [fromWallet]);
}

describe("payment_channel", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.PaymentChannel as Program<PaymentChannel>;

  const myWallet = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array([
      110, 203, 48, 126, 1, 161, 0, 70, 6, 85, 208, 112, 32, 247, 183, 108, 28,
      47, 16, 170, 29, 17, 36, 106, 72, 141, 87, 218, 151, 177, 87, 37, 251, 47,
      81, 251, 230, 201, 28, 162, 108, 92, 42, 9, 113, 74, 162, 30, 149, 198, 6,
      19, 54, 219, 239, 224, 126, 56, 68, 68, 232, 38, 62, 200,
    ])
  );

  const owner1 = anchor.web3.Keypair.generate();
  const owner2 = anchor.web3.Keypair.generate();

  const multisig = anchor.web3.Keypair.generate();
  const transaction = anchor.web3.Keypair.generate();

  const [multisigSigner, nonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [multisig.publicKey.toBuffer()],
      program.programId
    );

  const multisigSize = 200;

  const [payment_channel_pda, pnonce] =
    await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("payment_channel")],
      program.programId
    );

  it("Creates a multisig!!", async () => {
    const threshold = new anchor.BN(2);
    await program.rpc.createMultisig(
      [owner1.publicKey, owner2.publicKey],
      threshold,
      nonce,
      {
        accounts: {
          multisig: multisig.publicKey,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        instructions: [
          await program.account.multisig.createInstruction(
            multisig,
            multisigSize
          ),
        ],
        signers: [multisig],
      }
    );

    let multisigAccount = await program.account.multisig.fetch(
      multisig.publicKey
    );

    expect(multisigAccount.nonce).to.equal(nonce);
    expect(Number(multisigAccount.threshold)).to.equal(2);
    expect(multisigAccount.owners[0].toString()).to.equal(
      owner1.publicKey.toString()
    );
    expect(multisigAccount.owners[1].toString()).to.equal(
      owner2.publicKey.toString()
    );
  });

  it("Creates a transaction!!", async () => {
    // Accounts required for signature
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

    // programid of the program required to transfer
    const pid = anchor.web3.SystemProgram.programId;

    const data = anchor.web3.SystemProgram.transfer({
      fromPubkey: multisigSigner,
      toPubkey: owner1.publicKey,
      lamports: Number(new anchor.BN(1000000000)),
    }).data;

    await transferSOL(
      multisigSigner,
      myWallet.publicKey,
      myWallet,
      100000000000
    );

    // transaction account size
    const transactionSize = 8 + 32 + 32 * 3 + 32 * 3 + 1 * 20 + 1 * 2 + 1 + 4;

    const createAccountInstruction = anchor.web3.SystemProgram.createAccount({
      fromPubkey: myWallet.publicKey,
      newAccountPubkey: transaction.publicKey,
      space: 1000,
      lamports: await anchor
        .getProvider()
        .connection.getMinimumBalanceForRentExemption(1000),
      programId: program.programId,
    });

    var tx = new anchor.web3.Transaction().add(createAccountInstruction);

    await anchor.getProvider().send(tx, [myWallet, transaction]);

    await program.rpc.createTransaction([pid], [accounts], [data], {
      accounts: {
        multisig: multisig.publicKey,
        transaction: transaction.publicKey,
        proposer: owner1.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [owner1],
    });

    // await program.account.transaction
    // .fetch(transaction.publicKey)
    // .then((data) => console.log(data));
  });

  it("Approves transaction and executes", async () => {
    await program.rpc.approveTransaction({
      accounts: {
        multisig: multisig.publicKey,
        multisigSigner: multisigSigner,
        owner: owner2.publicKey,
        transaction: transaction.publicKey,
      },
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

        {
          pubkey: program.programId,
          isWritable: false,
          isSigner: false,
        },
      ],
      signers: [owner2],
    });
  });

  it("Creates a payment channel", async () => {
    console.log(payment_channel_pda.toString());

    await transferSOL(
      owner1.publicKey,
      myWallet.publicKey,
      myWallet,
      100000000000
    );
    await transferSOL(
      owner2.publicKey,
      myWallet.publicKey,
      myWallet,
      100000000000
    );

    const balances = [
      new anchor.BN(
        await anchor.getProvider().connection.getBalance(owner1.publicKey)
      ),
      new anchor.BN(
        await anchor.getProvider().connection.getBalance(owner2.publicKey)
      ),
    ];

    const users = [owner1.publicKey, owner2.publicKey];

    await program.rpc.createPaymentChannel(pnonce, balances, users, 1000000, {
      accounts: {
        multisig: multisig.publicKey,
        paymentChannelPda: payment_channel_pda,
        systemProgram: SystemProgram.programId,
        user: myWallet.publicKey,
      },
      signers: [myWallet],
    });
  });

  // it("Withdraws tokens from owner1", async () => {
  //   await transferSOL(
  //     payment_channel_pda,
  //     myWallet.publicKey,
  //     myWallet,
  //     100000000000
  //   );

  //   console.log(await anchor.getProvider().connection.getBalance(payment_channel_pda))

  //   await program.rpc.withdraw({
  //     accounts: {
  //       multisig: multisig.publicKey,
  //       multisigSigner: multisigSigner,
  //       paymentChannelPda: payment_channel_pda,
  //       systemProgram: SystemProgram.programId,
  //       user: owner1.publicKey,
  //     },
  //     signers: [owner1],
  //   });
  // });
});
