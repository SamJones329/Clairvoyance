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

	const widths = {
		sm: 'w-24',
		md: 'w-32',
		lg: 'w-40'
	};
</script>

<button
	on:click={onClick}
	type="button"
	class={`text-sm ${fixedWidth ? widths[size] : ''} ${height} ${
		invert ? 'bg-white text-violet-800' : 'bg-primary text-whitetext'
	} ${bold ? 'font-bold' : ''} p-2 rounded-lg ${mX} ${mTop} ${mBtm}`}><slot /></button
>
