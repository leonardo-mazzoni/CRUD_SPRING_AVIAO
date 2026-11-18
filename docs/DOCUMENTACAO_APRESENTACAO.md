# Documentação Técnica e Guia para Apresentação Individual — CRUD Avião (Hangar Embraer)

**Disciplina:** (2026) INI3B: LPVI - Java 2  
**Avaliação:** 4º Bimestre — Integração de Frontend com Backend utilizando Inteligência Artificial  
**Projeto:** `cadastro-aviao` (`com.embraer.cadastro_aviao`)  
**Porta da API:** `8081` | **Endpoint Base:** `http://localhost:8081/aviao`

---

## 1. Visão Geral da Arquitetura

O projeto foi organizado seguindo a arquitetura em camadas no backend Java (Spring Boot 4.1.1 + Spring Data JPA + PostgreSQL) integrada a um frontend web em HTML5, CSS3 e JavaScript puro (`Fetch API`) servido diretamente pela pasta `src/main/resources/static/`:

```text
[ Navegador / Frontend ]
   index.html + style.css + script.js
   (Fetch API + JSON + Query Params)
               │
               ▼  Requisições HTTP (CORS liberado)
[ Controller Layer ]
   AviaoController.java (@RestController, @RequestMapping("/aviao"))
               │
               ▼
[ Business / Service Layer ]
   AviaoService.java (@Service)
               │
               ▼
[ Infrastructure / Persistence Layer ]
   AviaoRepository.java (JpaRepository<Aviao, Integer>)
   Aviao.java (@Entity @Table(name = "aviao"))
               │
               ▼
[ Banco de Dados PostgreSQL ]
   jdbc:postgresql://localhost:5432/cadastro_aviao
```

### Estrutura da Entidade `Aviao` (`Aviao.java`)
| Campo | Tipo Java | Coluna no Banco | Obrigatório no Formulário | Uso |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `Integer` | `id` (`@GeneratedValue(strategy = GenerationType.AUTO)`) | Apenas no `PUT` | Identificador único para atualização |
| `nome` | `String` | `nome` | Sim | Identificação da aeronave e chave para `GET` / `DELETE` |
| `modelo` | `String` | `modelo` | Sim | Categoria/modelo da aeronave |
| `fabricante` | `String` | `fabricante` | Sim | Fabricante (ex: Embraer) |
| `autonomia` | `Integer` | `autonomia` | Sim | Alcance de voo em km |
| `capacidade` | `Integer` | `capacidade` | Sim | Capacidade de passageiros |

---

## 2. O Que Foi Feito em Cada Alteração (Parte por Parte do Código)

### 2.1. Alterações no Backend Java

#### A) `src/main/java/com/embraer/cadastro_aviao/business/AviaoService.java`
- **O que foi alterado:**
  1. Adicionado o `import java.util.List;`.
  2. Criado o método `listarTodos()`:
     ```java
     public List<Aviao> listarTodos(){
         return repository.findAll();
     }
     ```
- **Por que foi feito:** Os endpoints originais permitiam apenas buscar um avião por nome (`buscarAviaoPorNome`) e atualizar por `id` (`atualizarAviaoPorId`). Sem uma listagem geral, o usuário teria que decorar os `id`s e os `nome`s já salvos no PostgreSQL para testar `GET`, `PUT` e `DELETE`. Como `AviaoRepository` já estende `JpaRepository<Aviao, Integer>`, ele já possui o método `findAll()` pronto, bastando expô-lo na camada de serviço.
- **Código preservado:** Os métodos `salvarAviao`, `buscarAviaoPorNome`, `deletarAviaoPorNome` e `atualizarAviaoPorId` foram mantidos intactos.

#### B) `src/main/java/com/embraer/cadastro_aviao/controller/AviaoController.java`
- **O que foi alterado:**
  1. Adicionado o `import java.util.List;`.
  2. Adicionada a anotação `@CrossOrigin(origins = "*")` na classe `AviaoController`:
     ```java
     @RestController
     @RequestMapping("/aviao")
     @CrossOrigin(origins = "*")
     @RequiredArgsConstructor
     public class AviaoController {
     ```
  3. Criado o endpoint `GET /aviao/todos`:
     ```java
     @GetMapping("/todos")
     public ResponseEntity<List<Aviao>> listarTodos(){
         return ResponseEntity.ok(aviaoService.listarTodos());
     }
     ```
- **Por que foi feito:**
  - `@CrossOrigin(origins = "*")` garante que o navegador não bloqueie requisições por política de CORS (Cross-Origin Resource Sharing) caso o frontend seja aberto pelo Live Server (ex: porta `5500`), por outro host (`127.0.0.1`) ou diretamente como arquivo local, além de funcionar normalmente quando servido na mesma origem (`http://localhost:8081`).
  - `@GetMapping("/todos")` entrega ao frontend a lista completa da frota em JSON para preencher a tabela do hangar e permitir editar/excluir com um clique.
- **Código preservado:** Todos os 4 endpoints originais (`@PostMapping`, `@GetMapping`, `@DeleteMapping`, `@PutMapping`) permaneceram exatamente com suas assinaturas e contratos originais.

---

### 2.2. Criação do Frontend (`src/main/resources/static/`)

Colocar os arquivos estáticos em `src/main/resources/static/` permite que o próprio servidor Spring Boot entregue automaticamente `index.html`, `style.css` e `script.js` ao acessar `http://localhost:8081/`.

#### A) `src/main/resources/static/index.html`
- **Cabeçalho (`<header class="topbar">`)**: Identidade visual temática de aviação ("Hangar Embraer — Torre de Controle & Gestão de Frota de Aeronaves") com ícone vetorial de aeronave (SVG inline) e indicador de status em tempo real da conexão com o backend na porta `8081`.
- **Banner de Feedback (`#feedbackBanner`)**: Área com `role="alert"` para exibir confirmações de sucesso, alertas de validação ou mensagens de erro de rede/servidor.
- **Seção 1 — Formulário de Aeronave (`#aviaoForm`)**:
  - Campos correspondentes aos atributos exatos da entidade `Aviao.java`: `aviaoId` (`id`), `aviaoNome` (`nome`), `aviaoModelo` (`modelo`), `aviaoFabricante` (`fabricante`), `aviaoAutonomia` (`autonomia`), `aviaoCapacidade` (`capacidade`).
  - Botões com badges dos verbos HTTP: **Cadastrar Aeronave (`POST`)**, **Atualizar por ID (`PUT`)** e **Limpar**.
- **Seção 2 — Consulta e Remoção por Nome**:
  - Campo `#buscaNome` com botões **Buscar por Nome (`GET`)** e **Deletar por Nome (`DELETE`)**.
  - Card de ficha técnica (`#resultadoBusca`) exibindo os dados retornados pelo `GET /aviao?nome={nome}` e um botão para carregar a aeronave no formulário de edição.
- **Seção 3 — Tabela da Frota (`#tabelaFrotaBody`)**:
  - Exibe todos os registros retornados por `GET /aviao/todos`, contador de aeronaves e botões de ação rápida por linha (**Editar** para preencher o formulário de `PUT` e **Excluir** para acionar `DELETE`).
- **Seção 4 — Monitor de Comunicação HTTP (Didático)**:
  - Exibe em tempo real o último verbo HTTP utilizado (`GET`, `POST`, `PUT`, `DELETE`), a URL completa chamada, o código de status HTTP retornado, o JSON enviado no `Request Body` e o corpo da resposta recebida.

#### B) `src/main/resources/static/style.css`
- Paleta aeronáutica inspirada na Embraer: azul-marinho escuro (`#071b2e`, `#0a2540`), azul-céu (`#0284c7`, `#0ea5e9`), fundo cinza-gelo (`#f1f5f9`) e cartões brancos com bordas sutis.
- Badges coloridos por verbo HTTP (`POST` verde, `GET` azul, `PUT` âmbar/marrom, `DELETE` vermelho) para tornar a interface intuitiva e didática.
- Grid responsivo (`@media (max-width: 900px)` e `@media (max-width: 560px)`) adaptável a desktop e celular.

#### C) `src/main/resources/static/script.js`
- **Constante de integração:** `const API_URL = "http://localhost:8081/aviao";`.
- **Validação de entrada (`obterDadosFormulario`)**: Impede o envio de campos obrigatórios vazios no `POST` e valida que `autonomia`, `capacidade` e `id` (no `PUT`) sejam inteiros positivos antes de chamar o backend.
- **Codificação segura de URL:** Utiliza `encodeURIComponent(...)` ao montar `?nome=...` e `?id=...`, evitando quebra de URL caso o nome da aeronave tenha espaços ou caracteres especiais (ex: `"Phenom 300"`).
- **Prevenção contra XSS (Cross-Site Scripting):** Toda renderização de dados vindos do backend na tabela (`renderizarTabelaFrota`) e no card de busca (`exibirResultadoBusca`) utiliza `document.createElement()` e `.textContent` em vez de interpolar strings em `innerHTML`.
- **Confirmação de exclusão:** `deletarAviaoPorNome()` solicita confirmação via `window.confirm` antes de disparar o verbo `DELETE`.
- **Monitor HTTP (`registrarMonitorHttp`)**: Captura método, URL, status, payload enviado e resposta para exibição imediata no painel inferior.

---

## 3. Respostas às Perguntas da Apresentação Individual

### Pergunta 1: Como o frontend realiza uma requisição HTTP ao backend?
O frontend utiliza a **Fetch API** nativa do JavaScript (`fetch(url, options)`) com funções assíncronas (`async` / `await`) dentro do arquivo `script.js`.
- Primeiro, definimos a URL base do controller Spring Boot: `const API_URL = "http://localhost:8081/aviao";`.
- Quando o usuário clica em um botão (como **Cadastrar**, **Buscar**, **Atualizar** ou **Deletar**), o evento dispara uma função JavaScript (ex: `salvarAviao()`, `buscarAviaoPorNome()`).
- Essa função chama `await fetch(url, { method, headers, body })`, que envia uma requisição HTTP pela rede para o servidor Tomcat embutido no Spring Boot na porta `8081` e aguarda de forma não bloqueante a resposta (`Response`).

---

### Pergunta 2: Como são utilizados os verbos HTTP (`GET`, `POST`, `PUT`, `DELETE`) implementados no projeto?
Cada operação do CRUD está mapeada para um verbo HTTP específico tanto no `AviaoController.java` quanto no `script.js`:
1. **`POST` (`/aviao`) — Criar (Create):**
   - No frontend (`salvarAviao`): envia `method: "POST"` com os dados da nova aeronave no corpo JSON.
   - No backend (`@PostMapping`): o Spring chama `aviaoService.salvarAviao(aviao)`, que persiste o novo registro no PostgreSQL com `saveAndFlush`.
2. **`GET` (`/aviao?nome={nome}` e `/aviao/todos`) — Consultar (Read):**
   - No frontend (`buscarAviaoPorNome` e `carregarFrota`): envia `method: "GET"` sem corpo (`body`).
   - No backend (`@GetMapping` e `@GetMapping("/todos")`): consulta o banco via `findByNome(nome)` ou `findAll()` e devolve os dados em JSON.
3. **`PUT` (`/aviao?id={id}`) — Atualizar (Update):**
   - No frontend (`atualizarAviaoPorId`): envia `method: "PUT"` passando o `id` na query string e os novos campos no corpo JSON.
   - No backend (`@PutMapping`): localiza o registro pelo `id` (`findById(id)`), atualiza os atributos informados (mantendo os antigos caso algum venha `null`) e salva novamente no banco.
4. **`DELETE` (`/aviao?nome={nome}`) — Remover (Delete):**
   - No frontend (`deletarAviaoPorNome`): após confirmação do usuário, envia `method: "DELETE"` passando o `nome` na query string.
   - No backend (`@DeleteMapping`): executa `repository.deleteByNome(nome)` dentro de uma transação (`@Transactional`) no PostgreSQL.

---

### Pergunta 3: Como os dados são enviados do frontend para o backend?
Dependendo do endpoint definido no `AviaoController.java`, os dados são enviados de duas formas:
1. **No corpo da requisição em formato JSON (`@RequestBody` — usado no `POST` e `PUT`):**
   - O `script.js` coleta os valores dos inputs do formulário em um objeto JavaScript (`dadosAviao`), converte o objeto para uma string JSON usando `JSON.stringify(dadosAviao)` e define o cabeçalho `headers: { "Content-Type": "application/json" }`.
   - Esse cabeçalho informa ao Spring Boot que o corpo da requisição está em JSON, permitindo que a biblioteca Jackson desserialize automaticamente o JSON para um objeto Java da classe `Aviao`.
2. **Na URL como parâmetro de consulta / Query String (`@RequestParam` — usado no `GET`, `DELETE` e também para o `id` no `PUT`):**
   - Os parâmetros são anexados ao final da URL após `?`, utilizando `encodeURIComponent()` por segurança (ex.: `http://localhost:8081/aviao?nome=E195-E2` ou `http://localhost:8081/aviao?id=1`).
   - No backend, `@RequestParam String nome` ou `@RequestParam Integer id` extrai esses valores diretamente da URL.

---

### Pergunta 4: Como o backend processa a requisição e retorna uma resposta?
O processamento segue o fluxo das camadas do Spring Boot:
1. **Roteamento e Desserialização (`AviaoController.java`):** O Spring Web recebe a requisição HTTP na rota `/aviao`, verifica o verbo HTTP (`@PostMapping`, `@GetMapping`, `@PutMapping` ou `@DeleteMapping`), libera a origem via `@CrossOrigin(origins = "*")` e converte o JSON (`@RequestBody`) ou os parâmetros da URL (`@RequestParam`) em variáveis Java.
2. **Regra de Negócio (`AviaoService.java`):** O Controller delega a operação ao `AviaoService` (injetado via construtor com `@RequiredArgsConstructor`). No `PUT`, por exemplo, o Service busca a entidade existente por ID, constrói o objeto atualizado via Lombok `@Builder` e chama o repositório. No `GET` por nome, se não encontrar, lança `RuntimeException("Nome não encontrado")`.
3. **Persistência (`AviaoRepository.java` + PostgreSQL):** O `AviaoRepository` (que estende `JpaRepository<Aviao, Integer>`) usa o Hibernate/JPA para gerar e executar os comandos SQL (`INSERT`, `SELECT`, `UPDATE`, `DELETE`) no banco `cadastro_aviao` na porta `5432`.
4. **Resposta HTTP (`ResponseEntity`):**
   - Nos métodos `POST`, `PUT` e `DELETE`, o controller retorna `ResponseEntity.ok().build()`, gerando status **`200 OK`** sem corpo.
   - Nos métodos `GET` (`/aviao` e `/aviao/todos`), retorna `ResponseEntity.ok(...)` com o objeto `Aviao` ou `List<Aviao>`, que o Spring/Jackson serializa automaticamente para JSON com status **`200 OK`**.
   - Em caso de falha (como nome ou ID inexistente), o Spring devolve um status de erro HTTP (ex: `500`), tratado pelo frontend.

---

### Pergunta 5: Como o frontend recebe e apresenta os dados retornados pelo backend?
1. **Verificação de Status:** Ao receber o objeto `response` da função `fetch`, o `script.js` verifica `if (!response.ok)`. Se o status for de erro (4xx ou 5xx), ele lê o erro, atualiza o Monitor HTTP, exibe a mensagem em vermelho no `#feedbackBanner` e interrompe o fluxo.
2. **Leitura do Corpo da Resposta:**
   - Para `GET /aviao?nome=...` e `GET /aviao/todos`, o `script.js` chama `await response.json()`, convertendo o texto JSON enviado pelo Spring Boot de volta em objeto ou array JavaScript.
   - Para `POST`, `PUT` e `DELETE` (que retornam `ResponseEntity<Void>`), lê `await response.text()` apenas para registrar no Monitor HTTP e confirma o sucesso pelo status `200 OK`.
3. **Atualização Segura do DOM:**
   - Na busca individual, `exibirResultadoBusca(aviao)` preenche a ficha técnica usando `.textContent` e exibe o card `#resultadoBusca`.
   - Na listagem da frota, `renderizarTabelaFrota(avioes)` percorre o array recebido, cria linhas (`<tr>`) e células (`<td>`) dinamicamente com `document.createElement()` e `.textContent` (prevenindo XSS) e cria os botões **Editar** e **Excluir** vinculados a cada avião.
   - Após `POST`, `PUT` ou `DELETE`, o frontend chama `await carregarFrota(false)` automaticamente para manter a tabela sempre sincronizada com o PostgreSQL.

---

### Pergunta 6: Como o prompt elaborado orientou a IA na geração da interface?
O prompt foi estruturado como uma especificação técnica completa para eliminar ambiguidades e garantir alinhamento exato com o backend Java existente:
1. **Contexto da Stack e Endpoints Reais:** O prompt informou a URL exata (`http://localhost:8081/aviao`), os 4 verbos originais com seus parâmetros (`@RequestBody` vs `@RequestParam nome` e `@RequestParam id`) e a adição controlada de `@CrossOrigin(origins = "*")` + `GET /aviao/todos` para viabilizar a listagem da frota.
2. **Contrato Exato da Entidade `Aviao`:** Especificou os nomes exatos das propriedades JSON (`id`, `nome`, `modelo`, `fabricante`, `autonomia`, `capacidade`) e seus tipos (`Integer` e `String`), evitando erros de mapeamento com o Jackson no backend.
3. **Diretrizes de UI/UX e Tema:** Orientou a criação de uma interface simples, objetiva e com temática aeronáutica (Hangar Embraer), separando claramente o formulário `POST/PUT`, a busca/exclusão por nome `GET/DELETE`, a tabela da frota e um Monitor HTTP didático para a apresentação.
4. **Requisitos de Segurança e Boas Práticas:** Exigiu JavaScript puro (`Fetch API` com `async/await`), tratamento de erros `response.ok`, validação de campos numéricos, `encodeURIComponent` nas Query Strings e manipulação segura do DOM sem `innerHTML` com dados externos.

---

## 4. Prompt Refinado (Pronto para Entrega na Atividade)

> **Copie e utilize o prompt abaixo para entregar no campo "Prompt Utilizado" da avaliação:**

```text
Atue como um desenvolvedor Full-Stack sênior especialista em Java Spring Boot e Frontend Web (HTML5, CSS3 e JavaScript puro).

Tenho um backend REST em Java (Spring Boot) rodando na porta 8081 com banco PostgreSQL, cuja entidade Aviao (tabela "aviao") possui exatamente os seguintes campos JSON:
- id (Integer, gerado automaticamente pelo banco)
- nome (String)
- modelo (String)
- fabricante (String)
- autonomia (Integer, em km)
- capacidade (Integer, número de passageiros)

Atualmente o AviaoController (@RequestMapping("/aviao")) possui estes endpoints:
1. POST /aviao -> recebe @RequestBody Aviao (JSON) e retorna 200 OK sem corpo (Void).
2. GET /aviao?nome={nome} -> recebe @RequestParam String nome e retorna 200 OK com o objeto Aviao em JSON.
3. PUT /aviao?id={id} -> recebe @RequestParam Integer id na URL e @RequestBody Aviao (JSON) no corpo, retornando 200 OK sem corpo (Void).
4. DELETE /aviao?nome={nome} -> recebe @RequestParam String nome na URL e retorna 200 OK sem corpo (Void).

Quero que você orquestre a integração completa entre backend e frontend seguindo estas instruções:

1. Ajustes mínimos e seguros no Backend:
   - Adicione @CrossOrigin(origins = "*") no AviaoController para evitar bloqueios de CORS no navegador.
   - Adicione apenas um método listarTodos() no AviaoService (usando repository.findAll()) e um endpoint @GetMapping("/todos") no AviaoController retornando ResponseEntity<List<Aviao>>, para que o frontend consiga listar todas as aeronaves cadastradas sem alterar nenhum dos 4 endpoints existentes.

2. Criação do Frontend na pasta src/main/resources/static/ (index.html, style.css e script.js):
   - Use apenas HTML5, CSS3 e JavaScript Vanilla com Fetch API (async/await), sem frameworks externos.
   - Crie um visual simples, objetivo, responsivo e agradável com tema aeronáutico inspirado na Embraer (tons de azul-marinho aeronáutico, azul-céu e branco gelo), com badges identificando os verbos HTTP (POST, GET, PUT, DELETE) e indicador de status de conexão com o backend.
   - Organize a interface em 4 blocos claros:
     a) Formulário de Cadastro e Atualização: campos para id (com aviso de uso exclusivo no PUT), nome, modelo, fabricante, autonomia e capacidade; botões "Cadastrar Aeronave (POST)", "Atualizar por ID (PUT)" e "Limpar".
     b) Consulta e Exclusão por Nome: campo para digitar o nome exato da aeronave com botões "Buscar por Nome (GET)" e "Deletar por Nome (DELETE)", além de um card de ficha técnica para exibir o avião retornado pelo GET e um botão para carregá-lo no formulário de edição.
     c) Tabela da Frota no Hangar (GET /aviao/todos): exibe todas as aeronaves cadastradas com contador total e botões de ação rápida "Editar" (preenche o formulário para PUT) e "Excluir" (chama DELETE por nome com confirmação).
     d) Monitor HTTP Didático: painel mostrando o último verbo HTTP utilizado, a URL completa requisitada, o código de status HTTP retornado, o JSON enviado no Request Body e a resposta recebida do servidor, facilitando a demonstração ao vivo do funcionamento da integração.

3. Requisitos de Segurança e Robustez no script.js:
   - Defina API_URL = "http://localhost:8081/aviao".
   - Valide os campos antes do envio (campos obrigatórios no POST, inteiros positivos para autonomia, capacidade e id no PUT).
   - Use encodeURIComponent() em todos os parâmetros enviados via Query String (?nome= e ?id=).
   - Previna vulnerabilidades XSS renderizando todos os dados recebidos do backend via document.createElement() e textContent (nunca injete dados externos com innerHTML).
   - Trate erros HTTP verificando response.ok e capture falhas de rede com try/catch, exibindo feedback claro ao usuário.
   - Atualize automaticamente a tabela da frota após operações de POST, PUT e DELETE bem-sucedidas.
```
