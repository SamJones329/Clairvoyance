<script>
	import Flex from '$lib/components/Flex.svelte';
	import ImgCard from '$lib/components/ImgCard.svelte';
	import Link from '$lib/components/Link.svelte';
</script>

<Flex align="center" gap="0" direction="col" justify="center" classes="mt-8">
	<p class="text-2xl">Welcome to</p>
	<Flex align="center" gap="0">
		<img class="h-16 w-16" src="/Clairvoyance.svg" alt="Clairvoyance Logo" />
		<span class="text-[4rem]">airvoyance</span>
	</Flex>
</Flex>

<Flex align="center" justify="center" classes="my-8">
	<ImgCard
		title="Plan Paths"
		imgUrl="https://picsum.photos/200/300"
		imgAlt="path planning"
		linkUrl="/projects"
		linkText="Go To Projects"
	/>

	<ImgCard
		title="Save Projects"
		imgUrl="https://picsum.photos/200/300"
		imgAlt="path planning"
		linkUrl="/projects"
		linkText="Sign Up"
	/>

	<ImgCard
		title="Go Offline"
		imgUrl="https://picsum.photos/200/300"
		imgAlt="path planning"
		linkUrl="/projects"
		linkText="Download Desktop App"
	/>
</Flex>

<p class="text-center text-lg">
	<Link url="/about">Learn more about Clairvoyance</Link>
</p>
