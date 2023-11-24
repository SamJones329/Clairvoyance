<script lang="ts">
	import type { ChangeEventHandler } from 'svelte/elements';
	export let value: any;
	export let onChange: ChangeEventHandler<HTMLInputElement> | null = null;
	export let name: string;
	export let placeholder: string = '';
	export let type: 'text' | 'number' | 'checkbox' = 'text';
</script>

<div class="flex items-center justify-end w-44 lg:w-48 h-12">
	<label class="text-right text-lighttext" for={name}>{name}:</label>
	<input
		{placeholder}
		class={`${
			type === 'number' ? 'ml-4' : type === 'checkbox' ? 'h-4' : ''
		} w-10 lg:w-12 text-black bg-transparent text-lighttext border-b border-zinc-600 text-center hover:border-zinc-500 focus:border-zinc-500 focus:outline-none focus:border-b-2`}
		{type}
		{name}
		{value}
		on:change={onChange}
	/>
</div>

<style>
	/* Chrome, Safari, Edge, Opera */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	/* Firefox */
	input[type='number'] {
		-moz-appearance: textfield;
	}
</style>
