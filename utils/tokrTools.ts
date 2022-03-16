/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Keypair, PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { serializeInstructionToBase64 } from '@solana/spl-governance'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID} from '@solana/spl-token'
import { AccountLayout, MintLayout, NATIVE_MINT } from '@solana/spl-token';
import { InitVault, Vault, VaultProgram } from '@metaplex-foundation/mpl-token-vault';
import * as metaplex from '@metaplex/js';
import { WalletAdapter } from '@solana/wallet-adapter-base'
import type { ConnectionContext } from 'utils/connection'
import * as borsh from 'borsh'

import { GovernedTokenAccount } from './tokens'
import { UiInstruction } from './uiTypes/proposalCreationTypes'

const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

const TOKEN_VAULT_PROGRAM_ID = new PublicKey("vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn")

const TOKR_PROGRAM = new PublicKey('9e78qsrsE2e5Q97T1biobry8mSot8NorEDJHJnMa5CpN')

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

    let destinationAccount = new PublicKey(String(form.destinationAddress));

    let mintSeed = (Math.random() + 1).toString(36).substring(2) + (Math.random() + 1).toString(36).substring(2);
    const mintPdaData = await getMintPda(wallet!.publicKey!, mintSeed);
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
    

    const instruction = new TransactionInstruction(
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
    serializedInstruction = serializeInstructionToBase64(instruction)

    const obj: UiInstruction = {
        serializedInstruction,
        isValid,
        governance: currentAccount?.governance,
        prerequisiteInstructions: prerequisiteInstructions,
    }
    return obj
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
  
    console.log("MAX RENT:" + await connection.current.getMinimumBalanceForRentExemption(Vault.MAX_VAULT_SIZE));
  
    const vaultAuthority = await Vault.getPDA(vaultKey);
  
    const externalPricingAccountKey = (await PublicKey.findProgramAddress([Buffer.from("external"), vaultKey.toBuffer(), wallet!.publicKey!.toBuffer()], TOKR_PROGRAM))[0]
  
    const fractionMintkey = (await PublicKey.findProgramAddress([Buffer.from("fraction"), vaultKey.toBuffer(), wallet!.publicKey!.toBuffer()], TOKR_PROGRAM))[0]
  
    const redeemTreasuryKey = (await PublicKey.findProgramAddress([vaultAuthority.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), NATIVE_MINT.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID))[0]
  
    const fractionTreasuryKey = (await PublicKey.findProgramAddress([vaultAuthority.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), fractionMintkey.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID))[0]
  
    // console.log("vaultKey:", vaultKey.toBase58());
    // console.log("vaultAuthority:", vaultAuthority.toBase58());
    // console.log("externalPricingAccountKey:", externalPricingAccountKey.toBase58());
    // console.log("fractionMintkey:", fractionMintkey.toBase58());
    // console.log("redeemTreasuryKey:", redeemTreasuryKey.toBase58());
    // console.log("fractionTreasuryKey:", fractionTreasuryKey.toBase58());
  
  
    const instruction = new TransactionInstruction(
      {
        keys: [
          { pubkey: wallet!.publicKey!, isSigner: true, isWritable: true },
          { pubkey: vaultKey, isSigner: false, isWritable: true },
          { pubkey: vaultAuthority, isSigner: false, isWritable: true },
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


// todo try to find better seed and do not use the wallet either.
export const getMintPda = async function (wallet: PublicKey, seed: String) {
	return await PublicKey.findProgramAddress([Buffer.from(seed), wallet.toBuffer(), TOKR_PROGRAM.toBuffer()], TOKR_PROGRAM)
}

export const getMetadataPda = async function (mint: PublicKey) {
	return (await PublicKey.findProgramAddress([Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()], TOKEN_METADATA_PROGRAM_ID))[0]
}

export const getAtaPda = async function (wallet: PublicKey, mint: PublicKey) {
	return (await PublicKey.findProgramAddress([wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID))[0]
}
