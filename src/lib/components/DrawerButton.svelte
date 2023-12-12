<script lang="ts">
	export let onClick: (() => void) | null = null;
</script>

<button
	class="w-full flex items-center justify-center gap-2 text-lighttext bg-zinc-700 hover:bg-zinc-600 py-1 rounded-lg my-2"
	on:click={onClick}
>
	<slot />
</button>
