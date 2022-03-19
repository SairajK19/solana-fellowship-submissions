import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Dverification } from "../target/types/dverification";

describe("dverification", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Dverification as Program<Dverification>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
