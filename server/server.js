const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const registrarRotasLivros = require("./livros");
const registrarRotasProdutos = require("./produtos");
const registrarRotasPacientes = require("./pacientes");
const registrarRotasFilmes = require("./filmes");

const app = express();
const PORTA = 3000;
const caminhoBanco = path.join(__dirname, "database.sqlite");
const db = new sqlite3.Database(caminhoBanco);

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    mensagem: "Servidor de testes CRUD rodando.",
    rotas: ["/livros", "/produtos", "/pacientes", "/filmes"]
  });
});

// Cada arquivo de contexto cria sua tabela e registra as rotas.
registrarRotasLivros(app, db);
registrarRotasProdutos(app, db);
registrarRotasPacientes(app, db);
registrarRotasFilmes(app, db);

app.listen(PORTA, () => {
  console.log(`Servidor Express + SQLite ativo em http://localhost:${PORTA}`);
});

