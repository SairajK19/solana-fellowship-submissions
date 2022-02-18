import BufferLayout from "buffer-layout";
import {
  BallotAccountData,
  ProposalAccountData,
  VoteAccountData,
} from "../accounts/types";

export class ProposalAccount {
  name: string;
  total_votes: number;

  constructor(args: ProposalAccountData) {
    this.name = args.name;
    this.total_votes = args.total_votes;
  }
}

export class VoteAccount {
  weight: number;
  voted: number;
  delegate: Uint8Array;
  vote: Uint8Array;

  constructor(args: VoteAccountData) {
    this.weight = args.weight;
    this.voted = args.voted;
    this.delegate = args.delegate;
    this.vote = args.vote;
  }
}

export class BallotAccount {
  total_proposals: number;
  winner_address: Uint8Array;

  constructor(args: BallotAccountData) {
    this.total_proposals = args.total_proposals;
    this.winner_address = args.winner_address;
  }
}

export const SCHEMA = new Map<any, any>([
  [
    ProposalAccount,
    {
      kind: "struct",
      fields: [
        ["name", "String"],
        ["total_votes", "u32"],
      ],
    },
  ],
  [
    VoteAccount,
    {
      kind: "struct",
      fields: [
        ["weight", "u8"],
        ["voted", "u8"],
        ["delegate", [32]],
        ["vote", [32]],
      ],
    },
  ],
  [
    BallotAccount,
    {
      kind: "struct",
      fields: [
        ["total_proposals", "u32"],
        ["winner_address", [32]],
      ],
    },
  ],
]);
