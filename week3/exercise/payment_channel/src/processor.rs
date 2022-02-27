use std::ops::Mul;

use crate::{instructions::MultisigInstructions, state::{Multisig, Transaction}, error::MultisigErrors};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    instruction::Instruction,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub struct Processor;
impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = MultisigInstructions::try_from_slice(instruction_data)
            .map_err(|_| ProgramError::InvalidInstructionData)?;

        match instruction {
            MultisigInstructions::CreateMultisig { input } => {
                msg!("Creating multisig! 🚀️");
                Processor::create_multisig(accounts, &input, program_id)?;
            },
            MultisigInstructions::CreateTransaction { input } => {
                msg!("Creating transaction! 🚀️");
                Processor::create_transaction(accounts, &input, program_id)?;
            }
        }
        Ok(())
    }

    fn create_multisig(
        accounts: &[AccountInfo],
        input: &[u8],
        program_id: &Pubkey,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let multisig_account = next_account_info(account_info_iter)?; // multisig account

        let multisig_data = Multisig::try_from_slice(&input)?;

        let writer = &mut &mut multisig_account.data.borrow_mut()[..];
        multisig_data.serialize(writer)?;
        msg!("Created!");
        Ok(())
    }

    fn create_transaction(
        accounts: &[AccountInfo],
        input: &[u8],
        program_id: &Pubkey,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        // let multisig_account = next_account_info(account_info_iter)?; // multisig state account

        // let proposer = next_account_info(account_info_iter)?; // proposer

        // let multisig_data = Multisig::try_from_slice(&multisig_account.data.borrow())?;

        // if !multisig_data.owners.contains(&proposer.key) {
        //     msg!("{} are not authorized to create a transaction!", &proposer.key);
        //     return Err(ProgramError::IllegalOwner);
        // }

        // if !proposer.is_signer {
        //     msg!("Proposer isnt the signer!");
        //     return Err(MultisigErrors::ProposerNotSigned.into());
        // }

        let transaction_account = next_account_info(account_info_iter)?; // transaction state account

        // if multisig_account.owner != program_id || transaction_account.owner != program_id {
        //     msg!("Account not owned by this program!");
        //     return Err(ProgramError::IllegalOwner);
        // }

        let transaction_data = Transaction::try_from_slice(&input)?;


        let writer = &mut &mut transaction_account.data.borrow_mut()[..];
        transaction_data.serialize(writer)?;
        msg!("Written");
        Ok(())
    }
}
