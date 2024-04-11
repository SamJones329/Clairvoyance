<script lang="ts">
	export let headers: { name: string }[];
</script>

<table class="w-full">
	<thead class="p-8">
		<tr>
			{#each headers as header}
				<th class="text-left font-semibold text-xl p-4 border-b">{header.name}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		<slot />
	</tbody>
</table>
