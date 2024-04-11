<script lang="ts">
	export let onClick: (
		ev: MouseEvent & {
			currentTarget: EventTarget & HTMLButtonElement;
		}
	) => void;
	export let fixedWidth = false;
	export let size: App.uiSize = 'm';
	export let height = '';
	export let mX: App.uiSize = 's';
	export let mY: App.uiSize = 's';
	export let invert = false;
	export let bold = false;
	export let intent: 'primary' | 'danger' | 'success' | 'warning' = 'primary';

	const bgMap = {
		primary: 'bg-primary',
		danger: 'bg-danger',
		success: 'bg-success',
		warning: 'bg-warning',
		invert: 'bg-white'
	};
	const colorMap = {
		primary: 'text-primary',
		danger: 'text-danger',
		success: 'text-success',
		warning: 'text-warning',
		default: 'text-whitetext'
	};
	let bgColor = invert ? bgMap.invert : bgMap[intent];
	let textColor = invert ? colorMap[intent] : colorMap.default;

	const widths = {
		none: 'w-0',
		xs: 'w-16',
		s: 'w-24',
		m: 'w-32',
		l: 'w-40',
		xl: 'w-48',
		'2xl': 'w-56'
	};

	const mxMap = {
		none: 'mx-0',
		xs: 'mx-2',
		s: 'mx-4',
		m: 'mx-8',
		l: 'mx-16',
		xl: 'mx-32',
		'2xl': 'mx-64'
	};
	const myMap = {
		none: 'my-0',
		xs: 'my-2',
		s: 'my-4',
		m: 'my-8',
		l: 'my-16',
		xl: 'my-32',
		'2xl': 'my-64'
	};
	const mxStr = mxMap[mX];
	const myStr = myMap[mY];
</script>

<button
	on:click={onClick}
	type="button"
	class={`text-sm brightness-90 hover:brightness-100 transition-all ${
		fixedWidth ? widths[size] : ''
	} ${height} ${bgColor} ${textColor} ${bold ? 'font-bold' : ''} p-2 rounded-lg ${mxStr} ${myStr}`}
	><slot /></button
>
