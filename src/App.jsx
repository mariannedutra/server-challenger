import { useEffect, useMemo, useState } from "react";
import "./App.css";

// Contextos fixos da atividade.
const CONTEXTOS = [
  {
    id: "biblioteca",
    nome: "Biblioteca",
    icone: "📚",
    entidade: "Livro",
    rotaBase: "/livros",
    dica: "Crie uma tabela 'livros' com os campos abaixo. Todas as rotas partem de /livros.",
    campos: [
      { nome: "id", tipo: "number", auto: true },
      { nome: "titulo", tipo: "string" },
      { nome: "autor", tipo: "string" },
      { nome: "descricao", tipo: "string" },
      { nome: "num_paginas", tipo: "number" }
    ]
  },
  {
    id: "loja",
    nome: "Loja de Produtos",
    icone: "🛒",
    entidade: "Produto",
    rotaBase: "/produtos",
    dica: "Crie uma tabela 'produtos'. O campo preco deve aceitar decimais (REAL no SQLite).",
    campos: [
      { nome: "id", tipo: "number", auto: true },
      { nome: "nome", tipo: "string" },
      { nome: "preco", tipo: "number" },
      { nome: "quantidade", tipo: "number" }
    ]
  },
  {
    id: "clinica",
    nome: "Clínica",
    icone: "🏥",
    entidade: "Paciente",
    rotaBase: "/pacientes",
    dica: "Crie uma tabela 'pacientes'. O campo diagnostico pode ser um TEXT livre.",
    campos: [
      { nome: "id", tipo: "number", auto: true },
      { nome: "nome", tipo: "string" },
      { nome: "idade", tipo: "number" },
      { nome: "diagnostico", tipo: "string" }
    ]
  },
  {
    id: "filmes",
    nome: "Coleção de Filmes",
    icone: "🎬",
    entidade: "Filme",
    rotaBase: "/filmes",
    dica: "Crie uma tabela 'filmes'. O campo nota pode ser um valor decimal de 0 a 10.",
    campos: [
      { nome: "id", tipo: "number", auto: true },
      { nome: "titulo", tipo: "string" },
      { nome: "diretor", tipo: "string" },
      { nome: "ano", tipo: "number" },
      { nome: "nota", tipo: "number" }
    ]
  }
];

const DESAFIOS = [
  { id: "create",   titulo: "Cadastrar",    metodo: "POST", cor: "#16a34a" },
  { id: "readAll",  titulo: "Buscar todos", metodo: "GET",  cor: "#2563eb" },
  { id: "readById", titulo: "Buscar por ID",metodo: "GET",  cor: "#2563eb" },
  { id: "update",   titulo: "Editar",       metodo: "PUT",  cor: "#d97706" },
  { id: "delete",   titulo: "Excluir",      metodo: "DEL",  cor: "#dc2626" }
];

// ─── Helpers ────────────────────────────────────────────────

function normalizarBaseUrl(url) {
  return url.trim().replace(/\/+$/, "");
}

function inicializarFormulario(campos) {
  const estadoInicial = {};
  campos.forEach((campo) => {
    if (!campo.auto) estadoInicial[campo.nome] = "";
  });
  return estadoInicial;
}

function placeholderCampo(campo) {
  if (campo.tipo === "number") {
    return campo.nome === "preco" || campo.nome === "nota" ? "Ex: 9.5" : "Ex: 10";
  }
  return `Digite ${campo.nome}`;
}

// ─── DicaToggle ─────────────────────────────────────────────

function DicaToggle({ titulo, children }) {
  const [aberta, setAberta] = useState(false);
  return (
    <div className="dica-wrapper">
      <button
        type="button"
        className="dica-toggle"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
      >
        <span className="dica-icon">💡</span>
        {titulo}
        <span className={`dica-chevron${aberta ? " aberta" : ""}`}>▼</span>
      </button>
      {aberta && <div className="dica-content">{children}</div>}
    </div>
  );
}

// ─── App ────────────────────────────────────────────────────

function App() {
  const [contextoId, setContextoId] = useState(CONTEXTOS[0].id);
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000");
  const [formCriar, setFormCriar] = useState({});
  const [formEditar, setFormEditar] = useState({});
  const [itemEditandoId, setItemEditandoId] = useState(null);
  const [idBusca, setIdBusca] = useState("");
  const [resultadoBusca, setResultadoBusca] = useState(null);
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [feedback, setFeedback] = useState({
    tipo: "info",
    mensagem: "Escolha um contexto e informe a URL do seu backend."
  });
  const [progressoPorContexto, setProgressoPorContexto] = useState(() =>
    CONTEXTOS.reduce((acc, contexto) => {
      acc[contexto.id] = {
        create: false,
        readAll: false,
        readById: false,
        update: false,
        delete: false
      };
      return acc;
    }, {})
  );

  const contextoAtual = useMemo(
    () => CONTEXTOS.find((c) => c.id === contextoId) ?? CONTEXTOS[0],
    [contextoId]
  );

  const camposEditaveis = useMemo(
    () => contextoAtual.campos.filter((campo) => !campo.auto),
    [contextoAtual]
  );

  const endpointBase = useMemo(
    () => `${normalizarBaseUrl(baseUrl)}${contextoAtual.rotaBase}`,
    [baseUrl, contextoAtual.rotaBase]
  );

  const progressoAtual = progressoPorContexto[contextoAtual.id] ?? {
    create: false,
    readAll: false,
    readById: false,
    update: false,
    delete: false
  };

  const desafiosConcluidos = Object.values(progressoAtual).filter(Boolean).length;
  const percentualProgresso = Math.round((desafiosConcluidos / DESAFIOS.length) * 100);

  useEffect(() => {
    setFormCriar(inicializarFormulario(contextoAtual.campos));
    setFormEditar({});
    setItemEditandoId(null);
    setItens([]);
    setResultadoBusca(null);
    setIdBusca("");
    setFeedback({
      tipo: "info",
      mensagem: `Contexto "${contextoAtual.nome}" selecionado. Configure sua URL e teste as rotas.`
    });
  }, [contextoAtual]);

  // ── Backend connection (não alterar) ──────────────────────

  async function requisicao(url, opcoes = {}) {
    try {
      const resposta = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...opcoes
      });

      const texto = await resposta.text();
      let dados = null;
      if (texto) {
        try {
          dados = JSON.parse(texto);
        } catch {
          dados = texto;
        }
      }

      if (!resposta.ok) {
        const mensagemErro =
          typeof dados === "object" && dados?.error
            ? dados.error
            : typeof dados === "string" && dados
              ? dados
              : `Erro HTTP ${resposta.status}`;
        throw new Error(mensagemErro);
      }

      return dados;
    } catch (erro) {
      if (erro instanceof TypeError) {
        throw new Error(
          "Falha de conexão. Verifique se o servidor está rodando e com CORS habilitado."
        );
      }
      throw erro;
    }
  }

  function formatarValorParaEnvio(nomeCampo, valorBruto) {
    const campo = camposEditaveis.find((c) => c.nome === nomeCampo);
    if (!campo) return valorBruto;
    if (campo.tipo === "number") {
      const numero = Number(valorBruto);
      return Number.isNaN(numero) ? valorBruto : numero;
    }
    return valorBruto;
  }

  async function buscarTodos() {
    setCarregando(true);
    setResultadoBusca(null);
    try {
      const dados = await requisicao(endpointBase, { method: "GET" });
      const lista = Array.isArray(dados) ? dados : [];
      setItens(lista);
      setFeedback({
        tipo: "sucesso",
        mensagem: `Busca concluída com sucesso. ${lista.length} item(ns) encontrado(s).`
      });
      marcarDesafioComoConcluido("readAll");
    } catch (erro) {
      setFeedback({ tipo: "erro", mensagem: `Erro ao buscar todos: ${erro.message}` });
    } finally {
      setCarregando(false);
    }
  }

  async function cadastrar(evento) {
    evento.preventDefault();

    const payload = {};
    camposEditaveis.forEach((campo) => {
      payload[campo.nome] = formatarValorParaEnvio(campo.nome, formCriar[campo.nome] ?? "");
    });

    setCarregando(true);
    try {
      await requisicao(endpointBase, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setFeedback({ tipo: "sucesso", mensagem: "Cadastro realizado com sucesso." });
      marcarDesafioComoConcluido("create");
      setFormCriar(inicializarFormulario(contextoAtual.campos));
      await buscarTodos();
    } catch (erro) {
      setFeedback({ tipo: "erro", mensagem: `Erro ao cadastrar: ${erro.message}` });
    } finally {
      setCarregando(false);
    }
  }

  function iniciarEdicao(item) {
    setItemEditandoId(item.id);
    const novoForm = {};
    camposEditaveis.forEach((campo) => {
      novoForm[campo.nome] = item[campo.nome] ?? "";
    });
    setFormEditar(novoForm);
  }

  async function salvarEdicao(id) {
    const payload = {};
    camposEditaveis.forEach((campo) => {
      payload[campo.nome] = formatarValorParaEnvio(campo.nome, formEditar[campo.nome] ?? "");
    });

    setCarregando(true);
    try {
      await requisicao(`${endpointBase}/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setFeedback({ tipo: "sucesso", mensagem: `Registro ${id} atualizado com sucesso.` });
      marcarDesafioComoConcluido("update");
      setItemEditandoId(null);
      setFormEditar({});
      await buscarTodos();
    } catch (erro) {
      setFeedback({ tipo: "erro", mensagem: `Erro ao editar: ${erro.message}` });
    } finally {
      setCarregando(false);
    }
  }

  async function excluir(id) {
    setCarregando(true);
    try {
      await requisicao(`${endpointBase}/${id}`, { method: "DELETE" });
      setFeedback({ tipo: "sucesso", mensagem: `Registro ${id} removido com sucesso.` });
      marcarDesafioComoConcluido("delete");
      await buscarTodos();
    } catch (erro) {
      setFeedback({ tipo: "erro", mensagem: `Erro ao excluir: ${erro.message}` });
    } finally {
      setCarregando(false);
    }
  }

  async function buscarPorId(evento) {
    evento.preventDefault();
    if (!idBusca.trim()) {
      setFeedback({ tipo: "erro", mensagem: "Informe um ID para buscar." });
      return;
    }

    setCarregando(true);
    try {
      const dado = await requisicao(`${endpointBase}/${idBusca.trim()}`, { method: "GET" });
      setResultadoBusca(dado);
      setFeedback({ tipo: "sucesso", mensagem: `Registro ${idBusca.trim()} encontrado.` });
      marcarDesafioComoConcluido("readById");
    } catch (erro) {
      setResultadoBusca(null);
      setFeedback({ tipo: "erro", mensagem: `Erro ao buscar por ID: ${erro.message}` });
    } finally {
      setCarregando(false);
    }
  }

  function marcarDesafioComoConcluido(desafioId) {
    setProgressoPorContexto((estadoAtual) => ({
      ...estadoAtual,
      [contextoAtual.id]: {
        ...estadoAtual[contextoAtual.id],
        [desafioId]: true
      }
    }));
  }

  function reiniciarMissaoDoContexto() {
    setProgressoPorContexto((estadoAtual) => ({
      ...estadoAtual,
      [contextoAtual.id]: {
        create: false,
        readAll: false,
        readById: false,
        update: false,
        delete: false
      }
    }));
    setFeedback({
      tipo: "info",
      mensagem: `Missão de "${contextoAtual.nome}" reiniciada. Bora testar novamente!`
    });
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="app">

      {/* ── Hero ── */}
      <header className="hero">
        <div className="hero-content">
          <span className="hero-badge">Laboratório prático de APIs REST</span>
          <h1 className="hero-titulo">
            CRUD Tester <span className="hero-highlight">Pedagógico</span>
          </h1>
          <p className="hero-subtitulo">
            Escolha um contexto, inicie seu servidor e teste suas rotas REST de forma visual.
          </p>
          <div className="steps-row">
            <div className="step-chip"><span className="step-num">1</span>Escolha o contexto</div>
            <span className="step-arrow">→</span>
            <div className="step-chip"><span className="step-num">2</span>Configure a URL</div>
            <span className="step-arrow">→</span>
            <div className="step-chip"><span className="step-num">3</span>Teste o CRUD completo</div>
          </div>
        </div>
      </header>

      <main className="main-content">

        {/* ── Missão / Progresso ── */}
        <section className="card mission-card">
          <div className="mission-header">
            <div>
              <h2 className="section-title">
                {contextoAtual.icone} Missão: {contextoAtual.nome}
              </h2>
              <p className="muted-text">Complete as 5 operações para finalizar o desafio.</p>
            </div>
            <div className="mission-right">
              <span className={`badge-progresso${percentualProgresso === 100 ? " completo" : ""}`}>
                {percentualProgresso === 100 ? "✓ Concluído!" : `${percentualProgresso}%`}
              </span>
              <button type="button" className="btn-reiniciar" onClick={reiniciarMissaoDoContexto}>
                Reiniciar
              </button>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${percentualProgresso}%` }} />
          </div>
          <div className="desafios-grid">
            {DESAFIOS.map((desafio) => {
              const concluido = progressoAtual[desafio.id];
              return (
                <div key={desafio.id} className={`desafio-chip${concluido ? " concluido" : ""}`}>
                  <span className="desafio-metodo" style={{ backgroundColor: desafio.cor }}>
                    {desafio.metodo}
                  </span>
                  <span className="desafio-titulo">{desafio.titulo}</span>
                  {concluido && <span className="desafio-check">✓</span>}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Configuração ── */}
        <section className="card config-card">
          <div className="config-grid">

            {/* Contexto */}
            <div className="config-group">
              <div className="field-label">
                <span className="label-tag">Contexto</span>
                Tema do servidor
              </div>
              <div className="context-selector">
                {CONTEXTOS.map((ctx) => (
                  <button
                    key={ctx.id}
                    type="button"
                    className={`context-btn${contextoId === ctx.id ? " ativo" : ""}`}
                    onClick={() => setContextoId(ctx.id)}
                  >
                    <span className="ctx-icon">{ctx.icone}</span>
                    <span className="ctx-nome">{ctx.nome}</span>
                  </button>
                ))}
              </div>
              <DicaToggle titulo="Ver campos e rotas esperados">
                <p><strong>Entidade:</strong> {contextoAtual.entidade}</p>
                <p><strong>Rota base:</strong> <code>{contextoAtual.rotaBase}</code></p>
                <p className="dica-texto">{contextoAtual.dica}</p>
                <strong>Campos:</strong>
                <ul className="campos-lista">
                  {contextoAtual.campos.map((campo) => (
                    <li key={campo.nome}>
                      <code>{campo.nome}</code>
                      <span className="campo-tipo">
                        {campo.tipo}{campo.auto ? " · auto" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="hint-text">
                  O campo <code>id</code> é gerado automaticamente no backend.
                </p>
              </DicaToggle>
            </div>

            {/* URL */}
            <div className="config-group">
              <label className="field-label" htmlFor="base-url">
                <span className="label-tag">URL</span>
                Endereço do servidor
              </label>
              <input
                id="base-url"
                className="text-input"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:3000"
              />
              <p className="endpoint-display">
                <span className="endpoint-label">Endpoint:</span>
                <code className="endpoint-value">{endpointBase}</code>
              </p>
              <DicaToggle titulo="Ajuda: CORS e exemplos de rotas">
                <p><strong>Listar todos:</strong> <code>GET {endpointBase}</code></p>
                <p><strong>Buscar por ID:</strong> <code>GET {endpointBase}/1</code></p>
                <p><strong>Criar:</strong> <code>POST {endpointBase}</code></p>
                <p><strong>Editar:</strong> <code>PUT {endpointBase}/1</code></p>
                <p><strong>Excluir:</strong> <code>DELETE {endpointBase}/1</code></p>
                <p style={{ marginTop: 10 }}>
                  Se aparecer erro de bloqueio no navegador, habilite CORS no Express:
                </p>
                <pre className="code-block">
{`npm install cors

const cors = require('cors');
app.use(cors());`}
                </pre>
              </DicaToggle>
            </div>

          </div>
        </section>

        {/* ── Feedback ── */}
        <div className={`feedback-bar feedback-${feedback.tipo}`}>
          <span className="feedback-icon">
            {feedback.tipo === "sucesso" ? "✓" : feedback.tipo === "erro" ? "✗" : "i"}
          </span>
          <span className="feedback-msg">{feedback.mensagem}</span>
          {carregando && <span className="feedback-loading">Aguardando servidor...</span>}
        </div>

        {/* ── Operações CRUD ── */}
        <section className="card">
          <h2 className="section-title" style={{ marginBottom: 16 }}>Operações CRUD</h2>

          {/* POST – Cadastrar */}
          <div className="crud-block crud-block-post">
            <div className="crud-header">
              <span className="method-badge method-post">POST</span>
              <h3 className="crud-title">Cadastrar {contextoAtual.entidade}</h3>
            </div>
            <form onSubmit={cadastrar} className="crud-form">
              <div className="form-fields">
                {camposEditaveis.map((campo) => (
                  <label key={campo.nome} className="field-label">
                    {campo.nome}
                    <input
                      className="text-input"
                      type={campo.tipo === "number" ? "number" : "text"}
                      step={campo.nome === "preco" || campo.nome === "nota" ? "0.01" : undefined}
                      value={formCriar[campo.nome] ?? ""}
                      placeholder={placeholderCampo(campo)}
                      onChange={(e) =>
                        setFormCriar((estado) => ({ ...estado, [campo.nome]: e.target.value }))
                      }
                    />
                  </label>
                ))}
              </div>
              <button type="submit" disabled={carregando} className="btn btn-post">
                Cadastrar
              </button>
            </form>
          </div>

          {/* GET – Buscar todos */}
          <div className="crud-block crud-block-get">
            <div className="crud-header">
              <span className="method-badge method-get">GET</span>
              <h3 className="crud-title">Buscar todos</h3>
              <div className="list-meta">
                {itens.length > 0 && (
                  <span className="count-badge">{itens.length} registro(s)</span>
                )}
                <button
                  type="button"
                  disabled={carregando}
                  onClick={buscarTodos}
                  className="btn btn-get"
                >
                  Buscar todos
                </button>
              </div>
            </div>
          </div>

          {/* GET – Buscar por ID */}
          <div className="crud-block crud-block-getid">
            <div className="crud-header">
              <span className="method-badge method-get">GET</span>
              <h3 className="crud-title">Buscar por ID</h3>
            </div>
            <form onSubmit={buscarPorId} className="crud-form crud-inline">
              <input
                className="text-input"
                value={idBusca}
                onChange={(e) => setIdBusca(e.target.value)}
                placeholder="Ex: 1"
              />
              <button type="submit" disabled={carregando} className="btn btn-get">
                Buscar
              </button>
            </form>
            {resultadoBusca && (
              <pre className="code-block resultado">{JSON.stringify(resultadoBusca, null, 2)}</pre>
            )}
          </div>

          {/* Lista de registros + PUT/DELETE inline */}
          {itens.length === 0 ? (
            <div className="empty-state">
              Nenhum registro carregado. Clique em <strong>Buscar todos</strong> para atualizar.
            </div>
          ) : (
            <div className="records-list">
              {itens.map((item) => (
                <div key={item.id ?? JSON.stringify(item)} className="record-card">
                  <div className="record-header">
                    <span className="record-id">ID {item.id ?? "?"}</span>
                    <div className="record-actions">
                      <button
                        type="button"
                        className="btn btn-put btn-sm"
                        onClick={() => iniciarEdicao(item)}
                      >
                        <span className="method-badge method-put" style={{ marginRight: 4 }}>PUT</span>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-delete btn-sm"
                        onClick={() => excluir(item.id)}
                      >
                        <span className="method-badge method-delete" style={{ marginRight: 4, color: "white", background: "rgba(255,255,255,.25)", border: "none" }}>DEL</span>
                        Excluir
                      </button>
                    </div>
                  </div>

                  {itemEditandoId === item.id ? (
                    <div className="edit-area">
                      <div className="form-fields">
                        {camposEditaveis.map((campo) => (
                          <label key={campo.nome} className="field-label">
                            {campo.nome}
                            <input
                              className="text-input"
                              type={campo.tipo === "number" ? "number" : "text"}
                              step={
                                campo.nome === "preco" || campo.nome === "nota"
                                  ? "0.01"
                                  : undefined
                              }
                              value={formEditar[campo.nome] ?? ""}
                              placeholder={placeholderCampo(campo)}
                              onChange={(e) =>
                                setFormEditar((estado) => ({
                                  ...estado,
                                  [campo.nome]: e.target.value
                                }))
                              }
                            />
                          </label>
                        ))}
                      </div>
                      <div className="edit-actions">
                        <button
                          type="button"
                          className="btn btn-put"
                          onClick={() => salvarEdicao(item.id)}
                        >
                          Salvar edição
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setItemEditandoId(null);
                            setFormEditar({});
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <pre className="code-block">{JSON.stringify(item, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <footer className="footer">
        CRUD Tester Pedagógico · Laboratório de APIs REST
      </footer>

    </div>
  );
}

export default App;
