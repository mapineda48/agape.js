import { useState } from "react"
import { router } from "../router"
import { login } from "@agape/access";

export default function LoginPage() {
    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");
    return <div>
        <input value={user} type="text" onChange={({ currentTarget: { value } }) => setUser(value)} />
        <input value={password} type="password" onChange={({ currentTarget: { value } }) => setPassword(value)} />
        <button onClick={() => login(user, password).then(() => router.navigateTo("/cms")).catch(err => console.error(err))}>
            Ingresar
        </button>
    </div>
}