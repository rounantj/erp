// src/Login.js
import { makeRegister } from 'helpers/api-integrator';
import React, { useState, useContext } from 'react';

import 'react-notification-alert/dist/animate.css';
import { UserContext } from "context/UserContext";
import { makeLogin } from 'helpers/api-integrator';
import NotificationAlert from "react-notification-alert";
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [register, setRegister] = useState(false);
    const notificationAlertRef = React.useRef(null);
    const { user, setUser } = useContext(UserContext);
    const notify = (place, type, text) => {
        var color = Math.floor(Math.random() * 5 + 1);

        var options = {};
        options = {
            place: place,
            message: (
                <div>
                    <div>
                        {text}
                    </div>
                </div>
            ),
            type: type,
            icon: "nc-icon nc-bell-55",
            autoDismiss: 7,
        };
        notificationAlertRef.current.notificationAlert(options);
    };

    const handleEmailChange = (e) => setEmail(e.target.value);
    const handlePasswordChange = (e) => setPassword(e.target.value);
    const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const validatePassword = (password) => {
        // Minimum 8 characters, at least one letter and one number
        const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        return re.test(String(password));
    };

    const registerOrLogin = async () => {
        const user1 = register ? await makeRegister(email, password) : await makeLogin(email, password)
        console.log({ user1 })
        if (!user1.success) {
            notify("bc", "danger", user1.message)
        } else {
            notify("bc", "success", "Realizado com sucesso!")
            setUser(user1?.data)
            localStorage.setItem("user", JSON.stringify(user1?.data))
            window.location.replace("/")
        }

    }

    return (
        <>
            <div className="rna-container">
                <NotificationAlert ref={notificationAlertRef} />
            </div>
            <div className="container mt-5">

                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card">
                            <div className="card-body">
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }} className="logo-img">
                                    <img style={{ display: 'block', margin: "auto", textAlign: "center", maxWidth: "150px" }} src={require("assets/img/logo.png")} alt="logo" />
                                </div>
                                <h3 className="card-title text-center">{register ? 'Registre-se' : 'Faça Login'}</h3>
                                <div  >
                                    <div className="form-group">
                                        <label>E-mail</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="E-mail"
                                            value={email}
                                            onChange={handleEmailChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Senha</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Senha"
                                            value={password}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                        <small className="form-text text-muted">
                                            A senha precisa ter 8 caractéres e conter pelo menos uma letra maiúscula e um número.
                                        </small>
                                    </div>
                                    {register && (
                                        <div className="form-group">
                                            <label>Repetir Senha</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                placeholder="Repita a senha"
                                                value={confirmPassword}
                                                onChange={handleConfirmPasswordChange}
                                                required
                                            />
                                        </div>
                                    )}
                                    <button onClick={() => registerOrLogin()} className="btn btn-primary btn-block">
                                        {register ? 'Registrar' : 'Fazer Login'}
                                    </button>
                                </div>
                                <div className="text-center mt-3">
                                    <button
                                        className="btn btn-link"
                                        onClick={() => setRegister(!register)}
                                    >
                                        {register ? 'Já tem uma conta? Faça Login' : "Não tem uma conta? Registre-se"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>

    );
};

export default Login;
