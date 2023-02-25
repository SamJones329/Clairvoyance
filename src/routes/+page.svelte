<script lang="ts">
	import fieldImg from '$lib/assets/field-image.png';
	const pathTableIds = ['path0', 'path1', 'path2', 'path3', 'path4'];
</script>

<div class="flex">
	<div class="w-64 bg-slate-600 h-screen p-4">
		<form action="" class="flex flex-col items-center">
			<div class="flex items-center justify-end w-48 h-12">
				<label class="text-right" for="reversed">Reversed</label>
				<input class="w-12 h-4" type="checkbox" name="reversed" id="reversed" />
			</div>

			<div class="flex items-center justify-end w-48 h-12">
				<label class="text-right" for="clamped-cubic">Clamped Cubic</label>
				<input class="w-12 h-4" type="checkbox" name="clamped-cubic" id="clamped-cubic" />
			</div>

			<div class="flex items-center justify-end w-48 h-12">
				<label class="text-right" for="max-acceleration">Max Acceleration</label>
				<input class="ml-4 w-16" type="number" name="max-acceleration" id="max-acceleration" />
			</div>

			<div class="flex items-center justify-end w-48 h-12">
				<label class="text-right" for="max-velocity">Max Velocity</label>
				<input class="ml-4 w-16" type="number" name="max-velocity" id="max-velocity" />
			</div>

			<div class="flex items-center justify-end w-48 h-12">
				<label class="text-right" for="max-centripital-acceleration"
					>Max Centripital Acceleration</label
				>
				<input
					class="ml-4 w-16"
					type="number"
					name="max-centripital-acceleration"
					id="max-centripital-acceleration"
				/>
			</div>

			<div class="flex items-center justify-end w-48 h-12">
				<label class="text-right" for="start-velocity">Start Velocity</label>
				<input class="ml-4 w-16" type="number" name="start-velocity" id="start-velocity" />
			</div>

			<div class="flex items-center justify-end w-48 h-12">
				<label class="text-right" for="end-velocity">End Velocity</label>
				<input class="ml-4 w-16" type="number" name="end-velocity" id="end-velocity" />
			</div>

			<div class="paths mt-8 bg-white text-black">
				{#each pathTableIds as pathTableId}
					<table id={pathTableId}>
						<tr>
							<th>X (m)</th>
							<th>Y (m)</th>
							<th>Th (degr)</th>
						</tr>
						<tr>
							<button>-</button>
							<button>+</button>
						</tr>
					</table>
				{/each}
			</div>
		</form>
	</div>

	<div class="overflow-y-auto m-8">
		<img class="min-w-[64rem]" src={fieldImg} alt="" />
	</div>
</div>
