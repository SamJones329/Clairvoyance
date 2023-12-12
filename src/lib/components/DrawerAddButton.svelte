<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import DrawerButton from './DrawerButton.svelte';

	export let onClick: (() => void) | null = null;
</script>

<DrawerButton {onClick}>
	<FontAwesomeIcon class="text-lighttext" icon="fa-solid fa-plus" />
</DrawerButton>
