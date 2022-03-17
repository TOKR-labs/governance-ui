import React, { useEffect, useLayoutEffect, useState } from 'react'
// import { toDollars, toPercent } from '@utils/formatters'
import { toDollars, toPercent, Percent, Dollars } from '@utils/formatters'
import { ExternalLinkIcon } from '@heroicons/react/solid'
import Loader from '@components/Loader'
import Button, { SecondaryButton } from '@components/Button'
import { depositNFTReserveLiquidityTransaction } from '../../scripts/lending'
import useWalletStore from '../../stores/useWalletStore'
import { sendTransaction } from '@utils/send'
import { sign } from 'crypto'

const UiBox = (props) => {
	return (
		<>
			<div className="border border-green || space-y-4 p-4 lg:p-8 || flex items-center justify-start flex-col || flex-grow">
				<h2>
					<span className="text-6xl">{props.title || 'rNFT'}</span>
				</h2>
				<div className="text-4xl">{props.isUSD ? <Dollars removeEmptyCents={false}>{props.amount}</Dollars> : props.amount}</div>
				{props.percent && (
					<div className="text-xl">
						<Percent fixedAmount="2">5</Percent>
					</div>
				)}
				{props.address && <div className="text-xl">{props.address}</div>}
			</div>
		</>
	)
}

const Index = () => {
	const wallet = useWalletStore((s) => s.current)
	const connected = useWalletStore((s) => s.connected)
	const connection = useWalletStore((s) => s.connection.current)
	const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true)

	const deposit = async () => {
		const blockhash = await connection.getRecentBlockhash()
		const tx = await depositNFTReserveLiquidityTransaction(blockhash, wallet?.publicKey)
		const signature = await sendTransaction({ tx, wallet, connection })
	}

	useEffect(() => {
		/// after data is loaded, set `setIsInitialLoad(false)`
		setIsInitialLoad(false)
	}, [])

	return isInitialLoad ? (
		<Loader />
	) : (
		<div className="w-full flex items-center justify-center py-16">
			<div className="w-full">
				<div className="-m-4">
					<h1 className="text-center pb-8">
						<span className="text-6xl">Borrow</span>
					</h1>
					<div className="flex flex-wrap flex-col lg:flex-row">
						<div className="flex-grow flex-shrink-0 flex || p-4">
							<UiBox isUSD={true} amount={9000} percent={5} title="wSOL" />
						</div>
						<div className="flex-grow flex-shrink-0 flex || p-4">
							<a href="https://google.com" target="_blank" className="flex flex-grow hover:text-dark hover:bg-green relative">
								<span className="absolute w-4 top-2 right-2">
									<ExternalLinkIcon className="w-full" />
								</span>
								<UiBox amount={500} address={`TBD`} />
							</a>
						</div>
					</div>
				</div>
				<p className="text-center pt-8">Deposit your rNFT and borrow 80% LT.V</p>
				<div className="-m-2 pt-10">
					<div className="flex flex-wrap flex-col lg:flex-row justify-center">
						<div className="flex flex-grow max-w-xs justify-center p-2">
							<Button onClick={deposit} className="flex-grow">
								Deposit
							</Button>
						</div>
						<div className="flex flex-grow  max-w-xs justify-center p-2">
							<Button className="flex-grow">Borrow</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Index
