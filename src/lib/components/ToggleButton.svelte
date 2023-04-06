<script lang="ts">
	export let value: boolean = false;
	export let onClick: () => void = () => {};
</script>

<button on:click={onClick} class="relative" type="button">
	<span class="block w-5 h-9 bg-neutral-200 rounded-xl border-2 border-solid border-neutral-300" />
	<span
		class={`absolute top-[0.125rem] left-[0.125rem] rounded-xl w-4 h-8 transition-all duration-100 ${
			value ? 'bg-violet-300' : 'bg-transparent'
		}`}
	/>
	<span
		class={`absolute transition-all duration-100 left-[0.2rem] ${
			value ? 'top-[0.2rem] bg-violet-600' : 'top-[1.175rem] bg-neutral-500'
		} rounded-xl w-[0.875rem] h-[0.875rem] z-10 `}
	/>
</button>

<!-- top-[0.2rem] left-[0.2rem] h-[1.85rem] w-[0.875rem] -->
