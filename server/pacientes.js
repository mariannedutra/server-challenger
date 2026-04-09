module.exports = function registrarRotasPacientes(app, db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      idade INTEGER NOT NULL,
      diagnostico TEXT NOT NULL
    )
  `);

  app.get("/pacientes", (_req, res) => {
    db.all("SELECT * FROM pacientes ORDER BY id DESC", [], (erro, linhas) => {
      if (erro) return res.status(500).json({ error: erro.message });
      res.json(linhas);
    });
  });

  app.get("/pacientes/:id", (req, res) => {
    db.get("SELECT * FROM pacientes WHERE id = ?", [req.params.id], (erro, linha) => {
      if (erro) return res.status(500).json({ error: erro.message });
      if (!linha) return res.status(404).json({ error: "Paciente nao encontrado." });
      res.json(linha);
    });
  });

  app.post("/pacientes", (req, res) => {
    const { nome, idade, diagnostico } = req.body;

    if (!nome || idade === undefined || !diagnostico) {
      return res.status(400).json({ error: "Preencha nome, idade e diagnostico." });
    }

    const sql = "INSERT INTO pacientes (nome, idade, diagnostico) VALUES (?, ?, ?)";
    db.run(sql, [nome, idade, diagnostico], function (erro) {
      if (erro) return res.status(500).json({ error: erro.message });
      res.status(201).json({ id: this.lastID, nome, idade, diagnostico });
    });
  });

  app.put("/pacientes/:id", (req, res) => {
    const { nome, idade, diagnostico } = req.body;

    if (!nome || idade === undefined || !diagnostico) {
      return res.status(400).json({ error: "Preencha nome, idade e diagnostico." });
    }

    const sql = "UPDATE pacientes SET nome = ?, idade = ?, diagnostico = ? WHERE id = ?";
    db.run(sql, [nome, idade, diagnostico, req.params.id], function (erro) {
      if (erro) return res.status(500).json({ error: erro.message });
      if (this.changes === 0) return res.status(404).json({ error: "Paciente nao encontrado." });
      res.json({ id: Number(req.params.id), nome, idade, diagnostico });
    });
  });

  app.delete("/pacientes/:id", (req, res) => {
    db.run("DELETE FROM pacientes WHERE id = ?", [req.params.id], function (erro) {
      if (erro) return res.status(500).json({ error: erro.message });
      if (this.changes === 0) return res.status(404).json({ error: "Paciente nao encontrado." });
      res.json({ message: "Paciente excluido com sucesso." });
    });
  });
};

