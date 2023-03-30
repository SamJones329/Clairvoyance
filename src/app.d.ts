// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
		// eslint-disable-next-line no-unused-labels
		
		export type OnChangeParam = Event & {
			currentTarget: EventTarget & HTMLInputElement;
		};
	}
	interface Window {__TAURI_METADATA__: unknown};
}

export {};
