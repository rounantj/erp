import axios from 'axios';

const urlBase = 'http://localhost:3009';

axios.interceptors.request.use(
    (config) => {
        console.log({ config })
        if (config.url.includes(urlBase)) {
            const token = localStorage.getItem('api_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

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
        localStorage.setItem('api_token', register.data.access_token)
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
        localStorage.setItem('api_token', login.data.access_token)
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

export const getProducts = async () => {
    const headers = {
        "Content-Type": "application/json"
    };

    try {
        const products = await axios.get(`${urlBase}/produtos`, { headers });
        return {
            success: true, data: products.data
        }
    } catch (error) {
        console.error('Error during get products:', error);
        return {
            success: null, message: "Erro ao buscar produtos"
        }
    }
};


