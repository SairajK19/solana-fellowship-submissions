use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod dverification {
    use super::*;

    pub fn create_username(ctx: Context<CreateUsername>, username: String, bump: u8) -> Result<()> {
        if username.len() >= UserAccount::MAX_USERNAME_LEN {
            return Err(ProgramError::InvalidArgument);
        }

        ctx.accounts.user.username = username.clone();
        ctx.accounts.user.bump = bump;
        ctx.accounts.user.authority = ctx.accounts.authority.key();
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(username: String, bump: u8)]
pub struct CreateUsername<'info> {
    #[account(init, payer = authority, space = UserAccount::SPACE, seeds = [username.as_bytes()], bump, owner = *program_id)]
    user: Account<'info, UserAccount>,

    system_program: AccountInfo<'info>,

    #[account(mut, signer)]
    authority: AccountInfo<'info>,
}

#[account]
pub struct UserAccount {
    pub username: String,
    pub authority: Pubkey,
    pub bump: u8,
}

impl UserAccount {
    const SPACE: usize = 8 + 32 + 1 + Self::MAX_USERNAME_SIZE;
    const MAX_USERNAME_SIZE: usize = 140;
}
