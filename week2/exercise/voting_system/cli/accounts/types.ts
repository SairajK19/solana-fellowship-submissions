export type ProposalAccountData = {
  name: string;
  total_votes: number;
};

export type VoteAccountData = {
  weight: number;
  voted: number;
  delegate: Uint8Array;
  vote: Uint8Array;
};

export type BallotAccountData = {
  winner_address: Uint8Array;
  total_proposals: number;
};

// pub struct Voter {
//     weight: u8,
//     voted: u8,
//     delegate: Pubkey,
//     vote: Pubkey,
// }
