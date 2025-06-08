import initDatabase from "../lib/db";


await initDatabase("postgresql://postgres:mypassword@localhost", "karina");