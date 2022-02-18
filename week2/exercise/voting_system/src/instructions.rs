use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum BallotInstructions {
    CreateProposal { input: Vec<u8> },
    Vote { input: Vec<u8> },
    Winner,
    InitBallot,
}
