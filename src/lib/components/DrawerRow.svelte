<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	const placeholder = 'Untitled';

	export let name: string;
	export let selected: boolean;
	export let onClick: (() => void) | null = null;
	export let deleteRow: (() => void) | undefined;

	let maybeDelete = false;
	let input: HTMLInputElement;
	$: ((name: string) => {
		if (input) {
			input.style.width = `${name.length || placeholder.length}ch`;
		}
	})(name);
</script>

<div
	class={`flex items-center justify-between px-2 py-1 my-1 rounded-md ${
		selected ? 'bg-zinc-700' : ''
	}`}
	on:click={onClick}
	on:keypress={onClick}
>
	<div class="flex items-center gap-2">
		<FontAwesomeIcon class="text-white" icon="fa-solid fa-bullseye" />
		<input
			class="bg-transparent text-lighttext"
			type="text"
			name="name"
			bind:this={input}
			bind:value={name}
			{placeholder}
		/>
	</div>

	{#if deleteRow !== undefined}
		{#if maybeDelete}
			<div class="flex gap-2">
				<button on:click={() => (maybeDelete = false)}
					><FontAwesomeIcon
						class={`${selected ? 'text-zinc-500' : 'text-zinc-600'} hover:text-danger`}
						icon="fa-solid fa-x"
					/></button
				>
				<button
					on:click={() => {
						if (deleteRow) {
							deleteRow();
						}
						maybeDelete = false;
					}}
					><FontAwesomeIcon
						class={`${selected ? 'text-zinc-500' : 'text-zinc-600'} hover:text-success`}
						icon="fa-solid fa-check"
					/></button
				>
			</div>
		{:else}
			<button on:click={() => (maybeDelete = true)}
				><FontAwesomeIcon
					class={`${selected ? 'text-zinc-500' : 'text-zinc-600'} hover:text-danger`}
					icon="fa-solid fa-trash"
				/></button
			>
		{/if}
	{/if}
</div>
