<script lang="ts">
	import type { ChangeEventHandler } from 'svelte/elements';
	export let value: any;
	export let onChange: ChangeEventHandler<HTMLInputElement> | null = null;
	export let name: string;
	export let type: 'text' | 'number' | 'checkbox' = 'text';
</script>

<div class="flex items-center justify-end w-44 lg:w-48 h-12">
	<label class="text-right" for={name}>{name}</label>
	<input
		class={`${
			type === 'number' ? 'ml-4' : type === 'checkbox' ? 'h-4' : ''
		} w-10 lg:w-12 text-black`}
		{type}
		{name}
		id="reversed"
		{value}
		on:change={onChange}
	/>
</div>
