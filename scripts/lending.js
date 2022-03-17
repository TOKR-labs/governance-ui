import { Transaction, PublicKey, SYSVAR_CLOCK_PUBKEY, TransactionInstruction } from '@solana/web3.js'
// const solanaSplToken = require('@solana/spl-token')

import { AccountInfo, ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'

const { struct, u32, ns64, u8 } = require('@solana/buffer-layout')
const BufferLayout = require('buffer-layout')
const nacl = require('tweetnacl')
const tokenLending = require('@solana/spl-token-lending')

const LENDING_PROGRAM_ID = new PublicKey('Tok7vSkMxwSxeLuTn4L1AucgBmEsjLMtHEijybaW2dq')
const LENDING_MARKET_ID = 'DeR5tUHMNNbBkBNQfhpbjUQFkEEAcZHKjAhfZky5WKG'
const seed = LENDING_MARKET_ID.slice(0, 32)

const wrappedSolMint = new PublicKey('So11111111111111111111111111111111111111112')

const nftAccount = new PublicKey('7udK1kAxf4g7beokRgRepob1vjA4x3WvKEoXmbuskBci')
// // NFT Reserve
const nftReserve = new PublicKey('94KiV4S1G43Rch3Q6V1uKvPznjCoeZJnkhnWThkW35BE')
const nftCollateralMint = new PublicKey('8Ark5uACoFGNzQVE4rrQuUXXNuQBSWpKtmmNRrQZBMF7')
const nftCollateralSupply = new PublicKey('CrjC5ibJtJ3wCQFWV5bUbmJuRvGheYK6P57urbJhyfRe')
const nftLiquiditySupply = new PublicKey('EBj5vQpeBxdrBM31DQy5u2t15XHBsYF8vQorRQTETZbE')
const nftLiquidityFeeReciever = new PublicKey('8B7h3B5BgDBjo1YGTN3XSY8YUGW6genyh1a8LSYvrQWu')
const nftUserTransferAuthority = new PublicKey('Aps7svXcF6Z3XA3WSNYthLHSExet1iHH2AsmnrbgzPA6')
const nftLendingMarketAuthority = new PublicKey('Ho4NCtMvP82sRGYwVVALAQUc4Rkxm8swRDLbjTTU8LWC')
const nftOracle = new PublicKey('dYUUVtUTzqwbQFb9bxCwKt8FkGJb3FrrDm5ACWRZ4ho')

// ONLY has 1 wsol. Hopefully we can borrow a small amount.
//TODO: input vals for this reserve.
// wSol Reserve

const wSolAccount = new PublicKey('rseYkWVT9LSSrjwCHHCTy548GS14LCvaEJuZowVACVv')
const wSolReserve = new PublicKey('4XCbN8BnThuiwU9fzLmZLjWMVWKhDb5Erv8qrLGkyqrQ')
const wSolCollateralMint = new PublicKey('6zV8dsA3EvYHQra9Qxvvy4t5ShC2G2rGwytep9i1mhUX')
const wSolCollateralSupply = new PublicKey('AnbrNvSfbLQWML9RQJSbzAPGp4PqmKa1sNMiXHJe4uiP')
const wSolLiquiditySupply = new PublicKey('FzGu3aGGGPpUJc5jiM7gpvq3w9JUkL16pMPpUTbj7Cr3')
const wSolLiquidityFeeReciever = new PublicKey('6G38wPoBTGVLcXjTL7hNVe1d7oLxLkAgoj1a5awiL1df')
const wSolUserTransferAuthority = new PublicKey('Ho4NCtMvP82sRGYwVVALAQUc4Rkxm8swRDLbjTTU8LWC')
// const wSolLendingMarketAuthority = new solanaWeb3.PublicKey('TBD');
const wSolPythPrice = new PublicKey('J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix')

const initObligation = async () => {
	const obligationAddress = await PublicKey.createWithSeed(user.publicKey, seed, LENDING_PROGRAM_ID)

	console.log(obligationAddress.toString())

	const lendingMarketPublicKey = new PublicKey(LENDING_MARKET_ID)

	// Alternatively, manually construct the transaction
	let recentBlockhash = await connection.getLatestBlockhash()
	let manualTransaction = new Transaction({
		recentBlockhash: recentBlockhash.blockhash,
		feePayer: user.publicKey,
	})

	const obligationAccountInfoRentExempt = await connection.getMinimumBalanceForRentExemption(tokenLending.OBLIGATION_SIZE)

	manualTransaction.add(
		solanaWeb3.SystemProgram.createAccountWithSeed({
			fromPubkey: user.publicKey,
			newAccountPubkey: obligationAddress,
			basePubkey: user.publicKey,
			seed: seed,
			lamports: obligationAccountInfoRentExempt,
			space: tokenLending.OBLIGATION_SIZE,
			programId: LENDING_PROGRAM_ID,
		})
	)

	const customInstruction = getObligationInstructtions(obligationAddress, lendingMarketPublicKey, user.publicKey)

	manualTransaction.add(customInstruction)

	console.log(`txhash: ${await solanaWeb3.sendAndConfirmTransaction(connection, manualTransaction, [user])}`)
}

const createNFTCollateralATA = async () => {
	// Sol deposit solend:  https://solscan.io/tx/5YVqDNA3mX2rYvk3mgy3Q8yvxL9puAd5fgBqwB5G1zwKAhghALepSs4Axp3NpQvzisP4s5GRQ49Prg6WcWrSYtmM

	const userCollateralAccountAddress = await solanaSplToken.getAssociatedTokenAddress(nftCollateralMint, user.publicKey, true, solanaSplToken.TOKEN_PROGRAM_ID, solanaSplToken.ASSOCIATED_TOKEN_PROGRAM_ID)

	console.log(userCollateralAccountAddress.toString())

	const createUserCollateralAccountIx = solanaSplToken.createAssociatedTokenAccountInstruction(user.publicKey, userCollateralAccountAddress, user.publicKey, nftCollateralMint, solanaSplToken.TOKEN_PROGRAM_ID, solanaSplToken.ASSOCIATED_TOKEN_PROGRAM_ID)

	const tx = new solanaWeb3.Transaction().add(createUserCollateralAccountIx)

	const result = await solanaWeb3.sendAndConfirmTransaction(connection, tx, [user])
	console.log(result)

	// worked transaction: https://solscan.io/tx/5VwKjbrKoBv51JnPZ6Za5bwP8zdnYcb24NFex7gx1Eb5qeuAVQuMQTFvK32FHYApqatZhHdZVx7oUjpinopJ2MWM?cluster=devnet
}

export const createNFTCollateralATATransaction = async (userPublicKey) => {
	// Sol deposit solend:  https://solscan.io/tx/5YVqDNA3mX2rYvk3mgy3Q8yvxL9puAd5fgBqwB5G1zwKAhghALepSs4Axp3NpQvzisP4s5GRQ49Prg6WcWrSYtmM

	const userCollateralAccountAddress = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, nftCollateralMint, userPublicKey)

	const createUserCollateralAccountIx = Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, nftCollateralMint, userCollateralAccountAddress, userPublicKey, userPublicKey)

	const tx = new Transaction().add(createUserCollateralAccountIx)

	return tx

	// worked transaction: https://solscan.io/tx/5VwKjbrKoBv51JnPZ6Za5bwP8zdnYcb24NFex7gx1Eb5qeuAVQuMQTFvK32FHYApqatZhHdZVx7oUjpinopJ2MWM?cluster=devnet
}

const createWSolCollateralATA = async () => {
	// Sol deposit solend:  https://solscan.io/tx/5YVqDNA3mX2rYvk3mgy3Q8yvxL9puAd5fgBqwB5G1zwKAhghALepSs4Axp3NpQvzisP4s5GRQ49Prg6WcWrSYtmM

	const userCollateralAccountAddress = await solanaSplToken.getAssociatedTokenAddress(wSolCollateralMint, user.publicKey, true, solanaSplToken.TOKEN_PROGRAM_ID, solanaSplToken.ASSOCIATED_TOKEN_PROGRAM_ID)

	console.log(userCollateralAccountAddress.toString())

	const createUserCollateralAccountIx = solanaSplToken.createAssociatedTokenAccountInstruction(user.publicKey, userCollateralAccountAddress, user.publicKey, wSolCollateralMint, solanaSplToken.TOKEN_PROGRAM_ID, solanaSplToken.ASSOCIATED_TOKEN_PROGRAM_ID)

	const tx = new solanaWeb3.Transaction().add(createUserCollateralAccountIx)

	const result = await solanaWeb3.sendAndConfirmTransaction(connection, tx, [user])
	console.log(result)

	// worked transaction: https://solscan.io/tx/5VwKjbrKoBv51JnPZ6Za5bwP8zdnYcb24NFex7gx1Eb5qeuAVQuMQTFvK32FHYApqatZhHdZVx7oUjpinopJ2MWM?cluster=devnet
}

export const createWSolCollateralATATransaction = async (userPublicKey) => {
	// Sol deposit solend:  https://solscan.io/tx/5YVqDNA3mX2rYvk3mgy3Q8yvxL9puAd5fgBqwB5G1zwKAhghALepSs4Axp3NpQvzisP4s5GRQ49Prg6WcWrSYtmM

	const userCollateralAccountAddress = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, wSolC, userPublicKey)

	const createUserCollateralAccountIx = Token.createAssociatedTokenAccountInstruction(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, nftCollateralMint, userCollateralAccountAddress, userPublicKey, userPublicKey)

	const tx = new Transaction().add(createUserCollateralAccountIx)

	return tx

	// worked transaction: https://solscan.io/tx/5VwKjbrKoBv51JnPZ6Za5bwP8zdnYcb24NFex7gx1Eb5qeuAVQuMQTFvK32FHYApqatZhHdZVx7oUjpinopJ2MWM?cluster=devnet
}

const depositNFTReserveLiquidity = async () => {
	let tokenAmount = await connection.getTokenAccountBalance(nftAccount)

	console.log(tokenAmount)

	const userNFTCollateralAccountAddress = await solanaSplToken.getAssociatedTokenAddress(nftCollateralMint, user.publicKey, true, solanaSplToken.TOKEN_PROGRAM_ID, solanaSplToken.ASSOCIATED_TOKEN_PROGRAM_ID)

	const throughLib = tokenLending.depositReserveLiquidityInstruction(1, nftAccount, userNFTCollateralAccountAddress, nftReserve, nftLiquiditySupply, nftCollateralMint, new solanaWeb3.PublicKey(LENDING_MARKET_ID), nftLendingMarketAuthority, user.publicKey)

	throughLib.programId = LENDING_PROGRAM_ID

	// Alternatively, manually construct the transaction
	let recentBlockhash = await connection.getLatestBlockhash()
	let tx = new solanaWeb3.Transaction({
		recentBlockhash: recentBlockhash.blockhash,
		feePayer: user.publicKey,
	})
	const refreshReserve = getRefreshReserveInstruction(nftReserve, nftOracle)
	console.log(refreshReserve)
	tx.add(refreshReserve)
	tx.add(throughLib)

	const result = await solanaWeb3.sendAndConfirmTransaction(connection, tx, [user])
	console.log(result)
}

export const depositNFTReserveLiquidityTransaction = async (recentBlockhash, userPublicKey) => {
	// const userNFTCollateralAccountAddress = await Token.getAssociatedTokenAddress(nftCollateralMint, userPublicKey, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
	const userNFTCollateralAccountAddress = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, nftCollateralMint, userPublicKey)

	const throughLib = tokenLending.depositReserveLiquidityInstruction(1, nftAccount, userNFTCollateralAccountAddress, nftReserve, nftLiquiditySupply, nftCollateralMint, new PublicKey(LENDING_MARKET_ID), nftLendingMarketAuthority, userPublicKey)

	throughLib.programId = LENDING_PROGRAM_ID
	// Alternatively, manually construct the transaction

	let tx = new Transaction({
		recentBlockhash: recentBlockhash,
		feePayer: userPublicKey,
	})

	const refreshReserve = getRefreshReserveInstruction(nftReserve, nftOracle)
	tx.add(refreshReserve)
	tx.add(throughLib)

	return tx
}

// Would this deposit be for the nft reserve or  wrapped sol?
const depositNFTCollateral = async () => {
	const obligationAddress = await solanaWeb3.PublicKey.createWithSeed(user.publicKey, seed, LENDING_PROGRAM_ID)

	const userNFTCollateralAccountAddress = await solanaSplToken.getAssociatedTokenAddress(nftCollateralMint, user.publicKey, true, solanaSplToken.TOKEN_PROGRAM_ID, solanaSplToken.ASSOCIATED_TOKEN_PROGRAM_ID)

	const approveTransaction = solanaSplToken.createApproveInstruction(userNFTCollateralAccountAddress, nftUserTransferAuthority, user.publicKey, 1)

	const depositInstructionThroughLibBuffer = tokenLending.depositObligationCollateralInstruction(1, userNFTCollateralAccountAddress, nftCollateralSupply, nftReserve, obligationAddress, new solanaWeb3.PublicKey(LENDING_MARKET_ID), nftLendingMarketAuthority, user.publicKey, user.publicKey)

	const depositInstructions = getCollateralInstructions(1, userNFTCollateralAccountAddress, nftCollateralSupply, nftReserve, obligationAddress, new solanaWeb3.PublicKey(LENDING_MARKET_ID), user.publicKey, user.publicKey)

	// data formatting below is not right, but this one is :/
	depositInstructions.data = depositInstructionThroughLibBuffer.data

	let recentBlockhash = await connection.getLatestBlockhash()
	let tx = new solanaWeb3.Transaction({
		recentBlockhash: recentBlockhash.blockhash,
		feePayer: user.publicKey,
	})

	const refreshReserve = getRefreshReserveInstruction(nftReserve, nftOracle)

	tx.add(refreshReserve)
	tx.add(approveTransaction)
	tx.add(depositInstructions)

	const result = await solanaWeb3.sendAndConfirmTransaction(connection, tx, [user])
	console.log(result)
}

const refreshNFTReserve = async () => {
	const instruction = getRefreshReserveInstruction(reserve, pythPrice)

	// console.log(depositInstruction);

	let recentBlockhash = await connection.getLatestBlockhash()
	let tx = new solanaWeb3.Transaction({
		recentBlockhash: recentBlockhash.blockhash,
		feePayer: user.publicKey,
	})

	tx.add(instruction)

	const result = await solanaWeb3.sendAndConfirmTransaction(connection, tx, [user])
	console.log(result)
}

const borrowWSol = async () => {
	const obligationAddress = await solanaWeb3.PublicKey.createWithSeed(user.publicKey, seed, LENDING_PROGRAM_ID)

	// THIS ACCOUNT MUST BE CREATED. IF IT DOES NOT OFFICIALLY EXIST IT WILL FAIL
	const userDepositLiquidityAccount = await solanaSplToken.getAssociatedTokenAddress(wrappedSolMint, user.publicKey, true, solanaSplToken.TOKEN_PROGRAM_ID, solanaSplToken.ASSOCIATED_TOKEN_PROGRAM_ID)

	console.log('userDepositLiquidityAccount ' + userDepositLiquidityAccount.toString())

	const refreshWSolReserve = getRefreshReserveInstruction(wSolReserve, wSolPythPrice)
	const refreshNFTReserve = getRefreshReserveInstruction(nftReserve, nftPythPrice)

	const obligationAccountInfo = await connection.getAccountInfo(obligationAddress)
	let obligationDetails = null
	const depositReserves = []
	const borrowReserves = []

	if (obligationAccountInfo) {
		obligationDetails = tokenLending.parseObligation(user.publicKey, obligationAccountInfo)
		obligationDetails.data.deposits.forEach((deposit) => {
			depositReserves.push(deposit.depositReserve)
		})
		obligationDetails.data.borrows.forEach((borrow) => {
			borrowReserves.push(borrow.borrowReserve)
		})
	}

	const obligationRefreshInstruction = createRefreshObligationInstruction(obligationAddress, depositReserves, borrowReserves)

	const borrowLiquidityThroughLibBuffer = tokenLending.borrowObligationLiquidityInstruction(0.2 * solanaWeb3.LAMPORTS_PER_SOL, wSolLiquiditySupply, userDepositLiquidityAccount, wSolReserve, wSolLiquidityFeeReciever, obligationAddress, new solanaWeb3.PublicKey(LENDING_MARKET_ID), wSolLendingMarketAuthority, user.publicKey)

	const borrowLiquidityInstruction = createBorrowLiquidityInstructions(0.2 * solanaWeb3.LAMPORTS_PER_SOL, wSolLiquiditySupply, userDepositLiquidityAccount, wSolReserve, wSolLiquidityFeeReciever, obligationAddress, new solanaWeb3.PublicKey(LENDING_MARKET_ID), wSolLendingMarketAuthority, user.publicKey)

	borrowLiquidityInstruction.data = borrowLiquidityThroughLibBuffer.data

	let recentBlockhash = await connection.getLatestBlockhash()
	let tx = new solanaWeb3.Transaction({
		recentBlockhash: recentBlockhash.blockhash,
		feePayer: user.publicKey,
	})

	tx.add(refreshNFTReserve)
	tx.add(refreshWSolReserve)
	tx.add(obligationRefreshInstruction)
	tx.add(borrowLiquidityInstruction)

	// console.log(tx);

	const result = await solanaWeb3.sendAndConfirmTransaction(connection, tx, [user])
	console.log(result)
}

const depositWSolReserveLiquidity = async () => {
	let tokenAmount = await connection.getTokenAccountBalance(wSolAccount)

	console.log(tokenAmount)

	const userWSolCollateralAccountAddress = await solanaSplToken.getAssociatedTokenAddress(wSolCollateralMint, user.publicKey, true, solanaSplToken.TOKEN_PROGRAM_ID, solanaSplToken.ASSOCIATED_TOKEN_PROGRAM_ID)

	const throughLib = tokenLending.depositReserveLiquidityInstruction(1, wSolAccount, userWSolCollateralAccountAddress, wSolReserve, wSolLiquiditySupply, wSolCollateralMint, new solanaWeb3.PublicKey(LENDING_MARKET_ID), wSolLendingMarketAuthority, user.publicKey)

	throughLib.programId = LENDING_PROGRAM_ID

	// const depositInstructions = depositReserveLiquidityInstruction(
	//     1,
	//     wSolAccount,
	//     userWSolCollateralAccountAddress,
	//     wSolReserve,
	//     wSolLiquiditySupply,
	//     wSolCollateralMint,
	//     new solanaWeb3.PublicKey(LENDING_MARKET_ID),
	//     wSolLendingMarketAuthority,
	//     user.publicKey
	// );
	// console.log(depositInstructions);
	// console.log(throughLib);

	// Alternatively, manually construct the transaction
	let recentBlockhash = await connection.getLatestBlockhash()
	let tx = new solanaWeb3.Transaction({
		recentBlockhash: recentBlockhash.blockhash,
		feePayer: user.publicKey,
	})
	const refreshReserve = getRefreshReserveInstruction(wSolReserve, wSolPythPrice)

	tx.add(refreshReserve)
	tx.add(throughLib)

	const result = await solanaWeb3.sendAndConfirmTransaction(connection, tx, [user])
	console.log(result)
}

// 10
/// Borrow liquidity from a reserve by depositing collateral tokens. Requires a refreshed
/// obligation and reserve.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Source borrow reserve liquidity supply SPL Token account.
///   1. `[writable]` Destination liquidity token account.
///                     Minted by borrow reserve liquidity mint.
///   2. `[writable]` Borrow reserve account - refreshed.
///   3. `[writable]` Borrow reserve liquidity fee receiver account.
///                     Must be the fee account specified at InitReserve.
///   4. `[writable]` Obligation account - refreshed.
///   5. `[]` Lending market account.
///   6. `[]` Derived lending market authority.
///   7. `[signer]` Obligation owner.
///   8. `[]` Clock sysvar.
///   9. `[]` Token program id.
///   10 `[optional, writable]` Host fee receiver account.
// BorrowObligationLiquidity {
/// Amount of liquidity to borrow - u64::MAX for 100% of borrowing power
// liquidity_amount: u64,
// @TODO: slippage constraint - https://git.io/JmV67
// },
const createBorrowLiquidityInstructions = (liquidityAmount, sourceLiquidity, destinationLiquidity, borrowReserve, borrowReserveLiquidityFeeReceiver, obligation, lendingMarket, lendingMarketAuthority, obligationOwner) => {
	let params = { liquidityAmount: liquidityAmount }

	let allocateStruct = {
		index: 10,
		layout: struct([u32('instruction'), ns64('liquidityAmount')]),
	}

	let data = Buffer.alloc(allocateStruct.layout.span)
	let layoutFields = Object.assign({ instruction: allocateStruct.index }, params)
	allocateStruct.layout.encode(layoutFields, data)

	const keys = [
		{ pubkey: sourceLiquidity, isSigner: false, isWritable: true },
		{ pubkey: destinationLiquidity, isSigner: false, isWritable: true },
		{ pubkey: borrowReserve, isSigner: false, isWritable: true },
		{
			pubkey: borrowReserveLiquidityFeeReceiver,
			isSigner: false,
			isWritable: true,
		},
		{ pubkey: obligation, isSigner: false, isWritable: true },
		{ pubkey: lendingMarket, isSigner: false, isWritable: false },
		{ pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
		{ pubkey: obligationOwner, isSigner: true, isWritable: false },
		{ pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
		{ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
	]

	// if (hostFeeReceiver) {
	//     keys.push({ pubkey: hostFeeReceiver, isSigner: false, isWritable: true });
	// }

	return new solanaWeb3.TransactionInstruction({
		keys,
		programId: LENDING_PROGRAM_ID,
		data,
	})
}

// 7
/// Refresh an obligation's accrued interest and collateral and liquidity prices. Requires
/// refreshed reserves, as all obligation collateral deposit reserves in order, followed by all
/// liquidity borrow reserves in order.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Obligation account.
///   1. `[]` Clock sysvar.
///   .. `[]` Collateral deposit reserve accounts - refreshed, all, in order.
///   .. `[]` Liquidity borrow reserve accounts - refreshed, all, in order.
const createRefreshObligationInstruction = (obligation, depositReserves, borrowReserves) => {
	const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')])
	const data = Buffer.alloc(dataLayout.span)
	dataLayout.encode(
		{
			instruction: 7,
		},
		data
	)
	const keys = [
		{ pubkey: obligation, isSigner: false, isWritable: true },
		{ pubkey: solanaWeb3.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
	]
	depositReserves.forEach((depositReserve) =>
		keys.push({
			pubkey: depositReserve,
			isSigner: false,
			isWritable: false,
		})
	)
	borrowReserves.forEach((borrowReserve) =>
		keys.push({
			pubkey: borrowReserve,
			isSigner: false,
			isWritable: false,
		})
	)
	return new solanaWeb3.TransactionInstruction({
		keys,
		programId: LENDING_PROGRAM_ID,
		data,
	})
}

// 4
/// Deposit liquidity into a reserve in exchange for collateral. Collateral represents a share
/// of the reserve liquidity pool.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Source liquidity token account.
///                     $authority can transfer $liquidity_amount.
///   1. `[writable]` Destination collateral token account.
///   2. `[writable]` Reserve account.
///   3. `[writable]` Reserve liquidity supply SPL Token account.
///   4. `[writable]` Reserve collateral SPL Token mint.
///   5. `[]` Lending market account.
///   6. `[]` Derived lending market authority.
///   7. `[signer]` User transfer authority ($authority).
///   8. `[]` Clock sysvar.
///   9. `[]` Token program id.
const depositReserveLiquidityInstructionDONOTUSE = (liquidityAmount, sourceLiquidity, destinationCollateral, reserve, reserveLiquiditySupply, reserveCollateralMint, lendingMarket, lendingMarketAuthority, transferAuthority) => {
	let params = { liquidityAmount: liquidityAmount }

	let allocateStruct = {
		index: 4,
		layout: struct([u32('instruction'), ns64('liquidityAmount')]),
	}

	let data = Buffer.alloc(allocateStruct.layout.span)
	let layoutFields = Object.assign({ instruction: allocateStruct.index }, params)
	allocateStruct.layout.encode(layoutFields, data)

	const keys = [
		{ pubkey: sourceLiquidity, isSigner: false, isWritable: true },
		{ pubkey: destinationCollateral, isSigner: false, isWritable: true },
		{ pubkey: reserve, isSigner: false, isWritable: true },
		{ pubkey: reserveLiquiditySupply, isSigner: false, isWritable: true },
		{ pubkey: reserveCollateralMint, isSigner: false, isWritable: true },
		{ pubkey: lendingMarket, isSigner: false, isWritable: false },
		{ pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
		{ pubkey: transferAuthority, isSigner: true, isWritable: false },
		{ pubkey: solanaWeb3.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
		{ pubkey: solanaSplToken.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
	]

	return new solanaWeb3.TransactionInstruction({
		keys,
		programId: LENDING_PROGRAM_ID,
		data,
	})
}

// 3
/// Accrue interest and update market price of liquidity on a reserve.
///
/// Accounts expected by this instruction:
///
///   0. `[writable]` Reserve account.
///   1. `[]` Reserve liquidity oracle account.
///             Must be the Pyth price account specified at InitReserve.
///   2. `[]` Clock sysvar.
const getRefreshReserveInstruction = (reserve, reserveLiquidityOracleAccount) => {
	const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')])

	const data = Buffer.alloc(dataLayout.span)
	dataLayout.encode(
		{
			instruction: 3,
		},
		data
	)

	const keys = [
		{ pubkey: reserve, isSigner: false, isWritable: true },
		{ pubkey: reserveLiquidityOracleAccount, isSigner: false, isWritable: false },
		{ pubkey: new PublicKey(LENDING_MARKET_ID), isSigner: false, isWritable: false },
		{ pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
	]

	return new TransactionInstruction({
		keys,
		programId: LENDING_PROGRAM_ID,
		data,
	})
}

const getCollateralInstructions = (collateralAmount, sourceCollateral, destinationCollateral, depositReserve, obligation, lendingMarket, obligationOwner, transferAuthority) => {
	let params = { collateralAmount: collateralAmount }

	let allocateStruct = {
		index: 8,
		layout: struct([u32('instruction'), ns64('collateralAmount')]),
	}

	let data = Buffer.alloc(allocateStruct.layout.span)
	let layoutFields = Object.assign({ instruction: allocateStruct.index }, params)
	allocateStruct.layout.encode(layoutFields, data)

	console.log(destinationCollateral.toString())

	const keys = [
		{ pubkey: sourceCollateral, isSigner: false, isWritable: true },
		{ pubkey: destinationCollateral, isSigner: false, isWritable: true },
		{ pubkey: depositReserve, isSigner: false, isWritable: false },
		{ pubkey: obligation, isSigner: false, isWritable: true },
		{ pubkey: lendingMarket, isSigner: false, isWritable: false },
		{ pubkey: obligationOwner, isSigner: true, isWritable: false },
		{ pubkey: transferAuthority, isSigner: true, isWritable: false },
		{ pubkey: solanaWeb3.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
		{ pubkey: solanaSplToken.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
	]

	return new solanaWeb3.TransactionInstruction({
		keys,
		programId: LENDING_PROGRAM_ID,
		data,
	})
}

const getObligationInstructtions = (obligation, lendingMarket, obligationOwner) => {
	const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')])

	const data = Buffer.alloc(dataLayout.span)
	dataLayout.encode(
		{
			instruction: 6,
		},
		data
	)

	const keys = [
		{ pubkey: obligation, isSigner: false, isWritable: true },
		{ pubkey: lendingMarket, isSigner: false, isWritable: false },
		{ pubkey: obligationOwner, isSigner: true, isWritable: false },
		{ pubkey: solanaWeb3.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
		{ pubkey: solanaWeb3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
		{ pubkey: solanaSplToken.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
	]
	return new solanaWeb3.TransactionInstruction({
		keys,
		programId: LENDING_PROGRAM_ID,
		data,
	})
}

const transferNft = async () => {
	const newAccount = new solanaWeb3.PublicKey('GR3tT6HTjUxekqSWn4HdLSLFxkaEnR7SwTsGcTJ9szAL')

	let recentBlockhash = await connection.getLatestBlockhash()
	let tx = new solanaWeb3.Transaction({
		recentBlockhash: recentBlockhash.blockhash,
		feePayer: user.publicKey,
	})

	const instruction = solanaSplToken.transfer(connection, user, nftAccount, newAccount, user.publicKey, 1, [])

	console.log(instruction)
}

// initObligation()
// createCollateralATA();
// transferNft();
// depositReserveLiquidity();
// depositNFTReserveLiquidity();
// createWSolCollateralATA();
// depositWSolReserveLiquidity();
// depositNFTCollateral();
// borrowWSol();

// Transfering "1" wsol, amount is 16777216
// https://explorer.solana.com/tx/4gCvB6hhR4NQAHdbDVhQoPf9trFHG6h2rcbGj73p8PD4r1NBn8qYKWQP7vMrabDhKXRbM199cNazam6EubukUebq?cluster=devnet

// https://explorer.solana.com/tx/5kf7tza4HQgVvHsUBv6DGYQj5JNtgp14jGA9PEghHiqkAkbcVQPzMP6Ac2pnmQbZEBHdBAhHPmCoAJdL2iDXxTMS?cluster=devnet

// wSol transfer after uing lib:
// https://explorer.solana.com/tx/4jmVefduUvSzfPXPu9oUvmpgKeC1QqC1zD4EGE5bbTV8vqfLXSXy3D7jsUoW8YvN3t3JWnBZGxju7B32EwNttPjd?cluster=devnet

// Not just any nft could be deposited into reserve as the mint on the reserve would fail on transfer

// const createReservePDA = async () => {
//     const reservePDA = await solanaWeb3.PublicKey.createWithSeed(user.publicKey, seed, nftReserve);

//     console.log(reservePDA.toString());

//     // const tx = new solanaWeb3.Transaction().add(
//     //     solanaWeb3.SystemProgram.createAccountWithSeed({
//     //         fromPubkey: user.publicKey, // funder
//     //         newAccountPubkey: reservePDA,
//     //         basePubkey: user.publicKey,
//     //         seed: seed,
//     //         lamports: 9938880, // 0.1 SOL
//     //         programId: nftReserve,
//     //         space: 1300,
//     //     })
//     // );

//     // console.log(tx);

//     // const result = await solanaWeb3.sendAndConfirmTransaction(connection, tx, [user]);
//     // // confirmed result means the obligation account is
//     // console.log(result);
// };

// const getBalance = async () => {
//     const fungibleReserve = new solanaWeb3.PublicKey('6ifquCHP8oK9dPVDoMeUBdNhPdt6oJHC5iTTJqK7caYi');
//     let tokenAmount = await connection.getTokenAccountBalance(fungibleReserve);
//     console.log(tokenAmount);
//     // const tx = new solanaWeb3.Transaction().add(
//     //     solanaWeb3.SystemProgram.createAccountWithSeed({
//     //         fromPubkey: user.publicKey, // funder
//     //         newAccountPubkey: reservePDA,
//     //         basePubkey: user.publicKey,
//     //         seed: seed,
//     //         lamports: 9938880, // 0.1 SOL
//     //         programId: nftReserve,
//     //         space: 1300,
//     //     })
//     // );

//     // console.log(tx);

//     // const result = await solanaWeb3.sendAndConfirmTransaction(connection, tx, [user]);
//     // // confirmed result means the obligation account is
//     // console.log(result);
// };

// getBalance();
