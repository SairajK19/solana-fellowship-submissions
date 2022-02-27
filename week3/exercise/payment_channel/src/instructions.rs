use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum MultisigInstructions {
    CreateMultisig { input: Vec<u8> },
    CreateTransaction { input: Vec<u8> },
}
