import NewAccountForm from '@components/TreasuryAccount/NewTreasuryAccountForm'
import React from 'react'

const New = (props) => {
	return props.rnft ? (
		<NewAccountForm rnft={true} title={`Create DAO's rNFT Treasury Account`}>{ props.children }</NewAccountForm>
	) : (
		<div className="grid grid-cols-12">
			<div className="bg-bkg-2 p-4 md:p-6 col-span-12 md:col-span-12 lg:col-span-8 space-y-3">
				<NewAccountForm></NewAccountForm>
			</div>
		</div>
	)
}

export default New
