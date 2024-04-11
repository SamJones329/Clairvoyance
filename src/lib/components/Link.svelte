<script lang="ts">
	export let url: string;
	export let ariaLabel = '';
	export let underline = true;
	export let classes = '';

	const underlineClasses =
		"relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[0.15em] after:bg-primary after:rounded-sm after:scale-0 after:transition after:origin-center hover:after:scale-100";
</script>

<a class={`${underline ? underlineClasses : ''} ${classes}`} href={url} aria-label={ariaLabel}
	><slot /></a
>
