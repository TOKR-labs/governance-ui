import Button from '../../components/Button'
import { Transaction } from '@solana/web3.js'
import useWalletStore from 'stores/useWalletStore'
import { sendTransaction } from '@utils/send'
import { ARWEAVE_PAYMENT_WALLET } from './upload/constants'
import * as anchor from '@project-serum/anchor'
import React, { useEffect, useState } from 'react'
import { uploadToArweave, fetchAssetCostToStore, estimateManifestSize } from './upload/arweave'
import FormData from 'form-data'

const ArweaveIndex = () => {
	const wallet = useWalletStore((s) => s.current)
	const connection = useWalletStore((s) => s.connection)
	const [arWeaveFile, setArWeaveFile] = useState<string>()
	const [file, setFile] = useState<any>();

	const upload = async () => {
		// const file = {
		// 	name: 'Gravity',
		// 	symbol: 'TOKR-g1',
		// 	description: 'The Gravity Project in Columbus, Ohio',
		// 	image: 'https://www.arweave.net/n5rGBhJd1SoTHnBXz36zuUWIy0FC3l4OWQhiBhYQhVM?ext=png',
		// 	attributes: [
		// 		{ trait_type: 'address_steet', value: '500 W Broad' },
		// 		{ trait_type: 'address_city', value: 'Columbus' },
		// 		{ trait_type: 'address_state', value: 'OH' },
		// 		{ trait_type: 'address_postal_code', value: '43209' },
		// 		{ trait_type: 'address_country', value: 'US' },
		// 	],
		// 	properties: { creators: [{ address: '331WZS2hBpzKRy5USYQYAddo6iNbN5jUFAkPmPbw7Mqc', share: 100 }], files: [{ uri: 'https://www.arweave.net/n5rGBhJd1SoTHnBXz36zuUWIy0FC3l4OWQhiBhYQhVM?ext=png', type: 'image/png' }] },
		// }
		// // const meta
		// console.log("file", file);
		// const storageCost = await fetchAssetCostToStore([file.size])


		// const metadataFile = new File(file.file, 'metadata.json');
		const storageCost = await fetchAssetCostToStore([file.size + 1000])

		const transaction = new Transaction()
		const instructions = [
			anchor.web3.SystemProgram.transfer({
				fromPubkey: wallet!.publicKey!,
				toPubkey: ARWEAVE_PAYMENT_WALLET,
				lamports: storageCost,
			}),
		]
		transaction.add(...instructions)

		const tx = await sendTransaction({
			connection: connection.current,
			wallet,
			transaction,
			sendingMessage: 'Funding arweave',
			successMessage: 'Success Funding arweave',
		})

		const data = new FormData()
		data.append('transaction', tx)
		data.append('file[]', file)

		console.log('tx', tx);

		const result = await uploadToArweave(data)
		const metadataResultFile = result.messages?.find((m) => m.filename === 'manifest.json')
		console.log('RESULT IS ' + result, JSON.stringify(result), metadataResultFile)
		console.log(result)
		if (metadataResultFile?.transactionId) {
			const link = `https://arweave.net/${metadataResultFile.transactionId}`
			setArWeaveFile(link)
		} else {
			throw new Error(`No transaction ID for upload: ${tx}`)
		}
	}

	useEffect(() => {
		// const inputElement = document.getElementById('input')
		// inputElement.addEventListener('change', handleFiles, false)
		// function handleFiles() {
		// 	const fileList = this.files /* now you can work with the file list */
		// }
	}, [])

	return (
		<div>
			<div className="flex items-center justify-between mb-6 w-full">
				<h1 className="mb-0">AR WEAVE DEMO</h1>
				<input
					id="input"
					type="file"
					onChange={(e) => {
						console.log(e, e.target, e.target.value)
						const files = e.target.files;
						console.log(e.target.files && e.target.files[0])
						setFile(e.target.files && e.target.files[0]);
					}}
				/>
				<Button onClick={upload} title={'Upload'}>
					Upload
				</Button>
				{arWeaveFile && (
					<>
						<a href={arWeaveFile}>arWeaveFile</a>
					</>
				)}
			</div>
		</div>
	)
}

export default ArweaveIndex
