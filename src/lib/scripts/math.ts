import fieldData from '$lib/assets/field-data.json';

const PI_STR = `${Math.PI}`;
const FIELD_WIDTH_STR = `${fieldData.fieldWidthMeters}`;

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

const parseAndRound = (numStr: string) => {
	const numStrNoVar = numStr
		.replace(/(?:[Mm]ath\.)?(?:PI|pi)/g, PI_STR)
		.replace('fieldWidth', FIELD_WIDTH_STR);
	const rpnNumStr = convertToRPN(numStrNoVar);
	const numResult = calculateRPNExpression(rpnNumStr);
	const num = typeof numResult === 'number' ? numResult : parseFloat(numResult ?? '0');
	return roundFloat(num, 3);
};

export { degreesToRadians, radiansToDegrees, roundFloat, parseAndRound, PI_STR };

const operations: { [key: string]: (arg: { firstValue: number; secondValue: number }) => number } =
	{
		'+': ({ firstValue, secondValue }) => firstValue + secondValue,
		'-': ({ firstValue, secondValue }) => firstValue - secondValue,
		'*': ({ firstValue, secondValue }) => firstValue * secondValue,
		'/': ({ firstValue, secondValue }) => {
			if (secondValue === 0) throw Error('It is impossible to divide by zero');

			return firstValue / secondValue;
		}
	};

const getCalculationPairOfValue = (operationStack: (number | string)[]) => {
	const secondValue = +(operationStack.pop() as number);
	const firstValue = +(operationStack.pop() as number);

	return { firstValue, secondValue };
};

const addNumberInOutputArray = (element: string, outputArray: number[]) => {
	const numberElement = Number(element);

	if (Number.isNaN(numberElement)) {
		const errorText = `you used ${element}, but you must use only number!`;
		throw Error(errorText);
	}

	if (numberElement < 0) {
		throw Error(`you used ${element}, but you must use only a positive number!`);
	}
	outputArray.push(numberElement);
};

const processLowPriorityOperator = (
	operator: string,
	operationStack: string[],
	outputArray: string[]
) => {
	if (operationStack.length === 0) {
		operationStack.push(operator);
	} else {
		switch (operationStack[operationStack.length - 1]) {
			case '+':
			case '-':
			case '/':
			case '*':
				outputArray.push(operationStack.pop() as string);
				operationStack.push(operator);
				break;
			default:
				operationStack.push(operator);
				break;
		}
	}
};

const processHigthPriorityOperator = (
	operator: string,
	operationStack: string[],
	outputArray: string[]
) => {
	if (operationStack.length === 0) {
		operationStack.push(operator);
	} else {
		const lastItemInStack = operationStack[operationStack.length - 1];
		switch (lastItemInStack) {
			case '+':
			case '-':
				operationStack.push(operator);
				break;
			case '/':
			case '*':
				outputArray.push(operationStack.pop() as string);
				operationStack.push(operator);
				break;
			default:
				operationStack.push(operator);
				break;
		}
	}
};

function checkTypeInputExpression(expression: string) {
	if (typeof expression !== 'string') throw new Error('The expression must be a string type');
}

function calculateRPNExpression(expression: string) {
	checkTypeInputExpression(expression);
	const inputArray = expression.split(' ');
	const operationStack: (number | string)[] = [];
	inputArray.forEach((element) => {
		switch (element) {
			case '+':
			case '-':
			case '/':
			case '*':
				operationStack.push(operations[element](getCalculationPairOfValue(operationStack)));
				break;
			default:
				operationStack.push(element);
				break;
		}
	});

	return operationStack.pop();
}

function convertToRPN(expression: string) {
	checkTypeInputExpression(expression);
	const outputArray: (number | string)[] = [];
	const operationStack: string[] = [];
	const spacedExpression = expression.replace(/([+*/\-()])/g, ' $1 ');
	const inputArray = spacedExpression.split(' ').filter((val) => val.length > 0);

	let prevElement = '';
	inputArray.forEach((element) => {
		switch (element) {
			case '+':
			case '-':
				if (prevElement.length === 0 || /[+*/\-(]/g.test(prevElement)) {
					addNumberInOutputArray('0', outputArray as number[]);
				}
				processLowPriorityOperator(element, operationStack, outputArray as string[]);
				break;
			case '/':
			case '*':
				processHigthPriorityOperator(element, operationStack, outputArray as string[]);
				break;
			case '(':
				operationStack.push(element);
				break;
			case ')':
				while (operationStack.length > 0) {
					const lastItemStack = operationStack.pop() as string;
					if (lastItemStack === '(') {
						break;
					} else {
						outputArray.push(lastItemStack);
					}
				}
				break;
			default:
				addNumberInOutputArray(element, outputArray as number[]);
				break;
		}
		prevElement = element;
	});
	outputArray.push(...operationStack.reverse());

	return outputArray.join(' ');
}

// https://github.com/DimQ1/arithmetic-expressions-calculator/tree/develop
export { calculateRPNExpression, convertToRPN };
