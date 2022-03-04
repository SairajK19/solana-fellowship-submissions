import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { NftMarketplace } from "../target/types/nft_marketplace";
const { SystemProgram } = anchor.web3;

describe("nft-marketplace", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.Provider.local();

  const program = anchor.workspace.NftMarketplace as Program<NftMarketplace>;

  it("Account created!", async () => {
    const userNFTData = anchor.web3.Keypair.generate();

    // Add your test here.
    await program.rpc.initializeUserNftData({
      accounts: {
        userNftData: userNFTData.publicKey,
        systemProgram: SystemProgram.programId,
        user: provider.wallet.publicKey,
      },
      signers: [userNFTData]
    });

    const dataAccount = await program.account.userNftData.fetch(
      userNFTData.publicKey
    );

    console.log(dataAccount);
  });
});
