import { addExtension, Packr } from 'msgpackr';

class MyCustomClass {}


let extPackr = new Packr();
addExtension({
	Class: MyCustomClass,
	type: 11, // register your own extension code (a type code from 1-100)
	pack(instance) {
		// define how your custom class should be encoded
		return Buffer.from([instance.myData]); // return a buffer
	},
	unpack(buffer) {
		// define how your custom class should be decoded
		let instance = new MyCustomClass();
		//instance.myData = buffer[0];
		return instance; // decoded value from buffer
	}
});