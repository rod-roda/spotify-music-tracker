import DefaultError from "./DefaultError";

export default class BadGateway extends DefaultError {
    constructor(message = 'Gateway inválido') {
        super(message, 502);
    }
}
