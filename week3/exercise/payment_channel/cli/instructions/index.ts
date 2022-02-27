import { MultisigAccountType, TransactionAccountType } from "../accounts";
import { AccountMeta, PublicKey } from "@solana/web3.js";

export class MultisigAccount {
  owners: any;
  threshold: number;
  nonce: number;
  owner_set_seq_no: number;

  constructor(args: MultisigAccountType) {
    this.owners = args.owners;
    this.threshold = args.threshold;
    this.nonce = args.nonce;
    this.owner_set_seq_no = args.owner_set_seq_no;
  }
}

export class TransactionAccount {
  multisig: Uint8Array;
  program_ids: any;
  accounts: any;
  signers: any;
  did_execute: number;
  data: any;

  constructor(args: TransactionAccountType) {
    this.multisig = args.multisig;
    this.program_ids = args.program_ids;
    this.accounts = args.accounts;
    this.signers = args.signers;
    this.did_execute = args.did_execute;
    this.data = args.data;
  }
}

type TransactionType = {
  keys: [Uint8Array,Uint8Array];
  programId: Uint8Array;
  data: Uint8Array;
};

export class CustomTransactionInstruction {
  keys: [Uint8Array, Uint8Array];
  programId: Uint8Array;
  data: Uint8Array;
  constructor(args: TransactionType) {
    this.keys = args.keys;
    this.programId = args.programId;
    this.data = args.data;
  }
}

export class TransferParams {
  pubkey: Uint8Array;
  isSigner: boolean;
  isWritable: boolean;

  constructor(args: {
    pubkey: Uint8Array;
    isSigner: boolean;
    isWritable: boolean;
  }) {
    this.pubkey = args.pubkey;
    this.isSigner = args.isSigner;
    this.isWritable = args.isWritable;
  }
}

export const SCHEMA = new Map<any, any>([
  [
    MultisigAccount,
    {
      kind: "struct",
      fields: [
        ["owners", [[32]]],
        ["threshold", "u64"],
        ["nonce", "u8"],
        ["owner_set_seq_no", "u32"],
      ],
    },
  ],
  [
    TransactionAccount,
    {
      kind: "struct",
      fields: [
        ["multisig", [32]],
        ["program_ids", [[32]]],
        ["accounts", [[2]]],
        ["signers", [[32]]],
        ["did_execute", "u8"],
        ["data", [[46]]],
      ],
    },
  ],
  [
    CustomTransactionInstruction,
    {
      kind: "struct",
      fields: [
        ["keys", [2]],
        ["programId", [32]],
        ["data", [12]],
      ],
    },
  ],
  [
    TransferParams,
    {
      kind: "struct",
      fields: [
        ["pubkey", [32]],
        ["isWritable", "u8"],
        ["isSigner", "u8"],
      ],
    },
  ],
]);
