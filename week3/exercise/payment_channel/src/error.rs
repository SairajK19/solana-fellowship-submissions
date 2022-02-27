use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum MultisigErrors {
    #[error("Proposer should sign the transaction")]
    ProposerNotSigned,
}

impl From<MultisigErrors> for ProgramError {
    fn from(e: MultisigErrors) -> Self {
        ProgramError::Custom(e as u32)
    }
}
