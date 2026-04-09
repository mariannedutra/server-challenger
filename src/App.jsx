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
  fundo: "#f4f7fb",
  card: "#ffffff",
  texto: "#1f2937",
  borda: "#d1d5db",
  azul: "#2563eb",
  verde: "#166534",
  verdeClaro: "#dcfce7",
  vermelho: "#b91c1c",
  vermelhoClaro: "#fee2e2",
  cinza: "#6b7280"
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
    } catch (erro) {
      setResultadoBusca(null);
      setFeedback({ tipo: "erro", mensagem: `Erro ao buscar por ID: ${erro.message}` });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ ...estilos.page, backgroundColor: cores.fundo, color: cores.texto }}>
      <div style={estilos.container}>
        <h1 style={estilos.titulo}>CRUD Tester Pedagógico</h1>
        <p style={estilos.subtitulo}>
          Use esta interface para validar as rotas REST do seu servidor local.
        </p>

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
        </section>

        <section style={estilos.card}>
          <h2 style={estilos.sectionTitle}>3) Operações CRUD</h2>

          <form onSubmit={cadastrar} style={estilos.form}>
            <h3 style={estilos.formTitle}>Cadastrar ({contextoAtual.entidade})</h3>
            {camposEditaveis.map((campo) => (
              <label key={campo.nome} style={estilos.label}>
                {campo.nome} ({campo.tipo}):
                <input
                  style={estilos.input}
                  type={campo.tipo === "number" ? "number" : "text"}
                  step={campo.nome === "preco" || campo.nome === "nota" ? "0.01" : undefined}
                  value={formCriar[campo.nome] ?? ""}
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

          <h3 style={estilos.formTitle}>Lista de registros</h3>
          {itens.length === 0 ? (
            <p style={{ color: cores.cinza }}>
              Nenhum registro carregado. Clique em "Buscar todos" para atualizar.
            </p>
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
    padding: 20
  },
  container: {
    maxWidth: 960,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 16
  },
  titulo: {
    marginBottom: 4
  },
  subtitulo: {
    marginTop: 0,
    color: cores.cinza
  },
  card: {
    backgroundColor: cores.card,
    border: `1px solid ${cores.borda}`,
    borderRadius: 8,
    padding: 16
  },
  sectionTitle: {
    marginTop: 0
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
    fontSize: 14
  },
  endpoint: {
    marginBottom: 0,
    color: cores.cinza
  },
  corsBox: {
    borderLeft: `6px solid ${cores.azul}`
  },
  infoBox: {
    border: `1px solid ${cores.borda}`,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9fafb"
  },
  form: {
    border: `1px solid ${cores.borda}`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
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
    marginBottom: 16
  },
  botaoPrimario: {
    backgroundColor: cores.azul,
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "10px 12px",
    cursor: "pointer"
  },
  botaoSecundario: {
    backgroundColor: "#e5e7eb",
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
    cursor: "pointer"
  },
  lista: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  itemCard: {
    border: `1px solid ${cores.borda}`,
    borderRadius: 8,
    padding: 12
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
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    padding: 10
  }
};

export default App;
