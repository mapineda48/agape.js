import { sayBar, sayHello } from "@agape/grettings"

export default function LoginPage() {
    return <div><button onClick={() => {
        sayBar("Miguel Pineda").then(msg => alert(msg)).catch(err => console.error(err))
    }}>Buscar</button></div>
}