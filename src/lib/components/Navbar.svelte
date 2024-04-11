<script>
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ButtonLink from './ButtonLink.svelte';

	import Flex from './Flex.svelte';
	import Link from './Link.svelte';
</script>

<div class="bg-zinc-600 p-4 text-white flex items-center justify-between h-10 lg:h-20">
	<Flex align="center">
		<Link underline={false} url="/" ariaLabel="Home"
			><img class="h-12 w-12" src="/Clairvoyance.svg" alt="Clairvoyance logo" /></Link
		>
		<Link url="/projects">Projects</Link>
		<Link url="/about">About</Link>
	</Flex>
	<Flex align="center">
		<ButtonLink url="https://github.com/SamJones329/Clairvoyance"
			><FontAwesomeIcon class="text-xl" icon="fa-brands fa-github" /></ButtonLink
		>
	</Flex>
</div>
