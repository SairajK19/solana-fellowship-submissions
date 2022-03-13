use anchor_lang::prelude::*;

#[error_code]
pub enum StakingErrors {
    #[msg("Staking end time has not yet reached!")]
    EndTimeNotReached,
}
