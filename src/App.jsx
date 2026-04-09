import { useEffect, useMemo, useState } from "react";

// Contextos fixos da atividade.
const CONTEXTOS = [
  {
    id: "biblioteca",
    nome: "Biblioteca",
    entidade: "Livro",
    rotaBase: "/livros",
    dica: "Crie uma tabela 'livros' com os campos acima. Todas as rotas partem de /livros.",
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

const cores = {
  fundo: "#dbeafe",
  fundoGradiente: "linear-gradient(180deg, #dbeafe 0%, #e0f2fe 40%, #ecfeff 100%)",
  card: "#f8fbff",
  texto: "#1f2937",
  borda: "#bfd4f6",
  azul: "#2563eb",
  azulEscuro: "#1d4ed8",
  azulClaro: "#bfdbfe",
  verde: "#166534",
  verdeClaro: "#dcfce7",
  amarelo: "#b45309",
  amareloClaro: "#fef3c7",
  vermelho: "#b91c1c",
  vermelhoClaro: "#fee2e2",
  cinza: "#6b7280",
  sombra: "0 10px 30px rgba(30, 64, 175, 0.12)"
};

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

const DESAFIOS = [
  { id: "create", titulo: "Cadastrar", descricao: "Envie um POST com sucesso." },
  { id: "readAll", titulo: "Buscar todos", descricao: "Liste todos os registros." },
  { id: "readById", titulo: "Buscar por ID", descricao: "Encontre um registro especifico." },
  { id: "update", titulo: "Editar", descricao: "Atualize um registro com PUT." },
  { id: "delete", titulo: "Excluir", descricao: "Remova um registro com DELETE." }
];

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
      // Mensagem amigável para erro de rede/CORS sem quebrar a tela.
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
      mensagem: `Missao de "${contextoAtual.nome}" reiniciada. Bora testar novamente!`
    });
  }

  return (
    <div style={{ ...estilos.page, background: cores.fundoGradiente, color: cores.texto }}>
      <div style={estilos.container}>
        <section style={estilos.hero}>
          <p style={estilos.heroBadge}>Laboratório prático de APIs REST</p>
          <h1 style={estilos.titulo}>CRUD Tester Pedagógico</h1>
          <p style={estilos.subtitulo}>
            Use esta interface para validar as rotas REST do seu servidor local de forma visual e
            guiada.
          </p>
          <div style={estilos.stepsRow}>
            <span style={estilos.stepChip}>1. Escolha um contexto</span>
            <span style={estilos.stepChip}>2. Configure sua URL</span>
            <span style={estilos.stepChip}>3. Teste CRUD completo</span>
          </div>
        </section>

        <section style={{ ...estilos.card, ...estilos.gamificacaoCard }}>
          <div style={estilos.gamificacaoHeader}>
            <h2 style={estilos.sectionTitle}>Missao do contexto: {contextoAtual.nome}</h2>
            <span style={estilos.badgeNivel}>
              {percentualProgresso === 100 ? "Concluido!" : `Progresso ${percentualProgresso}%`}
            </span>
          </div>
          <p style={estilos.miniHint}>
            Complete as 5 operacoes para finalizar o desafio deste contexto.
          </p>
          <div style={estilos.progressBarTrack}>
            <div
              style={{
                ...estilos.progressBarFill,
                width: `${percentualProgresso}%`
              }}
            />
          </div>
          <div style={estilos.gamificacaoActions}>
            <button type="button" style={estilos.botaoReiniciar} onClick={reiniciarMissaoDoContexto}>
              Reiniciar missao deste contexto
            </button>
            <p style={estilos.miniHint}>
              Use quando quiser repetir o desafio com os alunos desde o inicio.
            </p>
          </div>
          <div style={estilos.desafiosGrid}>
            {DESAFIOS.map((desafio) => {
              const concluido = progressoAtual[desafio.id];
              return (
                <div
                  key={desafio.id}
                  style={{
                    ...estilos.desafioCard,
                    ...(concluido ? estilos.desafioCardConcluido : {})
                  }}
                >
                  <p style={estilos.desafioTitulo}>
                    {concluido ? "✅" : "⬜"} {desafio.titulo}
                  </p>
                  <p style={estilos.desafioDescricao}>{desafio.descricao}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section style={estilos.card}>
          <h2 style={estilos.sectionTitle}>1) Contexto</h2>
          <label style={estilos.label}>
            Selecione o contexto:
            <select
              style={estilos.input}
              value={contextoId}
              onChange={(e) => setContextoId(e.target.value)}
            >
              {CONTEXTOS.map((contexto) => (
                <option key={contexto.id} value={contexto.id}>
                  {contexto.nome}
                </option>
              ))}
            </select>
          </label>

          <div style={estilos.infoBox}>
            <p>
              <strong>Entidade:</strong> {contextoAtual.entidade}
            </p>
            <p>
              <strong>Rota base sugerida:</strong> <code>{contextoAtual.rotaBase}</code>
            </p>
            <p>
              <strong>Dica:</strong> {contextoAtual.dica}
            </p>
            <div>
              <strong>Campos:</strong>
              <ul>
                {contextoAtual.campos.map((campo) => (
                  <li key={campo.nome}>
                    {campo.nome} ({campo.tipo}
                    {campo.auto ? ", auto" : ""})
                  </li>
                ))}
              </ul>
            </div>
            <p style={estilos.miniHint}>
              Dica: o campo <code>id</code> geralmente e gerado automaticamente no backend.
            </p>
          </div>
        </section>

        <section style={estilos.card}>
          <h2 style={estilos.sectionTitle}>2) URL do servidor</h2>
          <label style={estilos.label}>
            Base URL (ex: http://localhost:3000):
            <input
              style={estilos.input}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:3000"
            />
          </label>
          <p style={estilos.endpoint}>
            Endpoint atual: <code>{endpointBase}</code>
          </p>
          <p style={estilos.miniHint}>
            Exemplo de rota final: <code>{endpointBase}/1</code> para buscar, editar ou excluir por
            ID.
          </p>
        </section>

        <section style={{ ...estilos.card, ...estilos.corsBox }}>
          <h2 style={estilos.sectionTitle}>Aviso sobre CORS</h2>
          <p>
            Se aparecer erro de bloqueio no navegador, habilite CORS no seu servidor Express:
          </p>
          <pre style={estilos.pre}>
            npm install cors{"\n\n"}
            const cors = require('cors');{"\n"}
            app.use(cors());
          </pre>
        </section>

        <section
          style={{
            ...estilos.card,
            ...(feedback.tipo === "sucesso"
              ? { backgroundColor: cores.verdeClaro, borderColor: cores.verde }
              : feedback.tipo === "erro"
                ? { backgroundColor: cores.vermelhoClaro, borderColor: cores.vermelho }
                : {})
          }}
        >
          <p style={estilos.statusTitle}>Status da operacao</p>
          <strong
            style={{
              color:
                feedback.tipo === "sucesso"
                  ? cores.verde
                  : feedback.tipo === "erro"
                    ? cores.vermelho
                    : cores.texto
            }}
          >
            {feedback.mensagem}
          </strong>
          {carregando && <p style={estilos.loadingText}>Aguarde... comunicando com o servidor.</p>}
        </section>

        <section style={estilos.card}>
          <h2 style={estilos.sectionTitle}>3) Operações CRUD</h2>

          <form onSubmit={cadastrar} style={estilos.form}>
            <h3 style={estilos.formTitle}>Cadastrar ({contextoAtual.entidade})</h3>
            <p style={estilos.miniHint}>Preencha os campos e clique em Cadastrar.</p>
            {camposEditaveis.map((campo) => (
              <label key={campo.nome} style={estilos.label}>
                {campo.nome} ({campo.tipo}):
                <input
                  style={estilos.input}
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
            <button type="submit" disabled={carregando} style={estilos.botaoPrimario}>
              Cadastrar
            </button>
          </form>

          <div style={estilos.actionsRow}>
            <button type="button" disabled={carregando} onClick={buscarTodos} style={estilos.botaoSecundario}>
              Buscar todos
            </button>
          </div>

          <form onSubmit={buscarPorId} style={estilos.buscarForm}>
            <h3 style={estilos.formTitle}>Buscar por ID (opcional)</h3>
            <label style={estilos.label}>
              Buscar por ID:
              <input
                style={estilos.input}
                value={idBusca}
                onChange={(e) => setIdBusca(e.target.value)}
                placeholder="Ex: 1"
              />
            </label>
            <button type="submit" disabled={carregando} style={estilos.botaoSecundario}>
              Buscar por ID
            </button>
          </form>

          {resultadoBusca && (
            <div style={estilos.infoBox}>
              <strong>Resultado da busca por ID:</strong>
              <pre style={estilos.pre}>{JSON.stringify(resultadoBusca, null, 2)}</pre>
            </div>
          )}

          <div style={estilos.listHeader}>
            <h3 style={estilos.formTitle}>Lista de registros</h3>
            <span style={estilos.countBadge}>{itens.length} carregado(s)</span>
          </div>
          {itens.length === 0 ? (
            <div style={estilos.emptyState}>
              <p style={{ color: cores.cinza, margin: 0 }}>
                Nenhum registro carregado ainda. Clique em "Buscar todos" para atualizar.
              </p>
            </div>
          ) : (
            <div style={estilos.lista}>
              {itens.map((item) => (
                <div key={item.id ?? JSON.stringify(item)} style={estilos.itemCard}>
                  <div style={estilos.itemHeader}>
                    <strong>ID: {item.id ?? "(sem id)"}</strong>
                    <div style={estilos.itemButtons}>
                      <button
                        type="button"
                        style={estilos.botaoSecundario}
                        onClick={() => iniciarEdicao(item)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        style={estilos.botaoExcluir}
                        onClick={() => excluir(item.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  {itemEditandoId === item.id ? (
                    <div style={estilos.editArea}>
                      {camposEditaveis.map((campo) => (
                        <label key={campo.nome} style={estilos.label}>
                          {campo.nome} ({campo.tipo}):
                          <input
                            style={estilos.input}
                            type={campo.tipo === "number" ? "number" : "text"}
                            step={
                              campo.nome === "preco" || campo.nome === "nota" ? "0.01" : undefined
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
                      <div style={estilos.itemButtons}>
                        <button
                          type="button"
                          style={estilos.botaoPrimario}
                          onClick={() => salvarEdicao(item.id)}
                        >
                          Salvar edição
                        </button>
                        <button
                          type="button"
                          style={estilos.botaoSecundario}
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
                    <pre style={estilos.pre}>{JSON.stringify(item, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const estilos = {
  page: {
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    padding: 20,
    color: cores.texto
  },
  container: {
    maxWidth: 960,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  hero: {
    backgroundColor: "#eff6ffd9",
    border: `1px solid ${cores.azulClaro}`,
    borderRadius: 14,
    padding: 18,
    boxShadow: cores.sombra
  },
  heroBadge: {
    margin: 0,
    marginBottom: 8,
    color: cores.azulEscuro,
    fontWeight: "bold",
    fontSize: 13
  },
  titulo: {
    margin: 0,
    marginBottom: 6
  },
  subtitulo: {
    marginTop: 0,
    marginBottom: 12,
    color: cores.cinza
  },
  stepsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8
  },
  stepChip: {
    backgroundColor: "#dbeafe",
    border: `1px solid ${cores.borda}`,
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 13,
    color: "#334155"
  },
  card: {
    backgroundColor: cores.card,
    border: `1px solid ${cores.borda}`,
    borderRadius: 8,
    padding: 16,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
  },
  gamificacaoCard: {
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff"
  },
  gamificacaoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  },
  sectionTitle: {
    marginTop: 0
  },
  badgeNivel: {
    backgroundColor: "#bfdbfe",
    color: "#1e3a8a",
    border: "1px solid #60a5fa",
    borderRadius: 999,
    padding: "5px 10px",
    fontSize: 12,
    fontWeight: "bold"
  },
  progressBarTrack: {
    width: "100%",
    backgroundColor: "#cbd5e1",
    borderRadius: 999,
    overflow: "hidden",
    height: 12,
    marginTop: 10,
    marginBottom: 12
  },
  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #2563eb 0%, #14b8a6 100%)",
    transition: "width 200ms ease"
  },
  gamificacaoActions: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 12
  },
  desafiosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 8
  },
  desafioCard: {
    border: `1px solid ${cores.borda}`,
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f0f9ff"
  },
  desafioCardConcluido: {
    borderColor: "#86efac",
    backgroundColor: "#f0fdf4"
  },
  desafioTitulo: {
    margin: 0,
    marginBottom: 4,
    fontWeight: "bold",
    fontSize: 14
  },
  desafioDescricao: {
    margin: 0,
    color: cores.cinza,
    fontSize: 13
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 10
  },
  input: {
    border: `1px solid ${cores.borda}`,
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 14,
    backgroundColor: "#f8fafc"
  },
  endpoint: {
    marginBottom: 0,
    color: cores.cinza
  },
  corsBox: {
    borderLeft: `6px solid ${cores.azul}`,
    backgroundColor: "#eff6ff"
  },
  infoBox: {
    border: `1px solid ${cores.borda}`,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#eff6ff"
  },
  miniHint: {
    marginTop: 8,
    marginBottom: 0,
    fontSize: 13,
    color: cores.cinza
  },
  statusTitle: {
    marginTop: 0,
    marginBottom: 8,
    fontSize: 12,
    textTransform: "uppercase",
    color: cores.cinza,
    letterSpacing: 0.4
  },
  loadingText: {
    marginBottom: 0,
    marginTop: 8,
    color: cores.azulEscuro,
    fontSize: 13
  },
  form: {
    border: `1px solid ${cores.borda}`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f0f9ff"
  },
  formTitle: {
    marginTop: 0
  },
  actionsRow: {
    display: "flex",
    gap: 8,
    marginBottom: 12
  },
  buscarForm: {
    border: `1px solid ${cores.borda}`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#f0f9ff"
  },
  botaoPrimario: {
    backgroundColor: cores.azul,
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "10px 12px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  botaoSecundario: {
    backgroundColor: "#cbd5e1",
    color: cores.texto,
    border: "none",
    borderRadius: 6,
    padding: "10px 12px",
    cursor: "pointer"
  },
  botaoExcluir: {
    backgroundColor: cores.vermelho,
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "10px 12px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  botaoReiniciar: {
    backgroundColor: cores.amareloClaro,
    color: cores.amarelo,
    border: `1px solid #fcd34d`,
    borderRadius: 6,
    padding: "8px 12px",
    fontWeight: "bold",
    cursor: "pointer",
    width: "fit-content"
  },
  listHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  countBadge: {
    fontSize: 12,
    backgroundColor: cores.azulClaro,
    color: cores.azulEscuro,
    borderRadius: 999,
    padding: "4px 10px",
    fontWeight: "bold"
  },
  emptyState: {
    border: `1px dashed ${cores.borda}`,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#e0f2fe"
  },
  lista: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  itemCard: {
    border: `1px solid ${cores.borda}`,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f8fafc"
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  itemButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  },
  editArea: {
    marginTop: 12
  },
  pre: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    backgroundColor: "#e2e8f0",
    borderRadius: 6,
    padding: 10
  }
};

export default App;
