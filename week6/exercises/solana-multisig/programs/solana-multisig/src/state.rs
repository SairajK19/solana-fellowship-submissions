use anchor_lang::prelude::*;

#[account]
pub struct Multisig {
    pub owners: Vec<Pubkey>,
    pub threshold: u8,
    pub seq_no: u8,
    pub nonce: u8,
}

#[account]
pub struct Transaction {
    pub program_id: Pubkey,
    pub multisig: Pubkey,
    pub datas: Vec<Vec<u8>>,
    pub executed: bool,
    pub signed_by: Vec<bool>,
    pub accounts: Vec<Vec<TransactionAccount>>,
    pub seq_no: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TransactionAccount {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}
