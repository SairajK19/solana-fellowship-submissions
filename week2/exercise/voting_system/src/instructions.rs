use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum BallotInstructions {
    CreateProposal { input: Vec<u8> },
    Vote,
    Winner,
    InitBallot,
    SubscribeForVoting { input: Vec<u8> },
    GiveRightToVote,
    DelegateVote
}
