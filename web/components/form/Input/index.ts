export { default as Text } from "./Text";
export { default as File } from "./File";
export { default as Float } from "./Float";
export { default as Int } from "./Int";
export { default as TextArea } from "./TextArea";
export { default as Decimal } from "./Decimal";
export { default as DateTime } from "./DateTime";

// To use Text and File in the Input object, we need to import them locally as well.
// Re-exporting does not make them available in the current module's scope.
import Text from "./Text";
import File from "./File"; // Assuming File is also needed for the Input object
import Decimal from "./Decimal";
import DateTime from "./DateTime";

const Input = { Text, File, Decimal, DateTime };

export default Input;
