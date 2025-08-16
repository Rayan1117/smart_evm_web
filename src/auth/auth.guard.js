import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom"

const isAuthenticated = () => {
    const token = localStorage.getItem("evm.token")

    console.log(token);

    if (!token) {
        return new Promise(res => res(false))
    }


    return fetch("http://localhost:5000/verification/verify-token",
        {
            method: "POST",
            body: JSON.stringify({
                "token": token
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }
    ).then(res => {
        console.log(res.status);
        if (res.status === 200) {
            return true
        }
        return false
    }).catch(err => {
        throw err
    })
}

export default function AuthGuard({ children }) {
    const [authState, setAuthState] = useState({
        loading: true,
        isAuthenticated: false,
        isError: false
    });

    useEffect(() => {
        isAuthenticated().then((result) => {

            setAuthState({
                loading: false,
                isAuthenticated: result,
                isError: false
            });
        }).catch(err => {
            console.log(err);

            setAuthState({
                loading: false,
                isAuthenticated: false,
                isError: err.message
            })
        });
    }, []);

    if (authState.loading) {
        return <div>Loading...</div>;
    }

    if (authState.isError) {
        return <div className="text-red-600">{authState.isError}</div>
    }

    return authState.isAuthenticated ? children : <Navigate to="/login" />;
}