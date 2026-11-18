/**
 * Hangar Embraer — Integração Frontend <-> Backend (Spring Boot REST API)
 * Endpoints consumidos em http://localhost:8081/aviao:
 *  - POST   /aviao              -> Salvar nova aeronave (JSON no body)
 *  - GET    /aviao?nome={nome}  -> Buscar aeronave por nome (Query Param)
 *  - GET    /aviao/todos        -> Listar todas as aeronaves
 *  - PUT    /aviao?id={id}      -> Atualizar aeronave por ID (Query Param + JSON no body)
 *  - DELETE /aviao?nome={nome}  -> Deletar aeronave por nome (Query Param)
 */

const API_URL = "http://localhost:8081/aviao";

let ultimaAeronaveBuscada = null;

// Referências aos elementos do formulário e interface
const elements = {
    form: document.getElementById("aviaoForm"),
    id: document.getElementById("aviaoId"),
    nome: document.getElementById("aviaoNome"),
    modelo: document.getElementById("aviaoModelo"),
    fabricante: document.getElementById("aviaoFabricante"),
    autonomia: document.getElementById("aviaoAutonomia"),
    capacidade: document.getElementById("aviaoCapacidade"),
    buscaNome: document.getElementById("buscaNome"),

    btnCadastrar: document.getElementById("btnCadastrar"),
    btnAtualizar: document.getElementById("btnAtualizar"),
    btnLimpar: document.getElementById("btnLimpar"),
    btnBuscar: document.getElementById("btnBuscar"),
    btnDeletar: document.getElementById("btnDeletar"),
    btnAtualizarLista: document.getElementById("btnAtualizarLista"),
    btnCarregarParaEdicao: document.getElementById("btnCarregarParaEdicao"),

    feedbackBanner: document.getElementById("feedbackBanner"),
    apiStatusDot: document.getElementById("apiStatusDot"),
    apiStatusText: document.getElementById("apiStatusText"),

    resultadoBusca: document.getElementById("resultadoBusca"),
    resultadoBuscaVazio: document.getElementById("resultadoBuscaVazio"),
    resId: document.getElementById("resId"),
    resNome: document.getElementById("resNome"),
    resModelo: document.getElementById("resModelo"),
    resFabricante: document.getElementById("resFabricante"),
    resAutonomia: document.getElementById("resAutonomia"),
    resCapacidade: document.getElementById("resCapacidade"),

    tabelaFrotaBody: document.getElementById("tabelaFrotaBody"),
    fleetCounter: document.getElementById("fleetCounter"),

    monMethod: document.getElementById("monMethod"),
    monUrl: document.getElementById("monUrl"),
    monStatus: document.getElementById("monStatus"),
    monReqBody: document.getElementById("monReqBody"),
    monResBody: document.getElementById("monResBody")
};

/**
 * Exibe mensagens de feedback (sucesso, erro ou alerta) no topo da tela.
 */
function mostrarFeedback(mensagem, tipo = "success") {
    elements.feedbackBanner.textContent = mensagem;
    elements.feedbackBanner.className = `feedback-banner ${tipo}`;
}

/**
 * Atualiza o indicador visual de conexão com o servidor Java no cabeçalho.
 */
function atualizarStatusApi(online) {
    if (online) {
        elements.apiStatusDot.className = "status-dot online";
        elements.apiStatusText.textContent = "Backend Online (localhost:8081)";
    } else {
        elements.apiStatusDot.className = "status-dot offline";
        elements.apiStatusText.textContent = "Backend Offline / Inacessível";
    }
}

/**
 * Atualiza o Monitor HTTP Didático para demonstrar a requisição e resposta em tempo real.
 */
function registrarMonitorHttp({ method, url, status, ok, reqBody, resBody }) {
    const badgeClassMap = {
        GET: "badge-get",
        POST: "badge-post",
        PUT: "badge-put",
        DELETE: "badge-delete"
    };

    elements.monMethod.textContent = method;
    elements.monMethod.className = `http-badge ${badgeClassMap[method] || "badge-get"}`;
    elements.monUrl.textContent = url;

    elements.monStatus.textContent = status;
    elements.monStatus.className = `status-code ${ok ? "ok" : "err"}`;

    elements.monReqBody.textContent = reqBody
        ? JSON.stringify(reqBody, null, 2)
        : "Nenhum corpo enviado (requisição sem body)";

    if (resBody === undefined || resBody === null || resBody === "") {
        elements.monResBody.textContent = "(Corpo vazio — apenas código de status HTTP)";
    } else if (typeof resBody === "string") {
        elements.monResBody.textContent = resBody;
    } else {
        elements.monResBody.textContent = JSON.stringify(resBody, null, 2);
    }
}

/**
 * Lê e valida os campos do formulário para envio em POST ou PUT.
 */
function obterDadosFormulario(exigirTodosCampos = true) {
    const nome = elements.nome.value.trim();
    const modelo = elements.modelo.value.trim();
    const fabricante = elements.fabricante.value.trim();
    const autonomiaStr = elements.autonomia.value.trim();
    const capacidadeStr = elements.capacidade.value.trim();

    if (exigirTodosCampos && (!nome || !modelo || !fabricante || !autonomiaStr || !capacidadeStr)) {
        mostrarFeedback("Preencha todos os campos obrigatórios (Nome, Modelo, Fabricante, Autonomia e Capacidade).", "warning");
        return null;
    }

    const payload = {};

    if (nome) payload.nome = nome;
    if (modelo) payload.modelo = modelo;
    if (fabricante) payload.fabricante = fabricante;

    if (autonomiaStr) {
        const autonomia = Number.parseInt(autonomiaStr, 10);
        if (!Number.isInteger(autonomia) || autonomia <= 0) {
            mostrarFeedback("A autonomia deve ser um número inteiro positivo (em km).", "warning");
            return null;
        }
        payload.autonomia = autonomia;
    }

    if (capacidadeStr) {
        const capacidade = Number.parseInt(capacidadeStr, 10);
        if (!Number.isInteger(capacidade) || capacidade <= 0) {
            mostrarFeedback("A capacidade deve ser um número inteiro positivo (passageiros).", "warning");
            return null;
        }
        payload.capacidade = capacidade;
    }

    if (Object.keys(payload).length === 0) {
        mostrarFeedback("Informe ao menos um campo para enviar na atualização.", "warning");
        return null;
    }

    return payload;
}

/**
 * Preenche o formulário com os dados de uma aeronave (facilita o PUT por ID).
 */
function preencherFormulario(aviao) {
    elements.id.value = aviao.id ?? "";
    elements.nome.value = aviao.nome ?? "";
    elements.modelo.value = aviao.modelo ?? "";
    elements.fabricante.value = aviao.fabricante ?? "";
    elements.autonomia.value = aviao.autonomia ?? "";
    elements.capacidade.value = aviao.capacidade ?? "";
    elements.nome.focus();
    mostrarFeedback(`Aeronave "${aviao.nome}" (ID ${aviao.id}) carregada no formulário para edição via PUT.`, "warning");
}

function limparFormulario() {
    elements.form.reset();
    elements.id.value = "";
}

/**
 * POST /aviao — Cadastra uma nova aeronave enviando JSON no corpo da requisição.
 */
async function salvarAviao() {
    const dadosAviao = obterDadosFormulario(true);
    if (!dadosAviao) return;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dadosAviao)
        });

        const textoResposta = await response.text();
        registrarMonitorHttp({
            method: "POST",
            url: API_URL,
            status: `${response.status} ${response.statusText || (response.ok ? "OK" : "Erro")}`,
            ok: response.ok,
            reqBody: dadosAviao,
            resBody: textoResposta
        });

        if (!response.ok) {
            throw new Error(`Falha ao cadastrar aeronave (HTTP ${response.status}).`);
        }

        atualizarStatusApi(true);
        mostrarFeedback(`Aeronave "${dadosAviao.nome}" cadastrada com sucesso!`, "success");
        limparFormulario();
        await carregarFrota(false);
    } catch (error) {
        atualizarStatusApi(false);
        mostrarFeedback(`Erro na comunicação POST: ${error.message}`, "error");
    }
}

/**
 * PUT /aviao?id={id} — Atualiza uma aeronave existente informando o ID na URL e JSON no body.
 */
async function atualizarAviaoPorId() {
    const idStr = elements.id.value.trim();
    const id = Number.parseInt(idStr, 10);

    if (!idStr || !Number.isInteger(id) || id <= 0) {
        mostrarFeedback("Informe um ID numérico válido no campo 'ID da Aeronave' para atualizar via PUT.", "warning");
        elements.id.focus();
        return;
    }

    const dadosAviao = obterDadosFormulario(false);
    if (!dadosAviao) return;

    const url = `${API_URL}?id=${encodeURIComponent(id)}`;

    try {
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dadosAviao)
        });

        const textoResposta = await response.text();
        registrarMonitorHttp({
            method: "PUT",
            url,
            status: `${response.status} ${response.statusText || (response.ok ? "OK" : "Erro")}`,
            ok: response.ok,
            reqBody: dadosAviao,
            resBody: textoResposta
        });

        if (!response.ok) {
            throw new Error(`Não foi possível atualizar o ID ${id} (HTTP ${response.status}). Verifique se o ID existe.`);
        }

        atualizarStatusApi(true);
        mostrarFeedback(`Aeronave ID ${id} atualizada com sucesso via PUT!`, "success");
        limparFormulario();
        await carregarFrota(false);
    } catch (error) {
        mostrarFeedback(`Erro na comunicação PUT: ${error.message}`, "error");
    }
}

/**
 * GET /aviao?nome={nome} — Busca uma aeronave pelo nome exato.
 */
async function buscarAviaoPorNome() {
    const nome = elements.buscaNome.value.trim();
    if (!nome) {
        mostrarFeedback("Digite o nome da aeronave para realizar a busca (GET).", "warning");
        elements.buscaNome.focus();
        return;
    }

    const url = `${API_URL}?nome=${encodeURIComponent(nome)}`;

    try {
        const response = await fetch(url, {
            method: "GET"
        });

        if (!response.ok) {
            const erroTexto = await response.text();
            registrarMonitorHttp({
                method: "GET",
                url,
                status: `${response.status} ${response.statusText || "Erro"}`,
                ok: false,
                reqBody: null,
                resBody: erroTexto
            });
            ocultarResultadoBusca();
            throw new Error(`Aeronave "${nome}" não encontrada no sistema (HTTP ${response.status}).`);
        }

        const aviao = await response.json();
        registrarMonitorHttp({
            method: "GET",
            url,
            status: `${response.status} ${response.statusText || "OK"}`,
            ok: true,
            reqBody: null,
            resBody: aviao
        });

        atualizarStatusApi(true);
        exibirResultadoBusca(aviao);
        mostrarFeedback(`Aeronave "${aviao.nome}" localizada com sucesso!`, "success");
    } catch (error) {
        mostrarFeedback(`Erro na busca GET: ${error.message}`, "error");
    }
}

/**
 * DELETE /aviao?nome={nome} — Remove uma aeronave pelo nome exato.
 */
async function deletarAviaoPorNome(nomeAlvo) {
    const nome = (typeof nomeAlvo === "string" ? nomeAlvo : elements.buscaNome.value).trim();

    if (!nome) {
        mostrarFeedback("Digite o nome da aeronave que deseja deletar (DELETE).", "warning");
        elements.buscaNome.focus();
        return;
    }

    const confirmado = window.confirm(`Confirmar exclusão da aeronave "${nome}"? Esta operação executará DELETE /aviao?nome=${nome}.`);
    if (!confirmado) return;

    const url = `${API_URL}?nome=${encodeURIComponent(nome)}`;

    try {
        const response = await fetch(url, {
            method: "DELETE"
        });

        const textoResposta = await response.text();
        registrarMonitorHttp({
            method: "DELETE",
            url,
            status: `${response.status} ${response.statusText || (response.ok ? "OK" : "Erro")}`,
            ok: response.ok,
            reqBody: null,
            resBody: textoResposta
        });

        if (!response.ok) {
            throw new Error(`Falha ao deletar "${nome}" (HTTP ${response.status}).`);
        }

        atualizarStatusApi(true);
        if (ultimaAeronaveBuscada && ultimaAeronaveBuscada.nome === nome) {
            ocultarResultadoBusca();
        }
        if (elements.buscaNome.value.trim() === nome) {
            elements.buscaNome.value = "";
        }
        mostrarFeedback(`Aeronave "${nome}" removida com sucesso via DELETE!`, "success");
        await carregarFrota(false);
    } catch (error) {
        mostrarFeedback(`Erro na remoção DELETE: ${error.message}`, "error");
    }
}

/**
 * GET /aviao/todos — Lista todas as aeronaves cadastradas na tabela do hangar.
 */
async function carregarFrota(registrarNoMonitor = true) {
    const url = `${API_URL}/todos`;

    try {
        const response = await fetch(url, {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error(`Erro ao carregar lista da frota (HTTP ${response.status}).`);
        }

        const listaAvioes = await response.json();
        atualizarStatusApi(true);
        renderizarTabelaFrota(listaAvioes);

        if (registrarNoMonitor) {
            registrarMonitorHttp({
                method: "GET",
                url,
                status: `${response.status} ${response.statusText || "OK"}`,
                ok: true,
                reqBody: null,
                resBody: listaAvioes
            });
        }
    } catch (error) {
        atualizarStatusApi(false);
        renderizarTabelaErro(error.message);
        if (registrarNoMonitor) {
            registrarMonitorHttp({
                method: "GET",
                url,
                status: "Sem conexão",
                ok: false,
                reqBody: null,
                resBody: error.message
            });
        }
    }
}

/**
 * Exibe os detalhes da aeronave encontrada usando textContent (prevenção contra XSS).
 */
function exibirResultadoBusca(aviao) {
    ultimaAeronaveBuscada = aviao;
    elements.resId.textContent = `ID: ${aviao.id ?? "-"}`;
    elements.resNome.textContent = aviao.nome ?? "-";
    elements.resModelo.textContent = aviao.modelo ?? "-";
    elements.resFabricante.textContent = aviao.fabricante ?? "-";
    elements.resAutonomia.textContent = aviao.autonomia != null ? `${aviao.autonomia} km` : "-";
    elements.resCapacidade.textContent = aviao.capacidade != null ? `${aviao.capacidade} passageiros` : "-";

    elements.resultadoBuscaVazio.classList.add("hidden");
    elements.resultadoBusca.classList.remove("hidden");
}

function ocultarResultadoBusca() {
    ultimaAeronaveBuscada = null;
    elements.resultadoBusca.classList.add("hidden");
    elements.resultadoBuscaVazio.classList.remove("hidden");
}

/**
 * Renderiza a tabela de aeronaves de forma segura via createElement + textContent.
 */
function renderizarTabelaFrota(avioes) {
    elements.tabelaFrotaBody.replaceChildren();
    const total = Array.isArray(avioes) ? avioes.length : 0;
    elements.fleetCounter.textContent = `${total} ${total === 1 ? "aeronave" : "aeronaves"}`;

    if (total === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 7;
        td.className = "empty-row";
        td.textContent = "Nenhuma aeronave cadastrada no hangar até o momento.";
        tr.appendChild(td);
        elements.tabelaFrotaBody.appendChild(tr);
        return;
    }

    avioes.forEach((aviao) => {
        const tr = document.createElement("tr");

        const tdId = document.createElement("td");
        tdId.textContent = aviao.id ?? "-";

        const tdNome = document.createElement("td");
        tdNome.textContent = aviao.nome ?? "-";

        const tdModelo = document.createElement("td");
        tdModelo.textContent = aviao.modelo ?? "-";

        const tdFabricante = document.createElement("td");
        tdFabricante.textContent = aviao.fabricante ?? "-";

        const tdAutonomia = document.createElement("td");
        tdAutonomia.textContent = aviao.autonomia != null ? `${aviao.autonomia} km` : "-";

        const tdCapacidade = document.createElement("td");
        tdCapacidade.textContent = aviao.capacidade != null ? `${aviao.capacidade} pax` : "-";

        const tdAcoes = document.createElement("td");
        tdAcoes.className = "actions-col";

        const divAcoes = document.createElement("div");
        divAcoes.className = "row-actions";

        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.className = "btn btn-outline btn-sm";
        btnEditar.textContent = "Editar";
        btnEditar.addEventListener("click", () => preencherFormulario(aviao));

        const btnExcluir = document.createElement("button");
        btnExcluir.type = "button";
        btnExcluir.className = "btn btn-danger btn-sm";
        btnExcluir.textContent = "Excluir";
        btnExcluir.addEventListener("click", () => deletarAviaoPorNome(aviao.nome));

        divAcoes.append(btnEditar, btnExcluir);
        tdAcoes.appendChild(divAcoes);

        tr.append(tdId, tdNome, tdModelo, tdFabricante, tdAutonomia, tdCapacidade, tdAcoes);
        elements.tabelaFrotaBody.appendChild(tr);
    });
}

function renderizarTabelaErro(mensagem) {
    elements.tabelaFrotaBody.replaceChildren();
    elements.fleetCounter.textContent = "Indisponível";

    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "empty-row";
    td.textContent = `Não foi possível conectar ao backend Java em ${API_URL}. Verifique se o Spring Boot está rodando na porta 8081. (${mensagem})`;
    tr.appendChild(td);
    elements.tabelaFrotaBody.appendChild(tr);
}

// Eventos dos botões e inicialização
elements.btnCadastrar.addEventListener("click", salvarAviao);
elements.btnAtualizar.addEventListener("click", atualizarAviaoPorId);
elements.btnLimpar.addEventListener("click", limparFormulario);
elements.btnBuscar.addEventListener("click", buscarAviaoPorNome);
elements.btnDeletar.addEventListener("click", () => deletarAviaoPorNome());
elements.btnAtualizarLista.addEventListener("click", () => carregarFrota(true));

elements.btnCarregarParaEdicao.addEventListener("click", () => {
    if (ultimaAeronaveBuscada) {
        preencherFormulario(ultimaAeronaveBuscada);
    }
});

elements.buscaNome.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        buscarAviaoPorNome();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    carregarFrota(true);
});
