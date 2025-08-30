import bcrypt from "bcryptjs";

const senha = "Semprekokoro@#$";   // a sua senha
const saltRounds = 12;

const hash = await bcrypt.hash(senha, saltRounds);
console.log("HASH:", hash);