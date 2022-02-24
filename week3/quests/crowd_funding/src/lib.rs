use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct CampaignAccount {
    pub campaign_owner: Pubkey,
    pub campaign_amounts: u64,
    pub campaign_descriptions: String,
    pub campaign_fulfilled: u64,
}

entrypoint!(process_instruction);
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let (instruction_byte, all_other_bytes) = instruction_data.split_first().unwrap();
    let accounts_itr = &mut accounts.iter();
    let amount = all_other_bytes
        .get(..8)
        .and_then(|slice| slice.try_into().ok())
        .map(u64::from_le_bytes)
        .unwrap();

    let description = String::from_utf8(all_other_bytes[9..].to_vec()).unwrap();

    match instruction_byte {
        0 => {
            msg!("Creating crowdfund campaign...");
            let campaign_account = next_account_info(accounts_itr)?;
            let mut campaign_account_data =
                CampaignAccount::try_from_slice(&campaign_account.data.borrow())?;
            campaign_account_data.campaign_amounts = amount;
            campaign_account_data.campaign_descriptions = description;
            campaign_account_data.campaign_fulfilled = 0;
            campaign_account_data.campaign_owner = *campaign_account.owner;
            campaign_account_data.serialize(&mut &mut campaign_account.data.borrow_mut()[..])?;
        }
        1 => {
            msg!("Status of the campaign is...");
            let campaign_account = next_account_info(accounts_itr)?;
            let campaign_account_data =
                CampaignAccount::try_from_slice(&campaign_account.data.borrow())?;
            msg!(
                "Fulfilled {} out of {}",
                campaign_account_data.campaign_fulfilled,
                campaign_account_data.campaign_amounts
            );
        }
        _ => msg!("Invalid instruction...."),
    }

    Ok(())
}
