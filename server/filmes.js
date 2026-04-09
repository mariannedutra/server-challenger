module.exports = function registrarRotasFilmes(app, db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS filmes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      diretor TEXT NOT NULL,
      ano INTEGER NOT NULL,
      nota REAL NOT NULL
    )
  `);

  app.get("/filmes", (_req, res) => {
    db.all("SELECT * FROM filmes ORDER BY id DESC", [], (erro, linhas) => {
      if (erro) return res.status(500).json({ error: erro.message });
      res.json(linhas);
    });
  });

  app.get("/filmes/:id", (req, res) => {
    db.get("SELECT * FROM filmes WHERE id = ?", [req.params.id], (erro, linha) => {
      if (erro) return res.status(500).json({ error: erro.message });
      if (!linha) return res.status(404).json({ error: "Filme nao encontrado." });
      res.json(linha);
    });
  });

  app.post("/filmes", (req, res) => {
    const { titulo, diretor, ano, nota } = req.body;

    if (!titulo || !diretor || ano === undefined || nota === undefined) {
      return res.status(400).json({ error: "Preencha titulo, diretor, ano e nota." });
    }

    const sql = "INSERT INTO filmes (titulo, diretor, ano, nota) VALUES (?, ?, ?, ?)";
    db.run(sql, [titulo, diretor, ano, nota], function (erro) {
      if (erro) return res.status(500).json({ error: erro.message });
      res.status(201).json({ id: this.lastID, titulo, diretor, ano, nota });
    });
  });

  app.put("/filmes/:id", (req, res) => {
    const { titulo, diretor, ano, nota } = req.body;

    if (!titulo || !diretor || ano === undefined || nota === undefined) {
      return res.status(400).json({ error: "Preencha titulo, diretor, ano e nota." });
    }

    const sql = "UPDATE filmes SET titulo = ?, diretor = ?, ano = ?, nota = ? WHERE id = ?";
    db.run(sql, [titulo, diretor, ano, nota, req.params.id], function (erro) {
      if (erro) return res.status(500).json({ error: erro.message });
      if (this.changes === 0) return res.status(404).json({ error: "Filme nao encontrado." });
      res.json({ id: Number(req.params.id), titulo, diretor, ano, nota });
    });
  });

  app.delete("/filmes/:id", (req, res) => {
    db.run("DELETE FROM filmes WHERE id = ?", [req.params.id], function (erro) {
      if (erro) return res.status(500).json({ error: erro.message });
      if (this.changes === 0) return res.status(404).json({ error: "Filme nao encontrado." });
      res.json({ message: "Filme excluido com sucesso." });
    });
  });
};

