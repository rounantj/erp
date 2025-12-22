import React from "react";
import { InputGroup, FormControl } from "react-bootstrap";

function SearchInput({ value, onChange, onInput, placeholder }) {
    return (
        <InputGroup style={{ maxWidth: '80%', display: 'inline-flex' }} className="mb-3">

            <FormControl
                placeholder={placeholder}
                aria-label="Search"
                aria-describedby="search-icon"
                value={value}
                style={{ padding: '15px' }}
                onInput={(e) => onInput(e.target.value)}
            />
            <i className="nc-icon nc-zoom-split"></i>
        </InputGroup>
    );
}

export default SearchInput;
