import axios from 'axios';

const urlBase = 'http://localhost:3009'; // Substitua pelo seu URL base

export const makeRegister = async (email, password) => {
    const payload = {
        companyId: 1,
        username: email,
        password,
        role: "admin",
        email,
        name: ""
    };
    const headers = {
        "Content-Type": "application/json"
    };

    try {
        const register = await axios.post(`${urlBase}/auth/register`, payload, { headers });
        console.log({ register });
        return {
            success: true, data: register.data
        }
    } catch (error) {
        return {
            success: null, message: "Senha ou e-mail invalidos"
        }
    }
};

export const makeLogin = async (email, password) => {
    const payload = {
        companyId: 1,
        password, email
    };
    const headers = {
        "Content-Type": "application/json"
    };

    try {
        const login = await axios.post(`${urlBase}/auth/login`, payload, { headers });
        console.log({ login });
        return {
            success: true, data: login.data
        }
    } catch (error) {
        console.error('Error during registration:', error);
        return {
            success: null, message: "Senha ou e-mail invalidos"
        }
    }
};
