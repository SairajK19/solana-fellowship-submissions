use anchor_lang::prelude::*;

#[error_code]
pub enum MultisigErrors {
    #[msg("WHAT?! you down own the multisig, you can't make changes -_-")]
    InvalidOwner,
    #[msg("Transaction dosen't belong to this multisig :)")]
    UnknownTransaction,
    #[msg("Not approved by all the owners :(")]
    NotApproved,
    #[msg("Transaction already executed, that was sneaky, gotcha! :)")]
    AlreadyExecuted,
}
