import React from "react";
import { InputGroup, FormControl } from "react-bootstrap";

function SearchInput({ value, onChange, placeholder }) {
    return (
        <InputGroup style={{ maxWidth: '80%', display: 'inline-flex' }} className="mb-3">

            <FormControl
                placeholder={placeholder}
                aria-label="Search"
                aria-describedby="search-icon"
                value={value}
                style={{ padding: '15px' }}
                onChange={onChange}
            />
            <i className="nc-icon nc-zoom-split"></i>
        </InputGroup>
    );
}

export default SearchInput;
