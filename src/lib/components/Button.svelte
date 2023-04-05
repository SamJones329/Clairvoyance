<script lang="ts">
	export let onClick: (
		ev: MouseEvent & {
			currentTarget: EventTarget & HTMLButtonElement;
		}
	) => void;
	export let width = 'w-36';
	export let widthLg = 'w-48';
	export let height = '';
	export let mX = 'mx-4';
	export let mTop = 'mt-4';
	export let mBtm = '';
	export let invert = false;
	export let bold = false;
</script>

<button
	on:click={onClick}
	type="button"
	class={`${width} lg:${widthLg} ${height} ${
		invert ? 'bg-white text-violet-800' : 'bg-violet-800 text-white'
	} ${bold ? 'font-bold' : ''} p-2 rounded-lg ${mX} ${mTop} ${mBtm}`}><slot /></button
>
