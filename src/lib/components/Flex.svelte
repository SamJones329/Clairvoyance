<script lang="ts">
	export let direction: 'row' | 'col' = 'row';
	export let align: 'center' | 'start' = 'start';
	export let justify: 'start' | 'center' | 'between' = 'start';
	export let gap = '4';
	export let classes: string = '';
	export let p: 'none' | 'xs' | 's' | 'm' | 'l' | 'xl' = 'none';

	const pMap = { none: '0', xs: '2', s: '4', m: '8', l: '16', xl: '32' };
	const pString = pMap[p];
</script>

<div
	class={`flex items-${align} justify-${justify} p-${pString}  gap-${gap} flex-${direction} ${classes}`}
>
	<slot />
</div>
