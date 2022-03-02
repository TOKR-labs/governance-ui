/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
    PublicKey,
    SYSVAR_RENT_PUBKEY,
    SystemProgram,
    TransactionInstruction,
  } from '@solana/web3.js';
  import { serializeInstructionToBase64 } from '@solana/spl-governance'
  import { MintLayout, Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
  import { WalletAdapter } from '@solana/wallet-adapter-base'
  import type { ConnectionContext } from 'utils/connection'
  import * as borsh from 'borsh';

  import {
    GovernedTokenAccount,
  } from './tokens'
  import { UiInstruction } from './uiTypes/proposalCreationTypes'

  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const TOKR_PROGRAM = new PublicKey(
      "9e78qsrsE2e5Q97T1biobry8mSot8NorEDJHJnMa5CpN"
  );
  
  export class TokrizeArgs {
    instruction = 0;
    name: string;
    symbol: string;
    uri: string;
    constructor(fields: { name: string, symbol: string, uri: string } | undefined = undefined) {
      if (fields) {
        this.name = fields.name;
        this.symbol = fields.symbol;
        this.uri = fields.uri;
      }
    }
  }
  
  const TokrizeSchema = new Map([
    [TokrizeArgs, {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['name', 'string'],
        ['symbol', 'string'],
        ['uri', 'string']
      ]
    }],
  ]);


  /**
 * Say hello
 * TODO integrate into 
 */
export async function getTokrInstruction({
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
    
    const mint = (await PublicKey.findProgramAddress([wallet!.publicKey!.toBuffer(), Buffer.from("test2", "utf-8")], TOKR_PROGRAM))[0];

    console.log("Payer: {}", wallet!.publicKey!.toBase58());
    console.log("Mint:", mint.toBase58());
    console.log("!!token program {}", TOKEN_PROGRAM_ID.toBase58());

    const data = Buffer.from(borsh.serialize(
        TokrizeSchema,
        new TokrizeArgs({ 
          name: form.name,
          symbol: form.symbol,
          uri: form.metaDataUri
        })
    ));
    

    const instruction = new TransactionInstruction(
    {
        keys: [
            {pubkey: wallet!.publicKey!, isSigner: true, isWritable: true}, 
            {pubkey: mint, isSigner: false, isWritable: true}, 
            {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
            {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
            {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false}
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