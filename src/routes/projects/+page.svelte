<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import DetailsPanel from '$lib/components/DetailsPanel.svelte';
	import Flex from '$lib/components/Flex.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Table from '$lib/components/Table.svelte';
	import TableData from '$lib/components/TableData.svelte';
	import TableRow from '$lib/components/TableRow.svelte';
	import { getDefaultAuto } from '$lib/scripts/Trajectory';
	import { onMount } from 'svelte';

	let local = true;
	let projects = [];
	let localProjects: { id: string; name: string; numAutos: number }[] = [];
	let selectedProject = -1;

	onMount(() => {
		const projectsString = localStorage.getItem('projects');
		if (projectsString) {
			localProjects = JSON.parse(projectsString);
		}
	});
	const createLocalProject = () => {
		const id = new Date().getTime().toString();
		localProjects.push({ id, name: 'New Project', numAutos: 1 });
		localStorage.setItem('projects', JSON.stringify(localProjects));
		localStorage.setItem(id, JSON.stringify({ autos: [getDefaultAuto()] }));
		goto(`/projects/${id}?projectStorage=local`);
	};
</script>

<Flex>
	<Flex p="m" classes="w-full" direction="col">
		<Flex align="center" classes="w-full" justify="between">
			<PageHeader>Projects</PageHeader>
			<Button onClick={createLocalProject}>Create New Project</Button>
		</Flex>
		<Table
			headers={[
				{ name: 'Name' },
				{ name: 'Last Edited' },
				{ name: 'Game Year' },
				{ name: 'Autos' }
			]}
		>
			{#each localProjects as project}
				<TableRow
					><TableData
						><a href={`/projects/${project.id}?projectStorage=local`}>{project.name}</a></TableData
					>
					<TableData>{new Date()}</TableData>
					<TableData>2023</TableData>
					<TableData>{project.numAutos ?? 0}</TableData>
				</TableRow>
			{/each}
		</Table>
	</Flex>

	<DetailsPanel>
		{#if selectedProject >= 0}{:else}
			No Project Selected
		{/if}
	</DetailsPanel>
</Flex>
