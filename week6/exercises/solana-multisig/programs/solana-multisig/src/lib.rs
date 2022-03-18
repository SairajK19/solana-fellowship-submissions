use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::invoke_signed;
pub mod errors;
pub mod state;
use crate::errors::MultisigErrors;
use crate::state::{Multisig, Transaction, TransactionAccount};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod solana_multisig {
    use super::*;

    pub fn create_multisig(
        ctx: Context<CreateMultisig>,
        owners: Vec<Pubkey>,
        threshold: u8,
        seq_no: u8,
        nonce: u8,
    ) -> Result<()> {
        let multisig = &mut ctx.accounts.multisig;
        multisig.owners = owners;
        multisig.threshold = threshold;
        multisig.seq_no = seq_no;
        multisig.nonce = nonce;

        Ok(())
    }

    pub fn create_transaction(
        ctx: Context<CreateTransaction>,
        accountss: Vec<Vec<TransactionAccount>>,
        pid: Pubkey,
        datas: Vec<Vec<u8>>,
        seq_no: u8,
    ) -> Result<()> {
        let _ = ctx
            .accounts
            .multisig
            .owners
            .iter()
            .position(|owner| owner == ctx.accounts.creator.key)
            .ok_or(error!(MultisigErrors::InvalidOwner));

        let transaction = &mut ctx.accounts.transaction;
        transaction.accounts = accountss;
        transaction.multisig = ctx.accounts.multisig.key();
        transaction.datas = datas;
        transaction.executed = false;

        let mut signers = Vec::new();
        signers.resize(ctx.accounts.multisig.owners.len(), false);
        transaction.signed_by = signers;
        transaction.seq_no = seq_no;
        transaction.program_id = pid;

        Ok(())
    }

    pub fn approve_transaction(ctx: Context<ApproveTransaction>) -> Result<()> {
        let owner_position = ctx
            .accounts
            .multisig
            .owners
            .iter()
            .position(|owner| owner == ctx.accounts.approver.key)
            .ok_or(error!(MultisigErrors::InvalidOwner))?;

        if ctx.accounts.multisig.seq_no != ctx.accounts.transaction.seq_no {
            return Err(error!(MultisigErrors::UnknownTransaction));
        }

        ctx.accounts.transaction.signed_by[owner_position] = true;

        Ok(())
    }

    pub fn execute_transaction(ctx: Context<ExecuteTransaction>) -> Result<()> {
        // If already executed then return
        if ctx.accounts.transaction.executed {
            return Err(error!(MultisigErrors::AlreadyExecuted));
        }

        let _ = ctx
            .accounts
            .multisig
            .owners
            .iter()
            .position(|owner| owner == ctx.accounts.owner.key)
            .ok_or(error!(MultisigErrors::InvalidOwner))?;

        if ctx.accounts.multisig.seq_no != ctx.accounts.transaction.seq_no {
            return Err(error!(MultisigErrors::UnknownTransaction));
        }

        let no_signed = ctx
            .accounts
            .transaction
            .signed_by
            .iter()
            .filter(|&&position| position == true)
            .count() as u8;

        // threshold not reached, then just return!!
        if ctx.accounts.multisig.threshold < no_signed {
            return Err(error!(MultisigErrors::NotApproved));
        }

        // good to execute now
        let seeds = &[
            ctx.accounts.multisig.to_account_info().key.as_ref(),
            &[ctx.accounts.multisig.nonce],
        ];

        let signer = &[&seeds[..]];
        let accounts = ctx.remaining_accounts;

        // get all the instructions and store into a vector.
        let ixs: Vec<Instruction> = (&*ctx.accounts.transaction).into();
        for ix in ixs {
            invoke_signed(&ix, &accounts, signer)?; // execute
        }

        // set executed as true
        ctx.accounts.transaction.executed = true;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMultisig<'info> {
    #[account(zero)]
    pub multisig: Account<'info, Multisig>,
}

#[derive(Accounts)]
pub struct CreateTransaction<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(zero)]
    pub transaction: Account<'info, Transaction>,
    #[account(mut)]
    pub multisig: Account<'info, Multisig>,
}

#[derive(Accounts)]
pub struct ApproveTransaction<'info> {
    #[account(mut)]
    pub approver: Signer<'info>,
    #[account(mut)]
    pub transaction: Account<'info, Transaction>,
    pub multisig: Account<'info, Multisig>,
}

#[derive(Accounts)]
pub struct ExecuteTransaction<'info> {
    pub owner: Signer<'info>,
    #[account(mut)]
    pub transaction: Account<'info, Transaction>,
    pub multisig: Account<'info, Multisig>,
}

impl From<&Transaction> for Vec<Instruction> {
    fn from(tx: &Transaction) -> Vec<Instruction> {
        let mut instructions: Vec<Instruction> = Vec::new();
        for (i, _pid) in tx.accounts.iter().enumerate() {
            instructions.push(Instruction {
                program_id: tx.program_id,
                accounts: tx.accounts[i]
                    .iter()
                    .map(|account| AccountMeta::from(account))
                    .collect(),
                data: tx.datas[i].clone(),
            })
        }
        instructions
    }
}

impl From<&TransactionAccount> for AccountMeta {
    fn from(account: &TransactionAccount) -> AccountMeta {
        match account.is_writable {
            false => AccountMeta::new_readonly(account.pubkey, account.is_signer),
            true => AccountMeta::new(account.pubkey, account.is_signer),
        }
    }
}
