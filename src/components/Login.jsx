import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { loginRequest } from '../api/auth';
import Header from '../Layout/Header';

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const navigate = useNavigate();

    useEffect(() => {
        if (token && role) {
            if(role === "TEACHER"){
                navigate("/teacher");
            }else{
                navigate("/student");
            }
            return;
        }
    },[])

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password.trim()) {
            setError("Please enter valid email and password");
            return;
        }

        try {
            setLoading(true);
            const data = await loginRequest({ email, password });


            const { token, role, userId, name } = data;

            if (!token) {
                setError("Login failed: no token received");
                setLoading(false);
                return;
            }

            // Store in localStorage
            localStorage.setItem("token", token);
            if (role) localStorage.setItem("role", role);
            if (userId) localStorage.setItem("userId", userId);
            if (name) localStorage.setItem("name", name);

            // Role-based navigation
            if (role === "TEACHER") {
                navigate("/teacher");
            } else {
                navigate("/student");
            }
        } catch (err) {
            console.error(err);
            const msg = err?.response?.data?.message || err?.response?.data || err.message || "Login failed";
            setError(msg.toString());
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
                <Header/>
                <div className=' border-2 border-gray-300 p-10 flex flex-col gap-3 w-100 h-75 mx-auto mt-40 justify-center'>
                    <label className='block text-sm font-sm'>Email Address</label>
                    <input
                        type="email"
                        placeholder='  Email Address'
                        className='border-2 border-gray-300 rounded-sm p-1'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <label className='block text-sm font-normal'>Password</label>
                    <input
                        type="password"
                        placeholder='  Password'
                        className='border-2 border-gray-300  rounded-sm p-1'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button type='submit' className='bg-indigo-500 font-medium text-amber-50 mt-2 p-1.5 rounded-sm'>
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Login;
