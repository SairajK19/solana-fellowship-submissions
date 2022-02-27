export type MultisigAccountType = {
  owners: any;
  threshold: number;
  nonce: number;
  owner_set_seq_no: number;
};

export type TransactionAccountType = {
  multisig: Uint8Array;
  program_ids: any;
  accounts: any;
  signers: any;
  did_execute: number;
  data: any;
};
