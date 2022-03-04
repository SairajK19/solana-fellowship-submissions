import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import "./Navbar.css";

function Navbar() {
  return (
    <nav>
      <h2>NFT Marketplace</h2>
      <a>Mint NFT</a>
      <WalletMultiButton />
    </nav>
  );
}

export default Navbar;
