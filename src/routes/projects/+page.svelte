<script lang="ts">
	import { goto } from '$app/navigation';
	import { getDefaultAuto } from '$lib/scripts/Trajectory';
	import { onMount } from 'svelte';

	let projects = [];
	let localProjects: { id: string; name: string }[] = [];

	onMount(() => {
		const projectsString = localStorage.getItem('projects');
		if (projectsString) {
			localProjects = JSON.parse(projectsString);
		}
	});
	const createLocalProject = () => {
		const id = new Date().getTime().toString();
		localProjects.push({ id, name: 'New Project' });
		localStorage.setItem('projects', JSON.stringify(localProjects));
		localStorage.setItem(id, JSON.stringify({ autos: [getDefaultAuto()] }));
		goto(`/projects/${id}?projectStorage=local`);
	};
</script>

<h2>Local Projects</h2>
{#each localProjects as project}
	<a href={`/projects/${project.id}?projectStorage=local`}>{project.name}</a>
{/each}

<button on:click={createLocalProject}>Create New Project</button>
