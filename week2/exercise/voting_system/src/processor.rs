use crate::error::BallotErrors;
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
            BallotInstructions::Vote => {
                msg!("Executing Vote instruction");
                Processor::vote(accounts)?;
            }
            BallotInstructions::Winner => {
                msg!("Declaring winner!!!");
                Processor::winner(accounts)?;
            }
            BallotInstructions::InitBallot => {
                msg!("Initializing ballot");
                Processor::init_ballot(accounts)?;
            }
            BallotInstructions::SubscribeForVoting { input } => {
                msg!("Subscribing...");
                Processor::subscribe_for_voting(accounts, &input, program_id)?;
            }
            BallotInstructions::GiveRightToVote => {
                msg!("Giving right to vote...");
                Processor::give_right_to_vote(accounts, program_id)?;
            }
            BallotInstructions::DelegateVote => {
                msg!("Delegating vote...");
                Processor::delegate_vote(accounts, program_id)?;
            }
        }
        Ok(())
    }

    fn init_ballot(accounts: &[AccountInfo]) -> ProgramResult {
        msg!("Started init process...");
        let account_info_iter = &mut accounts.iter();

        let chairperson = next_account_info(account_info_iter)?; // signer
        let ballot_account = next_account_info(account_info_iter)?; // ballot account

        let ballot_account_data = Ballot::try_from_slice(&ballot_account.data.borrow())?;

        // if account already initialized then we dont need to initialized.
        if ballot_account_data.initialized != 0 as u8 {
            return Err(BallotErrors::AlreadyInitialized.into());
        }

        let ballot = Ballot {
            total_proposals: 0,
            winner_address: Pubkey::default(),
            chairperson: *chairperson.key,
            initialized: 1,
        };

        let writer = &mut &mut ballot_account.data.borrow_mut()[..];
        ballot.serialize(writer)?;

        msg!("Done Initialized!");
        Ok(())
    }

    fn create_proposal(accounts: &[AccountInfo], input: &[u8]) -> ProgramResult {
        msg!("Creating Proposal");
        msg!("Pubkey default is {}", Pubkey::default());
        let account_info_iter = &mut accounts.iter();

        let chairperson_account = next_account_info(account_info_iter)?; // signer
        let proposal_account = next_account_info(account_info_iter)?; // proposal_acc
        let ballot_account = next_account_info(account_info_iter)?; // ballot account

        let mut ballot_account_data = Ballot::try_from_slice(&ballot_account.data.borrow())?;

        if ballot_account_data.chairperson != *chairperson_account.key
            && !chairperson_account.is_signer
        {
            msg!("You cannot make changes to the program...");
            return Err(BallotErrors::YouAreNotTheChairperson.into());
        }

        let proposal_data = Proposal::try_from_slice(&input)?;

        let writer = &mut &mut proposal_account.data.borrow_mut()[..];
        proposal_data.serialize(writer)?;

        // updating ballot account
        ballot_account_data.total_proposals += 1 as u32;

        let writer = &mut &mut ballot_account.data.borrow_mut()[..];
        ballot_account_data.serialize(writer)?;

        Ok(())
    }

    fn vote(accounts: &[AccountInfo]) -> ProgramResult {
        msg!("Voting...");
        let account_info_iter = &mut accounts.iter();

        let vote_account = next_account_info(account_info_iter)?; // voter account
        let proposal_account = next_account_info(account_info_iter)?; // candidate account

        let mut vote_account_data = Voter::try_from_slice(&vote_account.data.borrow())?;

        if vote_account_data.voted == 1 {
            return Err(BallotErrors::AlreadyVoted.into());
        }

        if vote_account_data.weight == 0 {
            return  Err(BallotErrors::NoVotesLeft.into());
        }

        let mut proposal_data = Proposal::try_from_slice(&proposal_account.data.borrow())?;

        msg!("Incrementing voting.. {}", vote_account_data.weight);
        // increase vote for that particular candidate.
        proposal_data.total_votes += vote_account_data.weight as u32;
        msg!("Incremented");

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

    // this fn initializes a voter account, so that the voter can vote.
    fn subscribe_for_voting(
        accounts: &[AccountInfo],
        input: &[u8],
        program_id: &Pubkey,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        let voter_account = next_account_info(account_info_iter)?; // voter account

        // check if the account is owned by the program.
        if voter_account.owner != program_id {
            msg!("Account not owned by this program");
            return Err(ProgramError::IllegalOwner);
        }

        let mut voter_data = Voter::try_from_slice(&input)?;

        // check if the voter has already voted.
        if voter_data.voted == 1 as u8 {
            msg!("You have already voted..");
            return Err(BallotErrors::AlreadyVoted.into());
        }

        // initialize the voter
        voter_data.voted = 0 as u8;
        voter_data.weight = 0 as u8;
        msg!("Have set weight to {}", voter_data.weight);
        voter_data.vote = Pubkey::default();
        voter_data.delegate = Pubkey::default();

        let writer = &mut &mut voter_account.data.borrow_mut()[..];
        voter_data.serialize(writer)?;
        Ok(())
    }

    fn give_right_to_vote(accounts: &[AccountInfo], program_id: &Pubkey) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        let chairperson_account = next_account_info(account_info_iter)?;
        let ballot_account = next_account_info(account_info_iter)?;

        // ballot account should be owned by the program
        if ballot_account.owner != program_id {
            msg!("Incorrect account, not owned by this program");
            return Err(ProgramError::IllegalOwner);
        }

        let ballot_data = Ballot::try_from_slice(&ballot_account.data.borrow())?;

        // only chairperson should be able to give right to vote.
        if *chairperson_account.key != ballot_data.chairperson {
            msg!("Incorrect chairperson");
            return Err(BallotErrors::YouAreNotTheChairperson.into());
        }

        // get the voters account
        let voter_account = next_account_info(account_info_iter)?; // vote account

        let mut voter_data = Voter::try_from_slice(&voter_account.data.borrow())?;

        // check if the voter has already voted.
        if voter_data.voted == 1 {
            msg!("You have already voted..");
            return Err(BallotErrors::AlreadyVoted.into());
        }

        // check if the voter has already been granted the right to vote.
        if voter_data.weight >= 1 {
            msg!("You have already been given the right to vote..");
            return Err(BallotErrors::AlreadyHaveRightToVote.into());
        }

        // increase weight by 1
        voter_data.weight = 1 as u8;

        let writer = &mut &mut voter_account.data.borrow_mut()[..];
        voter_data.serialize(writer)?;

        Ok(())
    }

    fn delegate_vote(accounts: &[AccountInfo], program_id: &Pubkey) -> ProgramResult {
        let account_info_iter = &mut accounts.into_iter();

        let voter_account = next_account_info(account_info_iter)?; // voter
        let delegate_to_account = next_account_info(account_info_iter)?; // delegate to

        if voter_account.owner != program_id && delegate_to_account.owner != program_id {
            return Err(ProgramError::IncorrectProgramId);
        }

        // get voter and delegate_to account data
        let mut voter_data = Voter::try_from_slice(&voter_account.data.borrow())?;
        let mut delegate_to_data = Voter::try_from_slice(&delegate_to_account.data.borrow())?;

        // check if voter has already voted.
        if voter_data.voted == 1 {
            msg!("Voter has already voted.");
            return Err(BallotErrors::AlreadyVoted.into());
        }

        voter_data.weight = 0; // weight is 0 since voted.
        voter_data.delegate = *delegate_to_account.key; // delegates pub key
        voter_data.voted = 1; // set voted to true`

        // check if delegate has already voted
        // if yes then
        if delegate_to_data.voted == 1 {
            let candidate_account = next_account_info(account_info_iter)?; // candidate

            let mut candidate_data = Proposal::try_from_slice(&candidate_account.data.borrow())?;

            // increase candidate total votes count.
            candidate_data.total_votes += 1;
            voter_data.vote = *candidate_account.key; // set voters vote to candidate pubkey

            let writer = &mut &mut candidate_account.data.borrow_mut()[..];
            candidate_data.serialize(writer)?;
        } else {
            delegate_to_data.weight += 1; // else just increase weight
        }

        let writer = &mut &mut voter_account.data.borrow_mut()[..];
        voter_data.serialize(writer)?;

        let writer = &mut &mut delegate_to_account.data.borrow_mut()[..];
        delegate_to_data.serialize(writer)?;
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
