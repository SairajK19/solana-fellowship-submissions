use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[account]
pub struct UserNFTData {
    pub authority: Pubkey,
    pub sold: bool,
    // pub nft_address: Pubkey
}

#[program]
pub mod nft_marketplace {
    use super::*;

    pub fn initialize_user_nft_data(ctx: Context<InitializeUserNFTData>) -> ProgramResult {
        let user_nft_data = &mut ctx.accounts.user_nft_data;
        user_nft_data.authority = *ctx.accounts.user.key;
        user_nft_data.sold = false;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeUserNFTData<'info> {
    #[account(init, payer = user, space = 8 + 32 + 1)]
    pub user_nft_data: Account<'info, UserNFTData>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
