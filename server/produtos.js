module.exports = function registrarRotasProdutos(app, db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      preco REAL NOT NULL,
      quantidade INTEGER NOT NULL
    )
  `);

  app.get("/produtos", (_req, res) => {
    db.all("SELECT * FROM produtos ORDER BY id DESC", [], (erro, linhas) => {
      if (erro) return res.status(500).json({ error: erro.message });
      res.json(linhas);
    });
  });

  app.get("/produtos/:id", (req, res) => {
    db.get("SELECT * FROM produtos WHERE id = ?", [req.params.id], (erro, linha) => {
      if (erro) return res.status(500).json({ error: erro.message });
      if (!linha) return res.status(404).json({ error: "Produto nao encontrado." });
      res.json(linha);
    });
  });

  app.post("/produtos", (req, res) => {
    const { nome, preco, quantidade } = req.body;

    if (!nome || preco === undefined || quantidade === undefined) {
      return res.status(400).json({ error: "Preencha nome, preco e quantidade." });
    }

    const sql = "INSERT INTO produtos (nome, preco, quantidade) VALUES (?, ?, ?)";
    db.run(sql, [nome, preco, quantidade], function (erro) {
      if (erro) return res.status(500).json({ error: erro.message });
      res.status(201).json({ id: this.lastID, nome, preco, quantidade });
    });
  });

  app.put("/produtos/:id", (req, res) => {
    const { nome, preco, quantidade } = req.body;

    if (!nome || preco === undefined || quantidade === undefined) {
      return res.status(400).json({ error: "Preencha nome, preco e quantidade." });
    }

    const sql = "UPDATE produtos SET nome = ?, preco = ?, quantidade = ? WHERE id = ?";
    db.run(sql, [nome, preco, quantidade, req.params.id], function (erro) {
      if (erro) return res.status(500).json({ error: erro.message });
      if (this.changes === 0) return res.status(404).json({ error: "Produto nao encontrado." });
      res.json({ id: Number(req.params.id), nome, preco, quantidade });
    });
  });

  app.delete("/produtos/:id", (req, res) => {
    db.run("DELETE FROM produtos WHERE id = ?", [req.params.id], function (erro) {
      if (erro) return res.status(500).json({ error: erro.message });
      if (this.changes === 0) return res.status(404).json({ error: "Produto nao encontrado." });
      res.json({ message: "Produto excluido com sucesso." });
    });
  });
};

