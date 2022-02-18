use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{account_info::AccountInfo, pubkey::Pubkey};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Voter {
    pub weight: u8,
    pub voted: u8,
    pub delegate: Pubkey,
    pub vote: Pubkey,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Proposal {
    pub name: String,
    pub total_votes: u32,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Ballot {
    pub total_proposals: u32,
    pub winner_address: Pubkey
}
