use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::{accounts::account::Account, prelude::*};
pub mod errors;
use crate::errors::MultisigErrors;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod payment_channel {
    use anchor_lang::solana_program::program::invoke_signed;

    use super::*;

    pub fn create_multisig(
        ctx: Context<CreateMultisig>,
        owners: Vec<Pubkey>,
        threshold: u64,
        nonce: u8,
    ) -> ProgramResult {
        let multisig = &mut ctx.accounts.multisig;
        multisig.owners = owners;
        multisig.nonce = nonce;
        multisig.threshold = threshold;
        multisig.owner_set_seqno = 0;
        Ok(())
    }

    pub fn create_transaction(
        ctx: Context<CreateTransaction>,
        program_ids: Vec<Pubkey>,
        transaction_accounts: Vec<Vec<TransactionAccount>>,
        datas: Vec<Vec<u8>>,
    ) -> ProgramResult {
        if program_ids.len() != transaction_accounts.len() || program_ids.len() != datas.len() {
            return Err(MultisigErrors::ParamLength.into());
        }

        // Check if proposer is one of the owner
        let _ = ctx
            .accounts
            .multisig
            .owners
            .iter()
            .position(|owner| owner == ctx.accounts.proposer.key)
            .ok_or(MultisigErrors::InvalidOwner);

        let mut signers = Vec::new();
        // initialize an array of size owners.len(), and assign signers to false
        signers.resize(ctx.accounts.multisig.owners.len(), false);

        let trans = &mut ctx.accounts.transaction;
        trans.signers = signers;
        trans.accounts = transaction_accounts;
        trans.datas = datas;
        trans.did_execute = false;
        trans.multisig = *ctx.accounts.multisig.to_account_info().key;
        trans.program_ids = program_ids;
        trans.owner_set_seqno = ctx.accounts.multisig.owner_set_seqno;

        Ok(())
    }

    pub fn approve_transaction(ctx: Context<ApproveTransaction>) -> ProgramResult {
        // checks if the approver is a owner
        let owner_index = ctx
            .accounts
            .multisig
            .owners
            .iter()
            .position(|a| a == ctx.accounts.owner.key)
            .ok_or(MultisigErrors::InvalidOwner)?;

        // sets that owner to as approved
        ctx.accounts.transaction.signers[owner_index] = true;

        // checks if threshold has met
        let sig_count = ctx
            .accounts
            .transaction
            .signers
            .iter()
            .filter(|&did_sign| *did_sign)
            .count() as u64;

        if sig_count < ctx.accounts.multisig.threshold {
            return Ok(());
        }

        // return if transaction already executed
        if ctx.accounts.transaction.did_execute {
            return Err(MultisigErrors::AlreadyExecuted.into());
        }

        let mut ixs: Vec<Instruction> = (&*ctx.accounts.transaction).into();

        for ix in ixs.iter_mut() {
            ix.accounts = ix
                .accounts
                .iter()
                .map(|acc| {
                    let mut acc = acc.clone();
                    if &acc.pubkey == ctx.accounts.multisig_signer.key {
                        acc.is_signer = true;
                    }
                    acc
                })
                .collect();
        }

        let seeds = &[
            ctx.accounts.multisig.to_account_info().key.as_ref(),
            &[ctx.accounts.multisig.nonce],
        ];

        let signer = &[&seeds[..]]; //&[&[&[u8]]];
        let accounts = ctx.remaining_accounts;
        for ix in ixs.iter() {
            invoke_signed(ix, &accounts, signer)?;
        }

        ctx.accounts.transaction.did_execute = true;
        Ok(())
    }

    // bi-directional payment channel
    pub fn create_payment_channel(
        ctx: Context<CreatePaymentChannel>,
        payment_channel_bump: u8,
        balances: Vec<u64>,
        users: Vec<Pubkey>,
        expires_at: u32,
    ) -> ProgramResult {
        let payment_channel_pda = &mut ctx.accounts.payment_channel_pda;

        msg!("{}", payment_channel_bump);

        payment_channel_pda.balances = balances;
        payment_channel_pda.users = users;
        payment_channel_pda.bump = payment_channel_bump;
        payment_channel_pda.expires_at = expires_at;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> ProgramResult {
        let payment_channel_pda = &ctx.accounts.payment_channel_pda;
        let user = ctx.accounts.user.key;

        // checks if the approver is a owner of  the multisig
        let owner_index = ctx
            .accounts
            .multisig
            .owners
            .iter()
            .position(|a| a == user)
            .ok_or(MultisigErrors::InvalidOwner)?;

        let amount = payment_channel_pda.balances[owner_index];

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.payment_channel_pda.key(),
            &ctx.accounts.user.key(),
            amount,
        );

        msg!("{:?}", ix);

        anchor_lang::solana_program::program::invoke_signed(
            &ix,
            &[
                ctx.accounts.payment_channel_pda.to_account_info(),
                ctx.accounts.user.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[&[
                b"payment_channel",
                &[payment_channel_pda.bump],
            ]],
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMultisig<'info> {
    #[account(zero)]
    multisig: Account<'info, Multisig>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateTransaction<'info> {
    multisig: Account<'info, Multisig>,

    #[account(zero)]
    transaction: Account<'info, Transaction>,

    #[account(signer)]
    proposer: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ApproveTransaction<'info> {
    #[account(constraint = multisig.owner_set_seqno == transaction.owner_set_seqno)]
    pub multisig: Account<'info, Multisig>,

    #[account(
        seeds = [multisig.to_account_info().key.as_ref()],
        bump = multisig.nonce,
    )]
    pub multisig_signer: AccountInfo<'info>,

    #[account(mut, has_one = multisig)]
    pub transaction: Account<'info, Transaction>,

    #[account(signer)]
    pub owner: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(payment_channel_bump: u8)]
pub struct CreatePaymentChannel<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub multisig: Account<'info, Multisig>,

    #[account(init, payer = user, space = 32 + 64 + 4 + 200 + 8 + 1, seeds = [b"payment_channel"], bump = payment_channel_bump)]
    pub payment_channel_pda: Account<'info, PaymentChannel>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub multisig: Account<'info, Multisig>,

    pub multisig_signer: AccountInfo<'info>,

    #[account(mut)]
    pub payment_channel_pda: Account<'info, PaymentChannel>,

    pub system_program: Program<'info, System>,
}

/*
    owner // to send tokens
    multisig_signer // who has the tokens
    payment_channel_pda, // to update channel data
*/

#[account]
pub struct Multisig {
    pub owners: Vec<Pubkey>, // array of owners of multisig
    pub threshold: u64,      // min signatures for transaction to approve
    pub nonce: u8,
    pub owner_set_seqno: u32,
}

#[account]
pub struct Transaction {
    pub multisig: Pubkey,                       // multisig account pubkey
    pub program_ids: Vec<Pubkey>,               // target program to execute against
    pub accounts: Vec<Vec<TransactionAccount>>, // accounts whos signature is required
    pub datas: Vec<Vec<u8>>,                    // instruction data for the transaction
    pub signers: Vec<bool>,                     // singers who has signed
    pub did_execute: bool,                      // burned or not (executes only one time)
    pub owner_set_seqno: u32,                   // Owner set sequence number.
}

impl From<&Transaction> for Vec<Instruction> {
    fn from(tx: &Transaction) -> Vec<Instruction> {
        let mut instructions: Vec<Instruction> = Vec::new();
        for (i, _program_ids) in tx.program_ids.iter().enumerate() {
            instructions.push(Instruction {
                program_id: tx.program_ids[i],
                accounts: tx.accounts[i]
                    .iter()
                    .map(|t| AccountMeta::from(t))
                    .collect(),
                data: tx.datas[i].clone(),
            })
        }

        instructions
    }
}

#[account]
pub struct PaymentChannel {
    pub multisig: Pubkey,   // multisig corresponding to that channel
    pub users: Vec<Pubkey>, // users participated in the channel
    pub expires_at: u32,    // time when channel expires
    pub balances: Vec<u64>, // balance that the PDA holds, (Deposited by users)
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TransactionAccount {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}

impl From<&TransactionAccount> for AccountMeta {
    fn from(account: &TransactionAccount) -> AccountMeta {
        match account.is_writable {
            false => AccountMeta::new_readonly(account.pubkey, account.is_signer),
            true => AccountMeta::new(account.pubkey, account.is_signer),
        }
    }
}

impl From<&AccountMeta> for TransactionAccount {
    fn from(account_meta: &AccountMeta) -> TransactionAccount {
        TransactionAccount {
            pubkey: account_meta.pubkey,
            is_signer: account_meta.is_signer,
            is_writable: account_meta.is_writable,
        }
    }
}

/*
Payment Channel
multisig: Pubkey
users []
expires at
balance
*/

/*

Alice -> 20
Bob -> 20

Alice and Bob creates a channel
Alice send 20TokenX to Somewhere
Bob send 10TokenY to Alice

Alice and Bob creates a channel
Alice sends 20TokenX to Somewhere
Bob dosent send anything
Alice withdraws

Vise Versa

*/
