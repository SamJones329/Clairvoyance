function degreesToRadians(degrees: number) {
	return (degrees * Math.PI) / 180;
}

function radiansToDegrees(radians: number) {
	return (radians * 180) / Math.PI;
}

function roundFloat(num: number, decimalPlaces: number) {
	const k = Math.pow(10, decimalPlaces);
	return Math.round((num + Number.EPSILON) * k) / k;
}

export { degreesToRadians, radiansToDegrees, roundFloat };
