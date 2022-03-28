/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Keypair, PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram, TransactionInstruction, Transaction } from '@solana/web3.js'
import { serializeInstructionToBase64 } from '@solana/spl-governance'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID} from '@solana/spl-token'
import { AccountLayout, MintLayout, NATIVE_MINT } from '@solana/spl-token';
import { InitVault, Vault, VaultProgram, SafetyDepositBox, VaultState, WithdrawSharesFromTreasury } from '@metaplex-foundation/mpl-token-vault';
import * as metaplex from '@metaplex/js';
import { WalletAdapter } from '@solana/wallet-adapter-base'
import type { ConnectionContext } from 'utils/connection'
import * as borsh from 'borsh'

import { GovernedTokenAccount } from './tokens'
import { UiInstruction } from './uiTypes/proposalCreationTypes'

const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

const TOKEN_VAULT_PROGRAM_ID = new PublicKey("vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn")

const TOKR_PROGRAM = new PublicKey('Tokr9wmF3VjWEqQAafPfFNhSTava68UJszr5wxnSuwK')


export class TokrizeArgs {
	instruction = 0
	name: string
	symbol: string
	uri: string
	mint_bump: number
	mint_seed: string
	constructor(fields: { name: string; symbol: string; uri: string; mint_bump: number; mint_seed: string } | undefined = undefined) {
		if (fields) {
			this.name = fields.name
			this.symbol = fields.symbol
			this.uri = fields.uri
			this.mint_bump = fields.mint_bump
			this.mint_seed = fields.mint_seed
		}
	}
}

const TokrizeSchema = new Map([
	[
		TokrizeArgs,
		{
			kind: 'struct',
			fields: [
				['instruction', 'u8'],
				['name', 'string'],
				['symbol', 'string'],
				['uri', 'string'],
				['mint_bump', 'u8'],
				['mint_seed', 'string'],
			],
		},
	],
])

export class VaultArgs {
    instruction = 1;
    vault_bump: number;
    vault_seed: string;
    constructor(fields: { vault_bump: number, vault_seed: string } | undefined = undefined) {
      if (fields) {
        this.vault_bump = fields.vault_bump;
        this.vault_seed = fields.vault_seed;
      }
    }
  }
  
  const VaultSchema = new Map([
    [VaultArgs, {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['vault_bump', 'u8'],
        ['vault_seed', 'string']
      ]
    }],
  ]);

  export class AddTokenArgs {
    instruction = 2;
  }
  
  export const AddTokenSchema = new Map([
    [AddTokenArgs, {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
      ]
    }],
  ]);

  export class FractionalizeArgs {
    instruction = 3;
    number_of_shares: number;
    constructor(fields: { number_of_shares: number } | undefined = undefined) {
      if (fields) {
        this.number_of_shares = fields.number_of_shares;
      }
    }
  }
  
  export const FractionalizeSchema = new Map([
    [FractionalizeArgs, {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['number_of_shares', 'u64'],
      ]
    }],
  ]);

  export class SendFractionArgs {
    instruction = 4;
    number_of_shares: number;
    constructor(fields: { number_of_shares: number } | undefined = undefined) {
      if (fields) {
        this.number_of_shares = fields.number_of_shares;
      }
    }
  }
  
  export const SendFractionSchema = new Map([
    [SendFractionArgs, {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['number_of_shares', 'u64'],
      ]
    }],
  ]);

/**
 *
 *
 * Say hello
 * TODO integrate into
 */
 export async function getMintrNFTInstruction({
    schema,
    form,
    programId,
    connection,
    wallet,
    currentAccount,
    setFormErrors
    }: {
    schema: any
    form: any
    programId: PublicKey | undefined
    connection: ConnectionContext
    wallet: WalletAdapter | undefined
    currentAccount: GovernedTokenAccount | undefined
    setFormErrors: any
    }): Promise<UiInstruction> {
    const isValid =  true; // todo: await validateInstruction({ schema, form, setFormErrors })


    let serializedInstruction = ''
    const prerequisiteInstructions: TransactionInstruction[] = []

    // Generate a mint
    console.log(`Token info. Name: ${form.name}, Symbol: ${form.symbol}, Uri: ${form.metaDataUri}, Destination: ${form.destinationAddress}`);

     
    let instruction = await getMintInstruction(form, wallet)  
    let isSuccess = false;
    while (!isSuccess) {
        let tx = new Transaction()
        tx.add(instruction)
        tx.feePayer = wallet!.publicKey!

        let result = await connection.current.simulateTransaction(tx);
        if (result.value.err) {
            console.log("Simulation Failed!")
            instruction = await getMintInstruction(form, wallet)  
        } else {
            console.log("Simulation Success!")
            isSuccess = true;
        }
    }

    serializedInstruction = serializeInstructionToBase64(instruction)

    const obj: UiInstruction = {
        serializedInstruction,
        isValid,
        governance: currentAccount?.governance,
        prerequisiteInstructions: prerequisiteInstructions,
    }
    return obj
}

async function getMintInstruction(form: any, wallet: WalletAdapter | undefined): Promise<TransactionInstruction> {
  
    // Generate a mint
  
    let destinationAccount = new PublicKey(String(form.destinationAddress));
  
    let mintSeed = (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2);
    const mintPdaData = await getMintPda(wallet!.publicKey!, mintSeed, destinationAccount);
    const mintKey = mintPdaData[0];
    const mintBump = mintPdaData[1];
  
    const metadataKey = await getMetadataPda(mintKey);
  
    const ataKey = await getAtaPda(destinationAccount, mintKey);
  
    console.log("Payer:", wallet!.publicKey!.toBase58());
    console.log("Destination: ", destinationAccount.toBase58());
    console.log("Mint:", mintKey.toBase58());
    console.log("Ata:", ataKey.toBase58());
  
    const data = Buffer.from(borsh.serialize(
        TokrizeSchema,
        new TokrizeArgs({
          name:  String(form.name),
          symbol: String(form.symbol),
          uri: String(form.metaDataUri),
          mint_seed: mintSeed,
          mint_bump: mintBump
        })
    ));
  
    return new TransactionInstruction(

        {
            keys: [
                {pubkey: wallet!.publicKey!, isSigner: true, isWritable: true},           // payer
                {pubkey: destinationAccount, isSigner: false, isWritable: true},          // NFT destination        
                {pubkey: wallet!.publicKey!, isSigner: true, isWritable: true},           // NFT creator       
                {pubkey: mintKey, isSigner: false, isWritable: true},                     // Mint Account to create
                {pubkey: metadataKey, isSigner: false, isWritable: true},                 // Metadata account to create  
                {pubkey: ataKey, isSigner: false, isWritable: true},                      // New associated token account for destination
                {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},           // SPL token program
                {pubkey: TOKEN_METADATA_PROGRAM_ID, isSigner: false, isWritable: false},  // Metaplex token program 
                {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},    // SPL system program
                {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},         // SPL rent program
                {pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false} // SPL ata program
            ],
            programId: TOKR_PROGRAM,
            data: data
        }
    );
}


export async function getVaultInstruction({
    schema,
    form,
    programId,
    connection,
    wallet,
    currentAccount,
    setFormErrors
    }: {
    schema: any
    form: any
    programId: PublicKey | undefined
    connection: ConnectionContext
    wallet: WalletAdapter | undefined
    currentAccount: GovernedTokenAccount | undefined
    setFormErrors: any
    }): Promise<UiInstruction> {
    const isValid =  true; // todo: await validateInstruction({ schema, form, setFormErrors })

    let vaultSeed = (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2);

    const [vaultKey, vaultBump] = (await PublicKey.findProgramAddress([wallet!.publicKey!.toBuffer(), TOKEN_VAULT_PROGRAM_ID.toBuffer(), Buffer.from(vaultSeed)], TOKR_PROGRAM))
  
    // console.log("Vault Seed: ", vaultSeed);
    // console.log("Vault Bump: ", vaultBump);
  
    const data = Buffer.from(borsh.serialize(
      VaultSchema,
      new VaultArgs({ vault_bump: vaultBump, vault_seed: vaultSeed })
    ));
    
    const vaultMintAuthority = await Vault.getPDA(vaultKey);
  
    const externalPricingAccountKey = (await PublicKey.findProgramAddress([Buffer.from("external"), vaultKey.toBuffer(), wallet!.publicKey!.toBuffer()], TOKR_PROGRAM))[0]
  
    const fractionMintkey = (await PublicKey.findProgramAddress([Buffer.from("fraction"), vaultKey.toBuffer(), wallet!.publicKey!.toBuffer()], TOKR_PROGRAM))[0]
  
    const redeemTreasuryKey = (await PublicKey.findProgramAddress([vaultMintAuthority.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), NATIVE_MINT.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID))[0]
  
    const fractionTreasuryKey = (await PublicKey.findProgramAddress([vaultMintAuthority.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), fractionMintkey.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID))[0]
  
    console.log("Vault Public Key:", vaultKey.toBase58());
    // console.log("vaultAuthority:", vaultAuthority.toBase58());
    // console.log("externalPricingAccountKey:", externalPricingAccountKey.toBase58());
    // console.log("fractionMintkey:", fractionMintkey.toBase58());
    // console.log("redeemTreasuryKey:", redeemTreasuryKey.toBase58());
    // console.log("fractionTreasuryKey:", fractionTreasuryKey.toBase58());
  
  
    const instruction = new TransactionInstruction(
      {
        keys: [
          { pubkey: wallet!.publicKey!, isSigner: true, isWritable: true },
          { pubkey: wallet!.publicKey!, isSigner: false, isWritable: true },
          { pubkey: vaultKey, isSigner: false, isWritable: true },
          { pubkey: vaultMintAuthority, isSigner: false, isWritable: true },
          { pubkey: externalPricingAccountKey, isSigner: false, isWritable: true },
          { pubkey: fractionMintkey, isSigner: false, isWritable: true },
          { pubkey: redeemTreasuryKey, isSigner: false, isWritable: true },
          { pubkey: fractionTreasuryKey, isSigner: false, isWritable: true },
          { pubkey: TOKEN_VAULT_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
          { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: NATIVE_MINT, isSigner: false, isWritable: false },
        ],
        programId: TOKR_PROGRAM,
        data: data
      }
    );

    const obj: UiInstruction = {
        serializedInstruction: serializeInstructionToBase64(instruction),
        isValid,
        governance: currentAccount?.governance,
        prerequisiteInstructions: [],
    }
    return obj
}


export async function getAddTokenInstruction({
    schema,
    form,
    programId,
    connection,
    wallet,
    currentAccount,
    setFormErrors
    }: {
    schema: any
    form: any
    programId: PublicKey | undefined
    connection: ConnectionContext
    wallet: WalletAdapter | undefined
    currentAccount: GovernedTokenAccount | undefined
    setFormErrors: any
    }): Promise<UiInstruction> {
    const isValid =  true; // todo: await validateInstruction({ schema, form, setFormErrors })

    console.log("Governed Account, ", currentAccount)

    const fromAddress = new PublicKey(form.fromAddress)
    const vaultAddress = new PublicKey(form.vaultAddress)
    const tokenMint = new PublicKey(form.tokenMint)

    const vaultMintAuthority = await Vault.getPDA(vaultAddress);
    const safetyDepositBox = await SafetyDepositBox.getPDA(vaultAddress, tokenMint);
    const transferAuthorityKey = (await PublicKey.findProgramAddress([Buffer.from("transfer"), vaultAddress.toBuffer(), tokenMint.toBuffer()], TOKR_PROGRAM))[0]
  
  
    // const tokenAta = await getAtaPda(w.publicKey, tokenAddress); // todo replace with treasury
    const tokenStoreKey = (await PublicKey.findProgramAddress([Buffer.from("store"), vaultAddress.toBuffer(), tokenMint.toBuffer()], TOKR_PROGRAM))[0]
  
    console.log("fromAta: ", fromAddress.toBase58());
    console.log("vault: ", vaultAddress.toBase58());
    console.log("vaultMintAuthority: ", vaultMintAuthority.toBase58());
    console.log("safetyDepositBox: ", safetyDepositBox.toBase58());
    console.log("transferAuthority: ", transferAuthorityKey.toBase58());
    console.log("tokenStoreKey: ", tokenStoreKey.toBase58());
  
    const data = Buffer.from(borsh.serialize(
      AddTokenSchema,
      new AddTokenArgs()
    ));
  
    const instruction = new TransactionInstruction(
      {
        keys: [
          { pubkey: tokenMint, isSigner: false, isWritable: true },
          { pubkey: wallet!.publicKey!, isSigner: true, isWritable: true },
          { pubkey: fromAddress, isSigner: false, isWritable: true },
          { pubkey: transferAuthorityKey, isSigner: false, isWritable: true },
          { pubkey: wallet!.publicKey!, isSigner: false, isWritable: true },
          { pubkey: vaultAddress, isSigner: false, isWritable: true },
          { pubkey: vaultMintAuthority, isSigner: false, isWritable: true },
          { pubkey: tokenStoreKey, isSigner: false, isWritable: true },
          { pubkey: safetyDepositBox, isSigner: false, isWritable: true },
          { pubkey: TOKEN_VAULT_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
          { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: TOKR_PROGRAM,
        data: data
      }
    );

    const obj: UiInstruction = {
        serializedInstruction: serializeInstructionToBase64(instruction),
        isValid,
        governance: currentAccount?.governance,
        prerequisiteInstructions: [],
    }
    return obj
}

/**
 *
 *
 * Say hello
 * TODO integrate into
 */
 export async function getFractionalizeInstruction({
  schema,
  form,
  programId,
  connection,
  wallet,
  currentAccount,
  setFormErrors
  }: {
  schema: any
  form: any
  programId: PublicKey | undefined
  connection: ConnectionContext
  wallet: WalletAdapter | undefined
  currentAccount: GovernedTokenAccount | undefined
  setFormErrors: any
  }): Promise<UiInstruction> {

  const prerequisiteInstructions: TransactionInstruction[] = []

  const isValid =  true; // todo: await validateInstruction({ schema, form, setFormErrors })

  const vaultAddress = new PublicKey(form.vaultAddress)
  const vault = await metaplex.programs.vault.Vault.load(connection.current, vaultAddress);

  const fractionMint = await connection.current.getAccountInfo(new PublicKey(vault.data.fractionMint))!;

  const rawMint = MintLayout.decode(fractionMint!.data.slice(0, MintLayout.span));
  if (!rawMint.mintAuthorityOption) {
    throw new Error("Incorrect Vault Layout")
  }
  const vaultMintAuthority = new PublicKey(rawMint.mintAuthority);


  const data = Buffer.from(borsh.serialize(
    FractionalizeSchema,
    new FractionalizeArgs({ number_of_shares: form.numberOfShares })
  ));

  const instruction = new TransactionInstruction(
    {
      keys: [
        { pubkey: wallet!.publicKey!, isSigner: true, isWritable: true },
        { pubkey: wallet!.publicKey!, isSigner: false, isWritable: true },
        { pubkey: vaultAddress, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(vaultMintAuthority), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(vault.data.fractionMint), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(vault.data.fractionTreasury), isSigner: false, isWritable: true },
        { pubkey: TOKEN_VAULT_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: TOKR_PROGRAM,
      data: data
    }
  );

  const obj: UiInstruction = {
      serializedInstruction: serializeInstructionToBase64(instruction),
      isValid,
      governance: currentAccount?.governance,
      prerequisiteInstructions: prerequisiteInstructions,
  }
  return obj
}

/**
 *
 *
 * Say hello
 * TODO integrate into
 */
 export async function getSendSharesInstruction({
  schema,
  form,
  programId,
  connection,
  wallet,
  currentAccount,
  setFormErrors
  }: {
  schema: any
  form: any
  programId: PublicKey | undefined
  connection: ConnectionContext
  wallet: WalletAdapter | undefined
  currentAccount: GovernedTokenAccount | undefined
  setFormErrors: any
  }): Promise<UiInstruction> {
  const isValid =  true; // todo: await validateInstruction({ schema, form, setFormErrors })

  const destination = new PublicKey(form.destination)
  const vaultAddress = new PublicKey(form.vaultAddress)
  const mintAddress = new PublicKey(form.tokenMint)

  const prerequisiteInstructions: TransactionInstruction[] = []

  const vault = await metaplex.programs.vault.Vault.load(connection.current, vaultAddress);

  const destination_ata = await getAtaPda(
    destination,
    new PublicKey(vault.data.fractionMint),
  );

  console.log("ATA address:", destination_ata.toBase58())

  const data = Buffer.from(borsh.serialize(
    SendFractionSchema,
    new SendFractionArgs({ number_of_shares: form.numberOfShares })
  ));

  const transferAuthorityKey = (await PublicKey.findProgramAddress([Buffer.from("vault"), TOKEN_VAULT_PROGRAM_ID.toBuffer(), vaultAddress.toBuffer()], TOKEN_VAULT_PROGRAM_ID))[0]

  const instruction = new TransactionInstruction(
    {
      keys: [
        { pubkey: mintAddress, isSigner: false, isWritable: true },
        { pubkey: wallet!.publicKey!, isSigner: true, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
        { pubkey: destination_ata, isSigner: false, isWritable: true },
        { pubkey: transferAuthorityKey, isSigner: false, isWritable: true },
        { pubkey: vaultAddress, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(vault.data.authority), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(vault.data.fractionMint), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(vault.data.fractionTreasury), isSigner: false, isWritable: true },
        { pubkey: TOKEN_VAULT_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: TOKR_PROGRAM,
      data
    }
  );

  const obj: UiInstruction = {
      serializedInstruction: serializeInstructionToBase64(instruction),
      isValid,
      governance: currentAccount?.governance,
      prerequisiteInstructions: prerequisiteInstructions,
  }
  return obj
}



// todo try to find better seed and do not use the wallet either.
export const getMintPda = async function (wallet: PublicKey, seed: String, destination: PublicKey) {
	return await PublicKey.findProgramAddress([Buffer.from(seed), wallet.toBuffer(), destination.toBuffer()], TOKR_PROGRAM)
}

export const getMetadataPda = async function (mint: PublicKey) {
	return (await PublicKey.findProgramAddress([Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()], TOKEN_METADATA_PROGRAM_ID))[0]
}

export const getAtaPda = async function (wallet: PublicKey, mint: PublicKey) {
	return (await PublicKey.findProgramAddress([wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID))[0]
}

function createAssociatedTokenAccountInstruction(
  associatedTokenAddress: PublicKey,
  payer: PublicKey,
  walletAddress: PublicKey,
  splTokenMintAddress: PublicKey,
) {
  const keys = [
      {
          pubkey: payer,
          isSigner: true,
          isWritable: true,
      },
      {
          pubkey: associatedTokenAddress,
          isSigner: false,
          isWritable: true,
      },
      {
          pubkey: walletAddress,
          isSigner: false,
          isWritable: false,
      },
      {
          pubkey: splTokenMintAddress,
          isSigner: false,
          isWritable: false,
      },
      {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
      },
      {
          pubkey: TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
      },
      {
          pubkey: SYSVAR_RENT_PUBKEY,
          isSigner: false,
          isWritable: false,
      },
  ];
  return new TransactionInstruction({
      keys,
      programId: ASSOCIATED_TOKEN_PROGRAM_ID,
      data: Buffer.from([]),
  });
}