import DefaultError from "./DefaultError";

export default class NotFound extends DefaultError {
    constructor(message = 'Não encontrado') {
        super(message, 404);
    }
}
