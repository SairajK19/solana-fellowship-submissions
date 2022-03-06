import * as anchor from "@project-serum/anchor";
import { actions, utils, programs, NodeWallet } from "@metaplex/js";
import Arweave from "arweave";
import fs from "fs";
import { Program, BorshCoder } from "@project-serum/anchor";
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
const { SystemProgram } = anchor.web3;

import { NftMarketplace } from "../target/types/nft_marketplace";

describe("nft-marketplace", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.Provider.local();

  const program = anchor.workspace.NftMarketplace as Program<NftMarketplace>;
  const userNFTData = anchor.web3.Keypair.generate();

  const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
    timeout: 20000,
    logging: false,
  });

  const wallet = {
    kty: "RSA",
    n: "6uhvQXy_KEMWXp0dr3WG4Gw_U0gWSAMa97wXAudoEVzSjBQY6_m-PHra02-X2NciUjJ3LqmRWe3cigVUqepmYncVfChcPOya6po1pr9AWU41aIMhxEDJRwo4SBI9b-ziuaaV9_DdjMvG8te_ZuD47mTmZY1-TAm5I_EOTEZgDtWOq1ORkNwSEheoPh8Z3Q0X2xnWa4Ehn7Y10KC7zOJbcQ43Y-bIF8cZuiNzNduwCmW__D9TREM0l_GTG3-kFkTPrEwO50a4uBw6Qt2nESY_8R8VslewcJnui37NBryZ6Gq0uZi7pd_GhzzAWdielJp_5j2SemqhW1HPwXia3XeLYHL8dDXm1bsLVNtOKulFEF9I2avSoDJpbkepmMgfwmCRFJrCSoP7BsPdexUnT1mfYBAIZRrRHBiF8FXSDULOhZx4AnvntFekNjmDKb-WN0R9tIURe2ZLCyK9DK-e9TFiw62YDS6eLyK9UxfePb781arQDre5y8RYa7dBk4vU0T6E7HG8Y-IYWxnpeDC7lcGZ8p7U5uBm0IkbglkIGI5KVWXoCdUfVpp34DbJKPOL4s2HW1sKmem8Dhg9wLR6MkW2oKaH_x9JSmGW7TUdjE30yfBg4nR3kXntqcvoL1zydp6dcrZfDrJYc1yW4ERXj8G-tAZph01rP97o7u00y5x5pEk",
    e: "AQAB",
    d: "ckXaAWh28VYZZrNVwooQr9HYyGGz_RoNn2APbak2leOqxNvt97VJFtDI7LxHiQO2vXexRLDWdYHhm_7V3caaQeIeQIS9wiFzhxa3bMNywT7rekj4PykpAPb2xBCjdHQvIxLnt3KjxB9JS88qXBiq4AWTkulO_BxqxRI5218M0YqP2cZQdMCpxcVeYcHtafw5k6sxBKEPw0r3SOM4GIYw54F77oxQ4EhJuqQOIrAZJiWzTDld_0IWLqgk4Oap4u9cezuQsG9V4rJQoUCESjJqPpjZjCVePpiTU6a-hD1xPX_TJMoo1ptST219QPfAxReXimB_hi-jCPJ2d259H6lM0hK6RclixsMfg2dw4Umfkz23kXDoSJEdJy8yK6HatzGCfmjqzpmMNMIX9kX7XQjBBapTJCC2lt8mbUjSUk9KeF-vNEhFHyuHDXtDzcqnet29ieIWQmjTsi26Ld3yU3oz1taOf6Zz4oYrWVNuVWN23BKR8INbzKniA3yxKwHAPBwfKxMgbWsWWc_Uq3f_ylTlNRetH5d3HOsG_67zOfzszoobUoN_8a_2ced-UWKT7XRE9pzJ6nv--iekDGf3miMGBXyNVs7I5TzLBPwK1VrsoZyliZCCz3R2V3ypHHWk_5_v1hdZ8pXTD-kUB62euOWy1p_JId4GQG_gMlRLNonBLzU",
    p: "_shdW0YPpUp-7DHt_uPnteBxP6Sgi_h4opurx6FZHtInT8shW1F50Bnf7iuzrfqtPR2NORzLPmbLmjjC8rub5WzNfvf5GCxv6gPJ04NC-nmUXWkEUIRLVK-SxEP-1xtZLY02G0pEnP8QpHzmXr6jwyEOgf0cTVo-W__Nm6u_keHyFqbyGOPMtCW__9My2O1STFLqkg4S_b7Og25e2lR_sdL1iYkGJRmXeiF1dMy8rbBDoaVXKp1o2PAtY9vNTSndZVaQGX7e2Vz1JqZNKf5s5-EPHvQNMOODMSZBr7es0GrppltGWAF07FzF1yQ1yTvMsGjCH-I7LNx-PwGtVNcOtw",
    q: "7AfCo7s7IQhzJJxpq4G-vtttJfoQ0qXbnf5I9a7MeNM8LtO8pgKPJFbGP73oEM2XW-Z6vIdDfAJghWqclPKgqHkUcG9KT4zFzVbY9_jcbj5cdlFD0l1lvRMbwpw5wlPORqqRh33S-nt6sZDzqap_VWEidHKgNevl8wQbNTcdSF2TBGOszzB8ZKLwb1JgvD2jOuPkOlCDxsSH6VShAorLAiRIaRXPmJQDU8qVdtnOzE1djcoGd5P15vsf3IftEGGXD82F9HTk0VH41bx-M2-eN6ZDRRkCSabMOGtG-H91H4ELClhq-bgmOagQ7Al81UEcxxbpTY6vCCv61I3RIRHk_w",
    dp: "UwgdVJealbWXc4Y6F61SYDWK8sDGCZeqSOQOsXplvuOiKCD89_OvjSBBmC7p2bMuLhKpaYl2uxlpFROWhOCbR8OTnONXbIde2ZbueV33wAVLUr3cyBi1LB4j6I54SMYC5BN3JKGphrihRdnmgc4DNJ5bSgWg6ZyVYgoVibwJLJPD_5ncoDvtBHChB9Bea8-72F_VTlAD5GoAh1i61NBg5STpHC9pr0GN2iF5U909SCV_hPiLVboC52AuirKhT5prKpFxWL2-BnyC8FuWHi9qco8oDGBgxCQBJ01ebtOfIDUXfD2WySuAXV9GonyMgs5YQM2DJjzmKBKbmhED2fhUNQ",
    dq: "trQDHI6P5LAPwSU6PsI-Dqr3wE_jucsdRx1RCKx4JocMrQrFmpOcjfqFl02_V1JteXvdQhZKTLHiWSP_dOSjLAYdpjLfiNhlPN-fL8P5jXTESen539rgKA2kjW4035HTuKvL3t-s8qume9DCbHFIA6Ue8JjSHystYoGpNfYluqCEbv9hAzh68cOW7fUMYGot8iX5wpIUj0YOFrWltLwPDOddDcsOWQMp2DCWpdtP0qGIa3sYqnNkA5ocPa8R-H4yWs8yg9oATW9weLJh1hrulBElPVVwieaNapbP5wdyeCKBk06B8C91l2fbQXrOoJy4U_wOODTclCzHCsWEPl8FrQ",
    qi: "-U5OFv23pmCDt3JJuMnSojHKEA7dxgLynUdlftSPryGzdGduotLbksbTwBnOEFBoZkHBQrnWsc8qISgMCJMU86xxnoxcVuRZZGjX9pJYBtmzdtBvde_-tIJzqjjH9xvTplSpHcb22oKJuSMuUaz_lO86sG9mJCv-aa5q3BZeb5KRjqTohawb4Rv4h7j3oy2e6THVYxA--Gi8WOHV-T1I5ZEmIXUK2kVJghGZkoRUTRRaYJ6H4ieu2UN22ZUPlxZV0LYbktot41cygdvfcMzbaMGdfH_PvPqCiI1AKUwP9E2gF6qacFCBcfx2dh3Zm7wD3IQdoE3C3SjR-CBjtktHeg",
  };

  // Upload image to Arweave
  const data = fs.readFileSync("./nfts/rick.jpg");
  let _imageUrl, _metadataUrl, _mintAddress, _edition, _metadata;

  it("Uploads image to arweave", async () => {
    const transaction = await arweave.createTransaction({
      data: data,
    });

    transaction.addTag("Content-Type", "image/png");

    await arweave.transactions.sign(transaction, wallet);
    await arweave.transactions.post(transaction);
    const { id } = transaction;

    const imageUrl = id ? `https://arweave.net/${id}` : undefined;
    _imageUrl = imageUrl;
  });

  it("Uploads metadata to arweave", async () => {
    const metadata = {
      name: "Rick!",
      symbol: "RAM",
      description: "Boom! Big reveal! I turned myself into a pickle",
      seller_fee_basis_points: 500,
      external_url: _imageUrl,
      properties: {
        files: [
          {
            uri: _imageUrl,
            type: "image/png",
          },
        ],
        category: "image",
        maxSupply: 0,
        creators: [
          {
            address: provider.wallet.publicKey.toString(),
            share: 100,
            verified: true,
          },
        ],
      },
      image: _imageUrl,
    };

    const metadataRequest = JSON.stringify(metadata);

    const metadataTransaction = await arweave.createTransaction({
      data: metadataRequest,
    });

    metadataTransaction.addTag("Content-Type", "application/json");

    await arweave.transactions.sign(metadataTransaction, wallet);

    await arweave.transactions.post(metadataTransaction);

    _metadataUrl = `https://arweave.net/${metadataTransaction.id}`;
    console.log(_metadataUrl);
  });

  it("Mints an NFT", async () => {
    let connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const mintNFTResponse = await actions.mintNFT({
      connection: connection,
      wallet: provider.wallet,
      uri: _metadataUrl,
      maxSupply: 0,
    });

    _mintAddress = mintNFTResponse.mint;
    _edition = mintNFTResponse.edition;
    _metadata = mintNFTResponse.metadata;
  });

  it("Account created!", async () => {
    await program.rpc.initializeUserNftData(_mintAddress, {
      accounts: {
        userNftData: userNFTData.publicKey,
        systemProgram: SystemProgram.programId,
        user: provider.wallet.publicKey,
      },
      signers: [userNFTData],
    });

    const dataAccount = await program.account.userNftData.fetch(
      userNFTData.publicKey
    );
  });

  it("Updates the metadata", async () => {
    await sleep(30000);

    let currentMetadata = await programs.metadata.Metadata.load(
      new Connection(clusterApiUrl("devnet")),
      _metadata
    );

    console.log(`Name of nft before: ${currentMetadata.data.data.name}`);

    const newMetadataData = new programs.metadata.MetadataDataData({
      name: "Rick And Morty",
      symbol: currentMetadata.data.data.symbol,
      uri: _metadataUrl,
      creators: currentMetadata.data.data.creators,
      sellerFeeBasisPoints: currentMetadata.data.data.sellerFeeBasisPoints,
    });

    const res = await actions.updateMetadata({
      connection: new Connection(clusterApiUrl("devnet")),
      editionMint: _mintAddress,
      wallet: provider.wallet,
      newMetadataData,
    });

    await sleep(30000);

    currentMetadata = await programs.metadata.Metadata.load(
      new Connection(clusterApiUrl("devnet")),
      _metadata
    );

    console.log(`Name of nft after: ${currentMetadata.data.data.name}`);
    console.log(
      `Check of Solscan => https://solscan.io/token/${_mintAddress}?cluster=devnet`
    );
  });
});

function sleep(delay) {
  var start = new Date().getTime();
  while (new Date().getTime() < start + delay);
}
