export const toDollars = (value, includeCents?, removeEmptyCents?, hideDollarSign?, centsOnly?) => {
	if (!value) return value

	const digits = value.toString().replace(/[^\d]/g, '')

	const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(digits)
	let cents = money.slice(-3)

	if (centsOnly) {
		return (removeEmptyCents) ? (cents === '.00' ? '' : cents) : cents;
	}

	if (includeCents && removeEmptyCents) {
		return cents === '.00' && removeEmptyCents ? money.replace(cents, '') : money
	}

	if (includeCents && !removeEmptyCents) {
		return hideDollarSign ? money.substring(1) : money
	} else {
		return hideDollarSign ? money.replace(cents, '').substring(1) : money.replace(cents, '')
	}
}

export const toPercent = (value, fixedAmount?) => {
	return `${Number(value).toFixed(fixedAmount || 0)}%`
}

export const Percent = (props) => {
	return <span className="inline-flex items-start formatted-item">
		<span className={`formatted-item__amount${ props.amountClasses ? ' ' + props.amountClasses: ''}`}>{`${Number(props.value || props.children || 0).toFixed(props.fixedAmount || 0)}`}</span>
		<span className={`formatted-item__percent${ props.percentClasses ? ' ' + props.percentClasses: ''}`}>%</span>
	</span>
}

export const Dollars = (props) => {
	return <span className="inline-flex items-start formatted-item">
		<span className={`formatted-item__dollar${ props.dollarClasses ? ' ' + props.dollarClasses: ''}`}>$</span>
		<span className={`formatted-item__amount${ props.amountClasses ? ' ' + props.amountClasses: ''}`}>{`${toDollars( Number(props.value || props.children || 0), false, false, true)}`}</span>
		<span className={`formatted-item__cents${ props.centClasses ? ' ' + props.centClasses: ''}`}>{`${toDollars( Number(props.value || props.children || 0), true, props.removeEmptyCents, true, true)}`}</span>
	</span>
}


