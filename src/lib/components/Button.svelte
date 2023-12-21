<script lang="ts">
	export let onClick: (
		ev: MouseEvent & {
			currentTarget: EventTarget & HTMLButtonElement;
		}
	) => void;
	export let fixedWidth = false;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let height = '';
	export let mX = 'mx-4';
	export let mTop = 'mt-4';
	export let mBtm = '';
	export let invert = false;
	export let bold = false;
	export let intent: 'primary' | 'danger' | 'success' | 'warning' = 'primary';

	let bgColor = invert ? 'bg-white' : `bg-${intent}`;
	let textColor = invert ? `text-${intent}` : 'text-whitetext';

	const widths = {
		sm: 'w-24',
		md: 'w-32',
		lg: 'w-40'
	};
</script>

<button
	on:click={onClick}
	type="button"
	class={`text-sm brightness-90 hover:brightness-100 transition-all ${
		fixedWidth ? widths[size] : ''
	} ${height} ${bgColor} ${textColor} ${
		bold ? 'font-bold' : ''
	} p-2 rounded-lg ${mX} ${mTop} ${mBtm}`}><slot /></button
>
