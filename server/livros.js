module.exports = function registrarRotasLivros(app, db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS livros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      autor TEXT NOT NULL,
      descricao TEXT NOT NULL,
      num_paginas INTEGER NOT NULL
    )
  `);

  app.get("/livros", (_req, res) => {
    db.all("SELECT * FROM livros ORDER BY id DESC", [], (erro, linhas) => {
      if (erro) return res.status(500).json({ error: erro.message });
      res.json(linhas);
    });
  });

  app.get("/livros/:id", (req, res) => {
    db.get("SELECT * FROM livros WHERE id = ?", [req.params.id], (erro, linha) => {
      if (erro) return res.status(500).json({ error: erro.message });
      if (!linha) return res.status(404).json({ error: "Livro nao encontrado." });
      res.json(linha);
    });
  });

  app.post("/livros", (req, res) => {
    const { titulo, autor, descricao, num_paginas } = req.body;

    if (!titulo || !autor || !descricao || num_paginas === undefined) {
      return res.status(400).json({ error: "Preencha titulo, autor, descricao e num_paginas." });
    }

    const sql = "INSERT INTO livros (titulo, autor, descricao, num_paginas) VALUES (?, ?, ?, ?)";
    db.run(sql, [titulo, autor, descricao, num_paginas], function (erro) {
      if (erro) return res.status(500).json({ error: erro.message });
      res.status(201).json({
        id: this.lastID,
        titulo,
        autor,
        descricao,
        num_paginas
      });
    });
  });

  app.put("/livros/:id", (req, res) => {
    const { titulo, autor, descricao, num_paginas } = req.body;

    if (!titulo || !autor || !descricao || num_paginas === undefined) {
      return res.status(400).json({ error: "Preencha titulo, autor, descricao e num_paginas." });
    }

    const sql =
      "UPDATE livros SET titulo = ?, autor = ?, descricao = ?, num_paginas = ? WHERE id = ?";
    db.run(sql, [titulo, autor, descricao, num_paginas, req.params.id], function (erro) {
      if (erro) return res.status(500).json({ error: erro.message });
      if (this.changes === 0) return res.status(404).json({ error: "Livro nao encontrado." });
      res.json({ id: Number(req.params.id), titulo, autor, descricao, num_paginas });
    });
  });

  app.delete("/livros/:id", (req, res) => {
    db.run("DELETE FROM livros WHERE id = ?", [req.params.id], function (erro) {
      if (erro) return res.status(500).json({ error: erro.message });
      if (this.changes === 0) return res.status(404).json({ error: "Livro nao encontrado." });
      res.json({ message: "Livro excluido com sucesso." });
    });
  });
};

