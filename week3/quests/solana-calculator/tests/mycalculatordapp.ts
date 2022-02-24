const assert = require('assert');
const anchor = require('@project-serum/anchor');
const { SystemProgram } = anchor.web3;

describe("mycalculatordapp", () => {
    const provider = anchor.Provider.local();
    anchor.setProvider(provider);

    const calculator = anchor.web3.Keypair.generate();
    const program = anchor.workspace.Mycalculatordapp;
    let _calculator;

    it("Creates a calculator", async () => {
        await program.rpc.create("Welcome to Solana", {
           accounts: {
               calculator: calculator.publicKey,
               user: provider.wallet.publicKey,
               systemProgram: SystemProgram.programId
           },
           signers: [calculator]
        });

        const account = await program.account.calculator.fetch(calculator.publicKey);
        assert.ok(account.greeting === "Welcome to Solana");
        _calculator = calculator;
    });

    it("Adds two numbers", async () => {
        const calculator = _calculator;
        await program.rpc.add(new anchor.BN(2), new anchor.BN(2), {
            accounts: {
                calculator: calculator.publicKey,
            }
        })

        const account = await program.account.calculator.fetch(calculator.publicKey);
        assert.ok(account.result.eq(new anchor.BN(4)));
        assert.ok(account.greeting === "Welcome to Solana");
    })

    it("Multiplies two numbers", async () => {
       const calculator = _calculator; 
       await program.rpc.multiply(new anchor.BN(5), new anchor.BN(2), {
            accounts: {
                calculator: calculator.publicKey,
            }
       })

       const account = await program.account.calculator.fetch(calculator.publicKey);
       assert.ok(account.result.eq(new anchor.BN(10)));
       assert.ok(account.greeting === "Welcome to Solana");
    });

    it("Substracts two numbers", async () => {
       const calculator = _calculator; 
       await program.rpc.subtract(new anchor.BN(5), new anchor.BN(2), {
            accounts: {
                calculator: calculator.publicKey,
            }
       })

       const account = await program.account.calculator.fetch(calculator.publicKey);
       assert.ok(account.result.eq(new anchor.BN(3)));
       assert.ok(account.greeting === "Welcome to Solana");
    });

    it("Divides two numbers", async () => {
       const calculator = _calculator; 
       await program.rpc.divide(new anchor.BN(10), new anchor.BN(2), {
            accounts: {
                calculator: calculator.publicKey,
            }
       })

       const account = await program.account.calculator.fetch(calculator.publicKey);
       assert.ok(account.result.eq(new anchor.BN(5)));
       assert.ok(account.remainder.eq(new anchor.BN(0)));
       assert.ok(account.greeting === "Welcome to Solana");
    });
})
