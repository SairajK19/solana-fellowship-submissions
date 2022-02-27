use anchor_lang::prelude::*;

#[error]
pub enum MultisigErrors {
    #[msg("Passed owner dosen't belong to this multisig!!")]
    InvalidOwner,
    #[msg("program id account data must have same length")]
    ParamLength,
    #[msg("Transaction already executed")]
    AlreadyExecuted,
}
