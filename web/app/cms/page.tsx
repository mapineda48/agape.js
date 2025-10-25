import { logout } from "@agape/access"
import { router } from "../router"

export default function LoginPage() {
    return <>
        <button onClick={() => router.navigateTo("/login")}>
            Login
        </button>
        <button onClick={() => {
            logout().then(() => {
                router.navigateTo("/")
            })
        }}>
            Logout
        </button></>
}
