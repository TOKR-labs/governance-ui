import React, { useContext, useEffect, useState } from 'react'
import * as yup from 'yup'
import { serializeInstructionToBase64 } from '@solana/spl-governance'
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64 } from '@solana/spl-token'
import { WalletAdapter } from '@solana/wallet-adapter-base'
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { getInstructionDataFromBase64, Governance, ProgramAccount } from '@solana/spl-governance'
import Input from '@components/inputs/Input'
import Textarea from '@components/inputs/Textarea'
import { validateInstruction } from '@utils/instructionTools'
import useRealm from '@hooks/useRealm'
import { Base64InstructionForm, TokrizeForm, UiInstruction, VaultForm } from '@utils/uiTypes/proposalCreationTypes'
import useWalletStore from 'stores/useWalletStore'
import * as borsh from 'borsh'
import { NewProposalContext } from '../../new-escrow-vault'
import GovernedAccountSelect from '../GovernedAccountSelect'
import useGovernedMultiTypeAccounts from '@hooks/useGovernedMultiTypeAccounts'
import { getTokrInstruction, getVaultInstruction } from 'utils/tokrTools'

const EscrowVaultContract = ({ index, governance }: { index: number; governance: ProgramAccount<Governance> }) => {
	const { realmInfo } = useRealm()
	const programId: PublicKey | undefined = realmInfo?.programId
	const connection = useWalletStore((s) => s.connection)
	const wallet = useWalletStore((s) => s.current)

	const { governedMultiTypeAccounts } = useGovernedMultiTypeAccounts()
	const shouldBeGoverned = index !== 0 && governance
	const [form, setForm] = useState<VaultForm>({
		governedAccount: undefined,
		tokenAddress: '',
	})
	const [formErrors, setFormErrors] = useState({})
	const { handleSetInstructions } = useContext(NewProposalContext)
	const handleSetForm = ({ propertyName, value }) => {
		setFormErrors({})
		setForm({ ...form, [propertyName]: value })
	}
	async function getInstruction(): Promise<UiInstruction> {
		return getVaultInstruction({
			schema,
			form,
			programId,
			connection,
			wallet,
			currentAccount: form.governedAccount,
			setFormErrors,
		})
	}
	useEffect(() => {
		handleSetInstructions({ governedAccount: form.governedAccount?.governance, getInstruction }, index)
	}, [form])

	const schema = yup.object().shape({
		governedAccount: yup.object().nullable().required('Governed account is required'),
		base64: yup
			.string()
			.required('Instruction is required')
			.test('base64Test', 'Invalid base64', function (val: string) {
				if (val) {
					try {
						getInstructionDataFromBase64(val)
						return true
					} catch (e) {
						return false
					}
				} else {
					return this.createError({
						message: `Instruction is required`,
					})
				}
			}),
	})
	return (
		<>
			<div className="space-y-4">
				<GovernedAccountSelect
					label="Governance"
					governedAccounts={governedMultiTypeAccounts}
					onChange={(value) => {
						handleSetForm({ value, propertyName: 'governedAccount' })
					}}
					value={form.governedAccount}
					error={formErrors['governedAccount']}
					shouldBeGoverned={shouldBeGoverned}
					governance={governance}
				/>
				<Input
					label="Token Address"
					value={form.tokenAddress}
					type="string"
					onChange={(event) => {
						handleSetForm({
							value: event.target.value,
							propertyName: 'tokenAddress',
						})
					}}
					step={1}
					error={formErrors['tokenAddress']}
				/>
			</div>
		</>
	)
}

export default EscrowVaultContract
