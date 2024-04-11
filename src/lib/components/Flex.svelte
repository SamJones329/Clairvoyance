<script lang="ts">
	export let direction: 'row' | 'col' = 'row';
	export let align: 'center' = 'center';
	export let justify: 'start' | 'center' = 'start';
	export let gap = '4';
	export let classes: string = '';

	const directionMap = { row: 'flex-row', col: 'flex-col' };
	const alignMap = { center: 'items-center' };
	const justifyMap = { start: 'justify-start', center: 'justify-center' };
	const directionString = directionMap[direction];
	const alignString = alignMap[align];
	const justifyString = justifyMap[justify];
</script>

<div class={`flex ${justifyString} gap-${gap} ${directionString} ${alignString} ${classes}`}>
	<slot />
</div>
