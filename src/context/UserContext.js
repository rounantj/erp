
import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    React.useEffect(() => {
        console.log({ user })
    }, [user])

    React.useEffect(() => {
        const usr = localStorage.getItem("user")
        if (usr) {
            setUser(JSON.parse(usr))
        }
    }, [])



    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};
