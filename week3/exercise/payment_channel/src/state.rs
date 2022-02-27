use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Multisig {
    pub owners: Vec<Pubkey>,
    pub threshold: u64,
    pub nonce: u8,
    pub owner_set_seq_no: u32,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Transaction {
    // multisig account pubkey
    pub multisig: Pubkey,
    // target program to execute against
    pub program_ids: Vec<u8>,
    // accounts whos signature is required
    pub accounts: Vec<u8>,
    // singers who has signed
    pub signers: Vec<u8>,
    // burned or not (executes only one time)
    pub did_execute: u8,
    // instruction data for the transaction
    pub data: Vec<u8>,
}

pub struct TransactionAccount {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}
