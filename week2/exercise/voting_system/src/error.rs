use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum BallotErrors {
    #[error("Invalid Instruction")]
    InvalidInstruction,
    #[error("Ballot already initialized!")]
    AlreadyInitialized,
    #[error("You have already voted. Suffer for 5 years now")]
    AlreadyVoted,
    #[error("Hey! you are not the chairperson, you cannot make changes...")]
    YouAreNotTheChairperson,
}

impl From<BallotErrors> for ProgramError {
    fn from(e: BallotErrors) -> Self {
        ProgramError::Custom(e as u32)
    }
}
