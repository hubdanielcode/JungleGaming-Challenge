import type { DecimalString } from "@/types";

const decimalPlaces = 18;
const decimalScale = 10n ** BigInt(decimalPlaces);

type DecimalRatio = {
  numerator: bigint;
  denominator: bigint;
};

const convertDecimalToUnits = (decimalValue: DecimalString): bigint => {
  const normalizedValue = decimalValue.trim();
  const isNegative = normalizedValue.startsWith("-");
  const unsignedValue = normalizedValue.replace("-", "");
  const [wholePart, fractionalPart = ""] = unsignedValue.split(".");
  const paddedFractionalPart = (fractionalPart + "0".repeat(decimalPlaces)).slice(0, decimalPlaces);
  const wholeUnits = BigInt(wholePart || "0") * decimalScale;
  const fractionalUnits = BigInt(paddedFractionalPart || "0");
  const absoluteUnits = wholeUnits + fractionalUnits;

  return isNegative ? -absoluteUnits : absoluteUnits;
};

const convertUnitsToDecimal = (decimalUnits: bigint): DecimalString => {
  const isNegative = decimalUnits < 0n;
  const absoluteUnits = isNegative ? -decimalUnits : decimalUnits;
  const wholePart = absoluteUnits / decimalScale;
  const fractionalPart = (absoluteUnits % decimalScale).toString().padStart(decimalPlaces, "0").replace(/0+$/, "");
  const decimalValue = fractionalPart ? `${wholePart}.${fractionalPart}` : wholePart.toString();

  return isNegative ? `-${decimalValue}` : decimalValue;
};

const calculateRatio = (decimalValue: DecimalString, ratio: DecimalRatio): DecimalString => {
  const decimalUnits = convertDecimalToUnits(decimalValue);
  const ratioUnits = (decimalUnits * ratio.numerator) / ratio.denominator;

  return convertUnitsToDecimal(ratioUnits);
};

const decimal = {
  add(firstValue: DecimalString, secondValue: DecimalString): DecimalString {
    return convertUnitsToDecimal(convertDecimalToUnits(firstValue) + convertDecimalToUnits(secondValue));
  },

  subtract(firstValue: DecimalString, secondValue: DecimalString): DecimalString {
    return convertUnitsToDecimal(convertDecimalToUnits(firstValue) - convertDecimalToUnits(secondValue));
  },

  multiplyByInteger(decimalValue: DecimalString, multiplier: number): DecimalString {
    return convertUnitsToDecimal(convertDecimalToUnits(decimalValue) * BigInt(multiplier));
  },

  multiplyByRatio(decimalValue: DecimalString, numerator: number, denominator: number): DecimalString {
    return calculateRatio(decimalValue, {
      numerator: BigInt(numerator),
      denominator: BigInt(denominator),
    });
  },

  compare(firstValue: DecimalString, secondValue: DecimalString): -1 | 0 | 1 {
    const difference = convertDecimalToUnits(firstValue) - convertDecimalToUnits(secondValue);

    if (difference === 0n) {
      return 0;
    }

    return difference < 0n ? -1 : 1;
  },

  isZero(decimalValue: DecimalString): boolean {
    return convertDecimalToUnits(decimalValue) === 0n;
  },

  format(decimalValue: DecimalString, maximumDecimals = 4): string {
    const [wholePart, fractionalPart = ""] = decimalValue.split(".");
    const truncatedFractionalPart = fractionalPart.slice(0, maximumDecimals).replace(/0+$/, "");

    return truncatedFractionalPart ? `${wholePart}.${truncatedFractionalPart}` : wholePart;
  },
};

export { convertDecimalToUnits, convertUnitsToDecimal, calculateRatio, decimal };
