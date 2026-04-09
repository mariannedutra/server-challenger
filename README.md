# Server Challenge — CRUD Tester Pedagógico

Aplicação web interativa para auxiliar estudantes da disciplina **Desenvolvimento de Software para Web** a testar e validar a implementação de APIs REST com operações CRUD.

O aluno configura a URL do seu servidor local, escolhe um contexto de dados e executa os desafios um a um, recebendo feedback em tempo real sobre o comportamento da API.

---

## O que o projeto faz

A aplicação oferece quatro contextos de dados para o estudante escolher:

- **Biblioteca** — livros com título, autor, descrição e número de páginas
- **Loja** — produtos com nome, preço e quantidade
- **Clínica** — pacientes com nome, idade e diagnóstico
- **Filmes** — filmes com título, diretor, ano e nota

Para cada contexto, o estudante deve completar cinco desafios que correspondem às operações HTTP básicas:

1. **POST** — cadastrar um novo item
2. **GET (todos)** — listar todos os itens cadastrados
3. **GET (por ID)** — buscar um item específico pelo identificador
4. **PUT** — editar um item existente
5. **DELETE** — remover um item

O progresso é acompanhado por uma barra visual com percentual de conclusão e marcação individual por desafio concluído.

---

## Stack

- **React** 18.3.1
- **Vite** 8.0.8
- JavaScript (JSX) com CSS puro

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) versão 18 ou superior
- npm (incluso com o Node.js)

---

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone <url-do-repositorio>
cd ServerChallenge
npm install
```

---

## Como executar

**Modo de desenvolvimento** (com hot reload):

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

**Build de produção:**

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

**Pré-visualizar o build localmente:**

```bash
npm run preview
```

---

## Como usar

1. Acesse a aplicação no navegador
2. Informe a URL base do seu servidor no campo indicado (ex.: `http://localhost:3000`)
3. Escolha um dos quatro contextos disponíveis
4. Execute os desafios em ordem, preenchendo os campos de cada operação
5. Acompanhe o progresso e corrija eventuais erros indicados pelo feedback da aplicação

Dicas de rotas esperadas e orientações sobre CORS estão disponíveis diretamente na interface, em seções recolhíveis.

---

## Observação sobre CORS

Como o frontend roda em uma porta diferente do servidor do estudante, é necessário que a API permita requisições de origens cruzadas. Configure o middleware de CORS no seu servidor para aceitar a origem `http://localhost:5173` (ou `*` durante o desenvolvimento).
