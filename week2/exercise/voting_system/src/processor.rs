use crate::instructions::BallotInstructions;
use crate::state::{Ballot, Proposal, Voter};
use borsh::de::BorshDeserialize;
use borsh::ser::BorshSerialize;
use solana_program::account_info::next_account_info;
use solana_program::program_error::ProgramError;
use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, msg, pubkey::Pubkey};

pub struct Processor;
impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        msg!("Processing instruction");
        let instruction = BallotInstructions::try_from_slice(instruction_data)
            .map_err(|_| ProgramError::InvalidInstructionData)?;

        match instruction {
            BallotInstructions::CreateProposal { input } => {
                msg!("Init instruction for program {:?}", program_id);
                Processor::create_proposal(accounts, &input)?;
            }
            BallotInstructions::Vote { input } => {
                msg!("Executing Vote instruction");
                Processor::vote(accounts, &input)?;
            }
            BallotInstructions::Winner => {
                msg!("Declaring winner!!!");
                Processor::winner(accounts)?;
            }
            BallotInstructions::InitBallot => {
                msg!("Initializing ballot");
                Processor::init_ballot(accounts)?;
            }
        }
        Ok(())
    }

    fn init_ballot(accounts: &[AccountInfo]) -> ProgramResult {
        msg!("Started init process...");
        let account_info_iter = &mut accounts.iter();

        let ballot_account = next_account_info(account_info_iter)?; // ballot account

        let ballot = Ballot {
            total_proposals: 0,
            winner_address: Pubkey::default(),
        };

        let writer = &mut &mut ballot_account.data.borrow_mut()[..];
        ballot.serialize(writer)?;

        Ok(())
    }

    fn create_proposal(accounts: &[AccountInfo], input: &[u8]) -> ProgramResult {
        msg!("Creating Proposal");
        msg!("Pubkey default is {}", Pubkey::default());
        let account_info_iter = &mut accounts.iter();

        let _chairperson_account = next_account_info(account_info_iter)?; // signer
        let proposal_account = next_account_info(account_info_iter)?; // proposal_acc

        let proposal_data = Proposal::try_from_slice(&input)?;

        let writer = &mut &mut proposal_account.data.borrow_mut()[..];
        proposal_data.serialize(writer)?;

        // updating ballot account
        let ballot_account = next_account_info(account_info_iter)?; // ballot account

        let mut ballot_account_data = Ballot::try_from_slice(&ballot_account.data.borrow())?;

        ballot_account_data.total_proposals += 1 as u32;

        let writer = &mut &mut ballot_account.data.borrow_mut()[..];
        ballot_account_data.serialize(writer)?;

        Ok(())
    }

    fn vote(accounts: &[AccountInfo], input: &[u8]) -> ProgramResult {
        msg!("Voting...");
        let account_info_iter = &mut accounts.iter();

        let vote_account = next_account_info(account_info_iter)?; // voter account
        let proposal_account = next_account_info(account_info_iter)?; // candidate account

        let mut vote_account_data = Voter::try_from_slice(&input)?;

        let mut proposal_data = Proposal::try_from_slice(&proposal_account.data.borrow())?;

        // increase vote for that particular candidate.
        proposal_data.total_votes += vote_account_data.weight as u32;

        // Set voted as true
        // assign candidates pub key to -> voted
        // mark weight as 0 since voted.
        vote_account_data.voted = 1;
        vote_account_data.vote = *proposal_account.key;
        vote_account_data.weight = 0;

        let writer = &mut &mut proposal_account.data.borrow_mut()[..];
        proposal_data.serialize(writer)?;

        let writer = &mut &mut vote_account.data.borrow_mut()[..];
        vote_account_data.serialize(writer)?;

        Ok(())
    }

    fn winner(accounts: &[AccountInfo]) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        let candidate_account = next_account_info(account_info_iter)?; // candidate account

        let candidate_data = Proposal::try_from_slice(&candidate_account.data.borrow())?;

        let mut max_votes = candidate_data.total_votes;
        let mut winner_candidate: Pubkey = *candidate_account.key;

        let writer = &mut &mut candidate_account.data.borrow_mut()[..];
        candidate_data.serialize(writer)?;

        for _ in 1..=2 {
            let candidate_account = next_account_info(account_info_iter)?;
            let candidate_data = Proposal::try_from_slice(&candidate_account.data.borrow())?;

            if candidate_data.total_votes >= max_votes {
                max_votes = candidate_data.total_votes;
                winner_candidate = *candidate_account.key;
            }

            let writer = &mut &mut candidate_account.data.borrow_mut()[..];
            candidate_data.serialize(writer)?;
        }

        // setting winner in ballot
        let ballot_account = next_account_info(account_info_iter)?;

        let mut ballot_account_data = Ballot::try_from_slice(&ballot_account.data.borrow())?;

        ballot_account_data.winner_address = winner_candidate;

        let writer = &mut &mut ballot_account.data.borrow_mut()[..];
        ballot_account_data.serialize(writer)?;
        Ok(())
    }
}
