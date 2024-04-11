<script lang="ts">
	import ButtonLink from './ButtonLink.svelte';

	export let imgUrl: string;
	export let imgAlt: string;
	export let linkUrl: string;
	export let linkText: string;
	export let title: string;
	export let desc: string = '';
</script>

<div
	class="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
	<img class="rounded-t-lg" src={imgUrl} alt={imgAlt} />
	<div class="p-5">
		<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h5>
		{#if desc}
			<p class="mb-3 font-normal text-gray-700 dark:text-gray-400">{desc}</p>
		{/if}
		<ButtonLink url={linkUrl}>{linkText}</ButtonLink>
	</div>
</div>
