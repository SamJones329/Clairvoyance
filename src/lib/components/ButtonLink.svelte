<script lang="ts">
	export let url: string;
	export let ariaLabel = '';
</script>

<a
	class={`p-2 bg-primary hover:bg-secondary rounded-lg transition flex items-center`}
	href={url}
	aria-label={ariaLabel}><slot /></a
>
