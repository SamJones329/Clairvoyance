<script lang="ts">
	/** Bind this variable */
	export let checked: boolean | null | undefined;
	export let name: string;
</script>

<div class="flex items-center justify-end w-44 lg:w-48 h-12">
	<label class="text-right text-lighttext" for={name}>{name}:</label>
	<input
		class="h-4 w-10 lg:w-12 text-black bg-transparent text-lighttext border-b border-zinc-600 text-center hover:border-zinc-500 focus:border-zinc-500 focus:outline-none focus:border-b-2"
		type="checkbox"
		{name}
		bind:checked
	/>
</div>

<style>
	/* Chrome, Safari, Edge, Opera */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
</style>
