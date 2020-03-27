import { CustomError } from 'ts-custom-error';

export class Exception extends CustomError {
    constructor(
        public message: string = undefined
    ) {
        super(message);
    }
}
