module datapact::error;

const ERR_VECCTOR_LENGTH_IS_WRONG: u64 = 0;
const ERR_INVALID_LABEL: u64 = 1;
const ERR_ALREADY_FINALIZED: u64 = 2;
const ERR_ALREADY_LABELED: u64 = 3;



public(package) fun vecctor_length_is_wrong() {
    abort ERR_VECCTOR_LENGTH_IS_WRONG
}

public(package) fun invalid_label() {
    abort ERR_INVALID_LABEL
}

public(package) fun already_finalized() {
    abort ERR_ALREADY_FINALIZED
}

public(package) fun already_labeled() {
    abort ERR_ALREADY_LABELED
}


