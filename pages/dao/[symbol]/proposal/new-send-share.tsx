import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { createContext, useEffect, useState } from 'react'
import * as yup from 'yup'
import { getInstructionDataFromBase64, Governance, ProgramAccount, RpcContext } from '@solana/spl-governance'
import { PublicKey } from '@solana/web3.js'
import Button, { SecondaryButton } from '@components/Button'
import Input from '@components/inputs/Input'
import Textarea from '@components/inputs/Textarea'
import TokenBalanceCardWrapper from '@components/TokenBalance/TokenBalanceCardWrapper'
import useGovernanceAssets from '@hooks/useGovernanceAssets'
import useQueryContext from '@hooks/useQueryContext'
import useRealm from '@hooks/useRealm'
import { getProgramVersionForRealm } from '@models/registry/api'

import { getTimestampFromDays } from '@tools/sdk/units'
import { formValidation, isFormValid } from '@utils/formValidation'
import { ComponentInstructionData, InstructionsContext, UiInstruction } from '@utils/uiTypes/proposalCreationTypes'

import { createProposal } from 'actions/createProposal'
import useWalletStore from 'stores/useWalletStore'
import { notify } from 'utils/notifications'
import useVoteStakeRegistryClientStore from 'VoteStakeRegistry/stores/voteStakeRegistryClientStore'

import VoteBySwitch from './components/VoteBySwitch'
import { useLayoutEffect } from 'react'
import EscrowVaultContract from './components/instructions/EscrowVault'
import AddTokenToVaultContract from './components/instructions/AddTokenToVault'
import FractionalizeContract from './components/instructions/Fractionalize'
import SendSharesContract from './components/instructions/SendShares'

const schema = yup.object().shape({
	title: yup.string().required('Title is required'),
})
const defaultGovernanceCtx: InstructionsContext = {
	instructionsData: [],
	handleSetInstructions: () => null,
	governance: null,
	setGovernance: () => null,
	property: null,
	setProperty: () => null,
}
export const NewProposalContext = createContext<InstructionsContext>(defaultGovernanceCtx)

// Takes the first encountered governance account
function extractGovernanceAccountFromInstructionsData(instructionsData: ComponentInstructionData[]): ProgramAccount<Governance> | null {
	return instructionsData.find((itx) => itx.governedAccount)?.governedAccount ?? null
}

const New = (props) => {
	const router = useRouter()
	const client = useVoteStakeRegistryClientStore((s) => s.state.client)
	const { fmtUrlWithCluster } = useQueryContext()
	const { symbol, realm, realmInfo, realmDisplayName, ownVoterWeight, mint, councilMint, canChooseWhoVote } = useRealm()

	const { getAvailableInstructions } = useGovernanceAssets()
	const availableInstructions = getAvailableInstructions()
	const wallet = useWalletStore((s) => s.current)
	const connection = useWalletStore((s) => s.connection)
	const { fetchRealmGovernance, fetchTokenAccountsForSelectedRealmGovernances } = useWalletStore((s) => s.actions)
	const [voteByCouncil, setVoteByCouncil] = useState(false)

	const [form, setForm] = useState({
		title: '',
		description: '',
	})
	const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
	const [formErrors, setFormErrors] = useState({})
	const [governance, setGovernance] = useState<ProgramAccount<Governance> | null>(null)
	const [isLoadingSignedProposal, setIsLoadingSignedProposal] = useState(false)
	const [isLoadingDraft, setIsLoadingDraft] = useState(false)
	const isLoading = isLoadingSignedProposal || isLoadingDraft || isLoadingData

	const [instructionsData, setInstructions] = useState<ComponentInstructionData[]>([{ type: availableInstructions[0] }])
	const handleSetInstructions = (val: any, index) => {
		const newInstructions = [...instructionsData]
		newInstructions[index] = { ...instructionsData[index], ...val }
		setInstructions(newInstructions)
	}
	const handleSetForm = ({ propertyName, value }) => {
		console.log(propertyName, value)
		setFormErrors({})
		setForm({ ...form, [propertyName]: value })
	}

	const handleGetInstructions = async () => {
		const instructions: UiInstruction[] = []
		for (const inst of instructionsData) {
			if (inst.getInstruction) {
				const instruction: UiInstruction = await inst?.getInstruction()
				instructions.push(instruction)
			}
		}
		return instructions
	}
	const handleTurnOffLoaders = () => {
		setIsLoadingSignedProposal(false)
		setIsLoadingDraft(false)
	}
	const handleCreate = async (isDraft) => {
		setFormErrors({})
		if (isDraft) {
			setIsLoadingDraft(true)
		} else {
			setIsLoadingSignedProposal(true)
		}


		const { isValid, validationErrors }: formValidation = await isFormValid(schema, form)
		const instructions: UiInstruction[] = await handleGetInstructions()
		let proposalAddress: PublicKey | null = null
		if (!realm) {
			handleTurnOffLoaders()
			throw 'No realm selected'
		}

		if (isValid && instructions.every((x: UiInstruction) => x.isValid)) {
			let selectedGovernance = governance
			if (!governance) {
				handleTurnOffLoaders()
				throw Error('No governance selected')
			}

			const rpcContext = new RpcContext(new PublicKey(realm.owner.toString()), getProgramVersionForRealm(realmInfo!), wallet!, connection.current, connection.endpoint)
			const instructionsData = instructions.map((x) => {
				return {
					data: x.serializedInstruction ? getInstructionDataFromBase64(x.serializedInstruction) : null,
					holdUpTime: x.customHoldUpTime ? getTimestampFromDays(x.customHoldUpTime) : selectedGovernance?.account?.config.minInstructionHoldUpTime,
					prerequisiteInstructions: x.prerequisiteInstructions || [],
					chunkSplitByDefault: x.chunkSplitByDefault || false,
				}
			})

			try {
				// Fetch governance to get up to date proposalCount
				selectedGovernance = (await fetchRealmGovernance(governance.pubkey)) as ProgramAccount<Governance>

				const ownTokenRecord = ownVoterWeight.getTokenRecordToCreateProposal(governance.account.config)
				const defaultProposalMint = !mint?.supply.isZero() ? realm.account.communityMint : !councilMint?.supply.isZero() ? realm.account.config.councilMint : undefined

				const proposalMint = canChooseWhoVote && voteByCouncil ? realm.account.config.councilMint : defaultProposalMint

				if (!proposalMint) {
					throw new Error('There is no suitable governing token for the proposal')
				}

				proposalAddress = await createProposal(rpcContext, realm, selectedGovernance.pubkey, ownTokenRecord.pubkey, form!.title!, form!.description!, proposalMint, selectedGovernance?.account?.proposalCount, instructionsData, isDraft, client)

				const url = fmtUrlWithCluster(`/dao/${symbol}/proposal/${proposalAddress}`)

				router.push(url)
			} catch (ex) {
				notify({ type: 'error', message: `${ex}` })
			}
		} else {
			setFormErrors(validationErrors)
		}
		handleTurnOffLoaders()
	}
	useEffect(() => {
		setInstructions([instructionsData[0]])
	}, [instructionsData[0].governedAccount?.pubkey])

	useEffect(() => {
		const governedAccount = extractGovernanceAccountFromInstructionsData(instructionsData)
		setGovernance(governedAccount)
	}, [instructionsData])

	useEffect(() => {
		//fetch to be up to date with amounts
		fetchTokenAccountsForSelectedRealmGovernances()
	}, [])


	return (
		<div>
			<Link href={fmtUrlWithCluster(`/dao/${symbol}/`)}>
				<a className="flex items-center text-fgd-3 text-sm transition-all hover:text-fgd-1">&lt; Back</a>
			</Link>
			<div className="mt-8 ml-4 -mb-5 relative z-10 m-width-full">
				<h1 className="bg-dark inline-block">
					<span className="ml-4 pr-8 text-xl uppercase">
						Proposal to Distribute Fractional Share 
						{realmDisplayName ? ` for ${realmDisplayName}` : ``}{' '}
					</span>
				</h1>
			</div>
			<div className="grid grid-cols-12 gap-4">
				<div className={`border border-fgd-1 bg-bkg-2 col-span-12 md:col-span-7 md:order-first lg:col-span-8 order-last p-4 md:p-6 space-y-3 ${isLoading ? 'pointer-events-none' : ''}`}>
					<>
						<div className="pt-8 mb-20">
							<div className="space-y-16">
								<div className="space-y-4">


									<Input
										label="Title"
										placeholder="Title"
										value={form.title}
										id="name"
										name="name"
										type="text"
										error={formErrors['title']}
										onChange={(evt) => {
											handleSetForm({
												value: evt.target.value,
												propertyName: 'title',
											})
										}}
									/>
								</div>
							</div>
						</div>

						<div className="pt-2">
							{canChooseWhoVote && (
								<VoteBySwitch
									checked={voteByCouncil}
									onChange={() => {
										setVoteByCouncil(!voteByCouncil)
									}}
								></VoteBySwitch>
							)}
							<NewProposalContext.Provider
								value={{
									instructionsData,
									handleSetInstructions,
									governance,
									setGovernance,
								}}
							>
								<>
									<h3 className="pt-8 hidden">
										<span className="text-lg">rNFT Information</span>
									</h3>
									<SendSharesContract index={0} propertyDetails={null} lookupUri={null} governance={governance} />
								</>
							</NewProposalContext.Provider>
							<div className="border-t border-fgd-4 flex justify-end mt-6 pt-6 space-x-4">
								<SecondaryButton disabled={isLoading} isLoading={isLoadingDraft} onClick={() => handleCreate(true)}>
									Save draft
								</SecondaryButton>
								<Button isLoading={isLoadingSignedProposal} disabled={isLoading} onClick={() => handleCreate(false)}>
									Add proposal
								</Button>
							</div>
						</div>
					</>
				</div>
				<div className="col-span-12 md:col-span-5 lg:col-span-4">
					<TokenBalanceCardWrapper />
				</div>
			</div>
		</div>
	)
}

export default New
