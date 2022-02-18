use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum BallotErrors {
    #[error("Invalid Instruction")]
    InvalidInstruction,
}

impl From<BallotErrors> for ProgramError {
    fn from(e: BallotErrors) -> Self {
        ProgramError::Custom(e as u32)
    }
}
