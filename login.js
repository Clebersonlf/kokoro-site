import bcrypt from "bcryptjs";
import db from "./db.js"; // sua conexão com banco

async function login(email, senha) {
    const user = await db("usuarios").where({ email }).first();
    if (!user) throw new Error("Usuário não encontrado");

    const senhaConfere = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaConfere) throw new Error("Senha incorreta");

    return { id: user.id, nome: user.nome, role: user.role };
}
